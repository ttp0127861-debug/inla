const { CognitoIdentityProviderClient, GetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { fail } = require("../lib/http");

const cognitoIdp = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1",
});

const GROUP_ORDER = ["ADMIN", "DIRECTOR", "EXECUTOR", "SALES", "QA", "R&D", "ACCOUNTING"];
const QUOTATION_ROLES = new Set(GROUP_ORDER);

const TASK_ROLE = {
  executor_intake: "EXECUTOR",
  qa_review: "QA",
  rnd_review: "R&D",
  executor_consolidation: "EXECUTOR",
  accounting_review: "ACCOUNTING",
  director_review: "DIRECTOR",
};

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

/** API Gateway may pass a subset of JWT claims; the Bearer token still carries `username` / `email`. */
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
  // Authorizer may remap `username` to a non-email value and overwrite the access token.
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

/**
 * Login is email; DB stores `sales_owner_username` as that email.
 * Prefer the Bearer access token for identity; authorizer claims may use a non-email `username`.
 */
function resolveActorUsername(event) {
  const fromToken = jwtPayloadFromEvent(event);
  if (fromToken) {
    const fromEmail = usernameFromClaims(fromToken);
    if (fromEmail.includes("@")) return fromEmail;
  }
  return usernameFromClaims(claimsOf(event) || {});
}

function quotationRole(groups) {
  const known = GROUP_ORDER.filter((group) => groups.includes(group));
  const extra = groups.filter((group) => !GROUP_ORDER.includes(group));
  return known[0] || extra[0] || "";
}

function buildPrincipal(event, username) {
  const claims = mergedIdentityClaims(event);
  const groups = groupsFromClaims(claims);
  return {
    username,
    role: quotationRole(groups),
    groups,
  };
}

function getPrincipal(event) {
  if (event.__principal) return event.__principal;
  return buildPrincipal(event, resolveActorUsername(event));
}

/**
 * Cognito access tokens use `username` = user `sub` (UUID), not the login email.
 * GetUser with the caller's access token returns the verified `email` attribute.
 */
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

function requireQuotationModule(event) {
  const claims = claimsOf(event);
  if (!claims) return fail(401, "UNAUTHORIZED", "A valid Cognito access token is required.");
  const role = quotationRole(groupsFromClaims(claims));
  if (!QUOTATION_ROLES.has(role)) {
    return fail(403, "FORBIDDEN", "Your role cannot access quotation APIs.");
  }
  return null;
}

function requireSales(event) {
  const denied = requireQuotationModule(event);
  if (denied) return denied;
  if (getPrincipal(event).role !== "SALES") {
    return fail(403, "FORBIDDEN", "Only SALES can perform this action.");
  }
  return null;
}

function requireWorkflowMutation(event) {
  const denied = requireQuotationModule(event);
  if (denied) return denied;
  if (getPrincipal(event).role === "ADMIN") {
    return fail(403, "FORBIDDEN", "ADMIN is read-only for workflow mutations.");
  }
  return null;
}

function requireRole(event, role) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  if (getPrincipal(event).role !== role) {
    return fail(403, "FORBIDDEN", `Only ${role} can perform this action.`);
  }
  return null;
}

function requireTaskRole(event, taskType) {
  const expected = TASK_ROLE[taskType];
  if (!expected) return fail(400, "VALIDATION_ERROR", "Invalid task type.");
  return requireRole(event, expected);
}

function isSales(event) {
  return getPrincipal(event).role === "SALES";
}

function isAdmin(event) {
  return getPrincipal(event).role === "ADMIN";
}

module.exports = {
  requireQuotationModule,
  requireSales,
  requireWorkflowMutation,
  requireRole,
  requireTaskRole,
  enrichPrincipal,
  getPrincipal,
  isSales,
  isAdmin,
  seesAllQuotations: (event) => !isSales(event),
  claimsOf,
  QUOTATION_ROLES,
  TASK_ROLE,
};
