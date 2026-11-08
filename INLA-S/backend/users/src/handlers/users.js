const { json, fail } = require("../lib/http");
const { parsePagination } = require("../lib/request");
const { isSelf, decodeUsername } = require("../middleware/auth");
const { parseCreate, parseUpdate } = require("../services/validation");
const users = require("../services/cognito");

function readBody(event) {
  if (!event.body) return {};
  const text = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const error = new Error("Invalid body.");
      error.name = "ValidationError";
      throw error;
    }
    return parsed;
  } catch (error) {
    if (error.name === "ValidationError") throw error;
    const invalid = new Error("Invalid JSON body.");
    invalid.name = "ValidationError";
    throw invalid;
  }
}

function usernameFrom(event) {
  const raw = event.pathParameters?.username;
  if (!raw) {
    const error = new Error("Invalid username.");
    error.name = "ValidationError";
    throw error;
  }
  return decodeUsername(raw);
}

function matchesQuery(user, query) {
  if (query.role && user.role !== query.role) return false;
  if (query.enabled === "true" && !user.enabled) return false;
  if (query.enabled === "false" && user.enabled) return false;
  const term = (query.q || "").trim().toLowerCase();
  if (!term) return true;
  return [user.name, user.email, user.phoneNumber, user.username]
    .some((value) => String(value).toLowerCase().includes(term));
}

async function list(event) {
  const pagination = parsePagination(event.queryStringParameters || {});
  const listed = await users.listUsers();
  const filtered = listed.filter((user) => matchesQuery(user, event.queryStringParameters || {}));
  const total = filtered.length;
  const start = pagination.offset;
  const usersPage = filtered.slice(start, start + pagination.pageSize);
  return json(200, {
    users: usersPage,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
  });
}

async function get(event) {
  return json(200, { user: await users.getUser(usernameFrom(event)) });
}

async function create(event) {
  const created = await users.createUser(parseCreate(readBody(event)));
  return json(201, { user: created });
}

async function update(event) {
  const username = usernameFrom(event);
  return json(200, { user: await users.updateUser(username, parseUpdate(readBody(event))) });
}

async function disable(event) {
  const username = usernameFrom(event);
  if (isSelf(event, username)) return fail(403, "FORBIDDEN", "You cannot disable your own account.");
  return json(200, { user: await users.setEnabled(username, false) });
}

async function enable(event) {
  return json(200, { user: await users.setEnabled(usernameFrom(event), true) });
}

async function resetPassword(event) {
  const username = usernameFrom(event);
  await users.resetPassword(username);
  return json(200, { username, message: "Password reset email sent." });
}

module.exports = { list, get, create, update, disable, enable, resetPassword };
