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
  if (error.code === "23505") {
    return fail(409, "CONFLICT", "A conflicting record already exists.");
  }
  if (error.code === "23503") {
    return fail(400, "VALIDATION_ERROR", "Invalid customer or contact reference.");
  }
  return fail(500, "INTERNAL_ERROR", "Unexpected error.");
}

module.exports = { json, fail, mapError };
