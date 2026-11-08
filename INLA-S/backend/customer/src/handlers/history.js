const { json } = require("../lib/http");
const { pathParam, parsePagination } = require("../lib/request");
const { loadCustomerForAccess } = require("../services/access");
const historyService = require("../services/history");

async function list(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await historyService.listHistory(loaded.customer.id, pagination));
}

module.exports = { list };
