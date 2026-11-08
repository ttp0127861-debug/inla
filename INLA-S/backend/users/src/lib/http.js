function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function fail(statusCode, code, message) {
  return json(statusCode, { error: { code, message } });
}

function mapError(error) {
  console.error(error.name || "Error", error.message);
  const name = error.name || "";
  if (name === "UserNotFoundException" || name === "ResourceNotFoundException") {
    return fail(404, "NOT_FOUND", "User not found.");
  }
  if (name === "UsernameExistsException") return fail(409, "CONFLICT", "A user with this email already exists.");
  if (name === "ExecutorConflict") return fail(409, "CONFLICT", error.message);
  if (name === "InvalidParameterException") return fail(400, "VALIDATION_ERROR", error.message);
  if (name === "CodeDeliveryFailureException") {
    return fail(502, "EMAIL_FAILED", "Cognito could not send the email.");
  }
  if (name === "TooManyRequestsException" || name === "LimitExceededException") {
    return fail(429, "TOO_MANY_REQUESTS", "Too many requests. Try again later.");
  }
  if (name === "NotAuthorizedException") return fail(403, "FORBIDDEN", "Cognito rejected this operation.");
  return fail(500, "INTERNAL_ERROR", "Unexpected error.");
}

module.exports = { json, fail, mapError };
