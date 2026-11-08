const { neon } = require("@neondatabase/serverless");

const GROUP_ORDER = ["ADMIN", "DIRECTOR", "EXECUTOR", "SALES", "QA", "R&D", "ACCOUNTING"];

let sql;

/** Single env var for Neon Postgres (migrations, seeds, Lambda runtime). */
const DATABASE_URL_ENV = "DATABASE_URL";

function readDatabaseUrl() {
  const value = process.env[DATABASE_URL_ENV];
  if (!value || !value.trim()) {
    throw new Error(`${DATABASE_URL_ENV} is not configured.`);
  }
  return value.trim();
}

function isDatabaseConfigured() {
  return Boolean(process.env[DATABASE_URL_ENV]?.trim());
}

function databaseUrl() {
  return readDatabaseUrl();
}

function client() {
  if (!sql) sql = neon(databaseUrl(), { fullResults: true });
  return sql;
}

function safeMessage(error) {
  const message = error && error.message ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]");
}

function textClaim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function groupsFromClaims(claims) {
  const raw = claims["cognito:groups"];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return String(raw)
    .replace(/[\[\]]/g, "")
    .split(/[\s,]+/)
    .filter(Boolean);
}

function primaryRole(groups) {
  const known = GROUP_ORDER.filter((group) => groups.includes(group));
  const extra = groups.filter((group) => !GROUP_ORDER.includes(group));
  return known[0] || extra[0] || "";
}

function jwtPayloadFromEvent(event) {
  const headers = event?.headers || {};
  const auth = headers.authorization || headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    let body = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = body.length % 4;
    if (pad) body += "=".repeat(4 - pad);
    return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function usernameFromClaims(claims) {
  const email = textClaim(claims.email);
  const cognitoUsername = textClaim(claims["cognito:username"]);
  const usernameClaim = textClaim(claims.username);
  for (const value of [email, usernameClaim, cognitoUsername]) {
    if (value && value.includes("@")) return value.toLowerCase();
  }
  return (cognitoUsername || usernameClaim || email || "").toLowerCase();
}

function actorFromEvent(event) {
  if (event.__principal) {
    return {
      username: textClaim(event.__principal.username),
      role: textClaim(event.__principal.role),
      requestId: textClaim(event.requestContext?.requestId),
    };
  }
  const fromAuthorizer = event.requestContext?.authorizer?.jwt?.claims || {};
  const fromToken = jwtPayloadFromEvent(event) || {};
  const claims = { ...fromAuthorizer, ...fromToken };
  const fromEmail = fromToken && usernameFromClaims(fromToken).includes("@")
    ? usernameFromClaims(fromToken)
    : usernameFromClaims(fromAuthorizer);
  return {
    username: fromEmail,
    role: primaryRole(groupsFromClaims(claims)),
    requestId: textClaim(event.requestContext?.requestId),
  };
}

function auditActor(input) {
  if (input && input.requestContext) return actorFromEvent(input);
  const source = input || {};
  return {
    username: textClaim(source.username),
    role: textClaim(source.role),
    requestId: textClaim(source.requestId),
  };
}

async function query(text, params) {
  try {
    return await client().query(text, params);
  } catch (error) {
    console.error("Database query failed:", safeMessage(error));
    throw error;
  }
}

async function transaction(fn) {
  try {
    return await client().transaction(fn);
  } catch (error) {
    console.error("Database transaction failed:", safeMessage(error));
    throw error;
  }
}

async function runWithRequestContext(eventOrContext, fn) {
  const actor = auditActor(eventOrContext);
  try {
    const results = await client().transaction((txn) => {
      const statements = fn(txn);
      if (!Array.isArray(statements)) {
        throw new Error("runWithRequestContext callback must return an array of queries.");
      }
      return [
        txn.query("SELECT set_config('audit.actor_username', $1, true)", [actor.username]),
        txn.query("SELECT set_config('audit.actor_role', $1, true)", [actor.role]),
        txn.query("SELECT set_config('audit.request_id', $1, true)", [actor.requestId]),
        ...statements,
      ];
    });
    return results.slice(3);
  } catch (error) {
    console.error("Database transaction failed:", safeMessage(error));
    throw error;
  }
}

module.exports = {
  query,
  transaction,
  runWithRequestContext,
  isDatabaseConfigured,
  DATABASE_URL_ENV,
};
