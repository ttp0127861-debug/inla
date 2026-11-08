const { CognitoIdentityProviderClient, GetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { fail } = require("../lib/http");

const cognitoIdp = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1",
});

const GROUP_ORDER = ["ADMIN", "DIRECTOR", "EXECUTOR", "SALES", "QA", "R&D", "ACCOUNTING"];

function claimsOf(event) {
  return event.requestContext?.authorizer?.jwt?.claims || null;
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

function textClaim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function bearerAccessToken(event) {
  const headers = event?.headers || {};
  const auth = headers.authorization || headers.Authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function jwtPayloadFromEvent(event) {
  const token = bearerAccessToken(event);
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

function mergedIdentityClaims(event) {
  const fromAuthorizer = claimsOf(event) || {};
  const fromToken = jwtPayloadFromEvent(event) || {};
  return { ...fromAuthorizer, ...fromToken };
}

function usernameFromClaims(claims) {
  const email = textClaim(claims.email);
  const cognitoUsername = textClaim(claims["cognito:username"]);
  const username = textClaim(claims.username);
  for (const value of [email, username, cognitoUsername]) {
    if (value && value.includes("@")) return value.toLowerCase();
  }
  return (cognitoUsername || username || email || "").toLowerCase();
}

function resolveActorUsername(event) {
  const fromToken = jwtPayloadFromEvent(event);
  if (fromToken) {
    const fromEmail = usernameFromClaims(fromToken);
    if (fromEmail.includes("@")) return fromEmail;
  }
  return usernameFromClaims(claimsOf(event) || {});
}

function customerRole(groups) {
  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("SALES")) return "SALES";
  const known = GROUP_ORDER.filter((group) => groups.includes(group));
  const extra = groups.filter((group) => !GROUP_ORDER.includes(group));
  return known[0] || extra[0] || "";
}

function buildPrincipal(event, username) {
  const claims = mergedIdentityClaims(event);
  const groups = groupsFromClaims(claims);
  return {
    username,
    role: customerRole(groups),
    groups,
  };
}

function getPrincipal(event) {
  if (event.__principal) return event.__principal;
  return buildPrincipal(event, resolveActorUsername(event));
}

/** Cognito access token `username` is often UUID; resolve login email via GetUser. */
async function enrichPrincipal(event) {
  if (event.__principal) return event.__principal;
  let username = resolveActorUsername(event);
  if (!username.includes("@")) {
    const token = bearerAccessToken(event);
    if (token) {
      try {
        const user = await cognitoIdp.send(new GetUserCommand({ AccessToken: token }));
        const email = (user.UserAttributes || []).find((attr) => attr.Name === "email")?.Value;
        if (email && email.includes("@")) username = email.toLowerCase();
      } catch (error) {
        console.warn("Cognito GetUser for actor email failed:", error.name || error.message);
      }
    }
  }
  event.__principal = buildPrincipal(event, username);
  return event.__principal;
}

function requireCustomerModule(event) {
  const claims = claimsOf(event);
  if (!claims) return fail(401, "UNAUTHORIZED", "A valid Cognito access token is required.");
  const role = customerRole(groupsFromClaims(claims));
  if (role !== "ADMIN" && role !== "SALES") {
    return fail(403, "FORBIDDEN", "Only ADMIN or SALES can access customer APIs.");
  }
  return null;
}

function requireAdmin(event) {
  const claims = claimsOf(event);
  if (!claims) return fail(401, "UNAUTHORIZED", "A valid Cognito access token is required.");
  if (!groupsFromClaims(claims).includes("ADMIN")) {
    return fail(403, "FORBIDDEN", "Only ADMIN can perform this action.");
  }
  return null;
}

function isAdmin(event) {
  return getPrincipal(event).role === "ADMIN";
}

module.exports = {
  requireCustomerModule,
  requireAdmin,
  enrichPrincipal,
  getPrincipal,
  isAdmin,
  claimsOf,
};
