const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query?.page || "1", 10) || 1);
  let pageSize = parseInt(query?.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = { parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
