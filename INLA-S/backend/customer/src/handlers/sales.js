const { json, fail } = require("../lib/http");
const { readBody, pathParam, parsePagination } = require("../lib/request");
const { requireAdmin } = require("../middleware/auth");
const { loadCustomerForAccess } = require("../services/access");
const salesService = require("../services/sales");
const { parseAddSales } = require("../services/validation");

async function list(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await salesService.listSalesRelations(loaded.customer.id, pagination));
}

async function add(event) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const relation = await salesService.addSalesRelation(
    event,
    loaded.customer.id,
    parseAddSales(readBody(event)).salesUsername
  );
  return json(201, { relation });
}

async function remove(event) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const code = pathParam(event, "code");
  const salesUsername = pathParam(event, "salesUsername").toLowerCase();
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const relation = await salesService.removeSalesRelation(event, loaded.customer.id, salesUsername);
  if (!relation) return fail(404, "NOT_FOUND", "Active sales relation not found.");
  return json(200, { relation });
}

module.exports = { list, add, remove };
