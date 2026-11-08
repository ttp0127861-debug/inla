const { json } = require("../lib/http");
const { pathParam, parsePagination } = require("../lib/request");
const quotationService = require("../services/quotations");
const { parseCustomerCodeParam } = require("../services/validation");

async function listForCustomer(event) {
  const customerCode = parseCustomerCodeParam(pathParam(event, "customerCode"));
  const pagination = parsePagination(event.queryStringParameters || {});
  const result = await quotationService.listQuotationsForCustomer(event, customerCode, pagination);
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = { listForCustomer };
