const { json } = require("../lib/http");
const users = require("../services/cognito");

async function list() {
  return json(200, { roles: await users.listRoles() });
}

module.exports = { list };
