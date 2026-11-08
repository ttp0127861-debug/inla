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

function pathParam(event, name) {
  const raw = event.pathParameters?.[name];
  if (!raw) {
    const error = new Error(`Invalid ${name}.`);
    error.name = "ValidationError";
    throw error;
  }
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return String(raw).trim();
  }
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query?.page || "1", 10) || 1);
  let pageSize = parseInt(query?.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = {
  readBody,
  pathParam,
  parsePagination,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};
