const { json, fail } = require("../lib/http");
const { readBody, pathParam, parsePagination } = require("../lib/request");
const { requireAdmin } = require("../middleware/auth");
const { loadCustomerForAccess } = require("../services/access");
const customerService = require("../services/customers");
const { mapCustomer } = require("../services/mappers");
const { parseCreateCustomer, parseUpdateCustomer, parseListFilters } = require("../services/validation");

async function list(event) {
  const filters = parseListFilters(event.queryStringParameters || {});
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await customerService.listCustomers(event, filters, pagination));
}

async function create(event) {
  const created = await customerService.createCustomer(event, parseCreateCustomer(readBody(event)));
  return json(201, { customer: created });
}

async function get(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  return json(200, { customer: mapCustomer(loaded.customer) });
}

async function update(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const updated = await customerService.updateCustomer(
    event,
    loaded.customer.id,
    parseUpdateCustomer(readBody(event))
  );
  if (!updated) return fail(404, "NOT_FOUND", "Customer not found.");
  return json(200, { customer: updated });
}

async function deactivate(event) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const customer = await customerService.setCustomerStatus(event, loaded.customer.id, "inactive");
  return json(200, { customer });
}

async function activate(event) {
  const denied = requireAdmin(event);
  if (denied) return denied;
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const customer = await customerService.setCustomerStatus(event, loaded.customer.id, "active");
  return json(200, { customer });
}

module.exports = { list, create, get, update, deactivate, activate };
