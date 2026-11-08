const { json } = require("../lib/http");
const { readBody, pathParam, parsePagination } = require("../lib/request");
const { requireSales } = require("../middleware/auth");
const { loadQuotationForRead, loadQuotationForSalesOwner } = require("../services/access");
const quotationService = require("../services/quotations");
const { submitQuotation } = require("../services/submit");
const {
  parseCreateQuotation,
  parseUpdateQuotationDraft,
  parseListFilters,
  parseQuotationCodeParam,
  parseResubmitSubmit,
  parseClone,
  parseBusinessOutcome,
} = require("../services/validation");

async function list(event) {
  const filters = parseListFilters(event.queryStringParameters || {});
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await quotationService.listQuotations(event, filters, pagination));
}

async function create(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const created = await quotationService.createQuotation(event, parseCreateQuotation(readBody(event)));
  if (created.statusCode) return created;
  return json(201, created);
}

async function get(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  return json(200, await quotationService.buildQuotationDetail(loaded.row));
}

async function updateDraft(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const updated = await quotationService.updateDraftQuotation(
    event,
    loaded.row,
    parseUpdateQuotationDraft(readBody(event))
  );
  if (updated.statusCode) return updated;
  return json(200, updated);
}

async function cancelDraft(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const cancelled = await quotationService.cancelDraftQuotation(event, loaded.row);
  if (cancelled.statusCode) return cancelled;
  return json(200, cancelled);
}

async function submit(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const body = readBody(event);
  const version = body.version;
  const result = await submitQuotation(event, loaded.row, {
    resubmitReason: body.resubmitReason,
    version,
  });
  if (result.statusCode) return result;
  return json(200, result);
}

async function resubmitPrepare(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const result = await quotationService.prepareResubmit(event, loaded.row);
  if (result.statusCode) return result;
  return json(200, result);
}

async function resubmitSubmit(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const parsed = parseResubmitSubmit(readBody(event));
  const result = await submitQuotation(event, loaded.row, parsed);
  if (result.statusCode) return result;
  return json(200, result);
}

async function clone(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const result = await quotationService.cloneQuotation(event, loaded.row, parseClone(readBody(event)));
  if (result.statusCode) return result;
  return json(201, result);
}

async function patchOutcome(event) {
  const denied = requireSales(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForSalesOwner(event, code);
  if (loaded.response) return loaded.response;
  const result = await quotationService.updateBusinessOutcome(
    event,
    loaded.row,
    parseBusinessOutcome(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = {
  list,
  create,
  get,
  updateDraft,
  cancelDraft,
  submit,
  resubmitPrepare,
  resubmitSubmit,
  clone,
  patchOutcome,
};
