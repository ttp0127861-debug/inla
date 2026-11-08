const { fail } = require("../lib/http");

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

const DIRECTORY_READ_GROUPS = new Set(["ADMIN", "SALES"]);

function requireAdmin(event) {
  const claims = claimsOf(event);
  if (!claims) return fail(401, "UNAUTHORIZED", "A valid Cognito access token is required.");
  if (!groupsFromClaims(claims).includes("ADMIN")) {
    return fail(403, "FORBIDDEN", "Only the ADMIN group can manage users.");
  }
  return null;
}

/** Read-only user directory for customer assignment UI (SALES) and admin. */
function requireUserDirectory(event) {
  const claims = claimsOf(event);
  if (!claims) return fail(401, "UNAUTHORIZED", "A valid Cognito access token is required.");
  const groups = groupsFromClaims(claims);
  if (!groups.some((group) => DIRECTORY_READ_GROUPS.has(group))) {
    return fail(403, "FORBIDDEN", "Only ADMIN or SALES can list users.");
  }
  return null;
}

function decodeUsername(username) {
  try {
    return decodeURIComponent(username).trim();
  } catch {
    return String(username || "").trim();
  }
}

function isSelf(event, username) {
  const claims = claimsOf(event) || {};
  const target = decodeUsername(username).toLowerCase();
  const candidates = [claims.username, claims["cognito:username"], claims.email];
  return candidates.some((value) => typeof value === "string" && value.trim().toLowerCase() === target);
}

module.exports = { requireAdmin, requireUserDirectory, isSelf, decodeUsername };
