const { fail, mapError } = require("./lib/http");
const { requireAdmin, requireUserDirectory } = require("./middleware/auth");
const users = require("./handlers/users");
const roles = require("./handlers/roles");

exports.handler = async (event) => {
  try {
    if (!process.env.USER_POOL_ID) return fail(500, "INTERNAL_ERROR", "USER_POOL_ID is not configured.");

    const key = event.routeKey;
    if (key === "GET /roles") {
      const denied = requireAdmin(event);
      if (denied) return denied;
      return roles.list();
    }
    if (key === "GET /users") {
      const denied = requireUserDirectory(event);
      if (denied) return denied;
      return users.list(event);
    }
    if (key === "GET /users/{username}") {
      const denied = requireUserDirectory(event);
      if (denied) return denied;
      return users.get(event);
    }

    const denied = requireAdmin(event);
    if (denied) return denied;
    if (key === "POST /users") return users.create(event);
    if (key === "PUT /users/{username}") return users.update(event);
    if (key === "POST /users/{username}/disable") return users.disable(event);
    if (key === "POST /users/{username}/enable") return users.enable(event);
    if (key === "POST /users/{username}/reset-password") return users.resetPassword(event);
    return fail(404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (error.name === "ValidationError") return fail(400, "VALIDATION_ERROR", error.message);
    return mapError(error);
  }
};
