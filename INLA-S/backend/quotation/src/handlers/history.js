const { json, fail } = require("../lib/http");
const { pathParam, parsePagination } = require("../lib/request");
const { loadQuotationForRead } = require("../services/access");
const historyService = require("../services/history");
const revisionService = require("../services/revisions");
const similarService = require("../services/similar");
const { parseQuotationCodeParam } = require("../services/validation");

async function history(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const pagination = parsePagination(event.queryStringParameters || {});
  const workflow = await historyService.listWorkflowHistory(loaded.row.id);
  const audit = await historyService.listAuditHistory(loaded.row.id, pagination);
  return json(200, { ...workflow, ...audit });
}

async function revisions(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await revisionService.listRevisions(loaded.row.id, pagination));
}

async function revisionDetail(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const revisionCode = pathParam(event, "revisionCode");
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const rev = await revisionService.getRevision(loaded.row.id, revisionCode);
  if (!rev) return fail(404, "NOT_FOUND", "Revision not found.");
  return json(200, rev);
}

async function similarProduct(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  return json(200, await similarService.similarByProduct(loaded.row));
}

async function similarCustomer(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  return json(200, await similarService.similarByCustomer(loaded.row));
}

module.exports = { history, revisions, revisionDetail, similarProduct, similarCustomer };
