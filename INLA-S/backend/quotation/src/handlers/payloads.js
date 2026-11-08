const { json } = require("../lib/http");
const { readBody, pathParam } = require("../lib/request");
const { requireWorkflowMutation, requireRole } = require("../middleware/auth");
const { loadQuotationForRead } = require("../services/access");
const payloadService = require("../services/payloads");
const {
  parseQuotationCodeParam,
  parseQaPayload,
  parseRndPayload,
  parseExecutorIntake,
  parseExecutorConsolidation,
  parseAccounting,
  parseDirectorDecision,
} = require("../services/validation");

async function putQa(event) {
  const denied = requireRole(event, "QA");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateQa(event, loaded.row, parseQaPayload(readBody(event)));
  if (result.statusCode) return result;
  return json(200, result);
}

async function putRnd(event) {
  const denied = requireRole(event, "R&D");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateRnd(event, loaded.row, parseRndPayload(readBody(event)));
  if (result.statusCode) return result;
  return json(200, result);
}

async function putExecutorIntake(event) {
  const denied = requireRole(event, "EXECUTOR");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateExecutorIntake(
    event,
    loaded.row,
    parseExecutorIntake(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

async function putExecutorConsolidation(event) {
  const denied = requireRole(event, "EXECUTOR");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateExecutorConsolidation(
    event,
    loaded.row,
    parseExecutorConsolidation(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

async function putAccounting(event) {
  const denied = requireRole(event, "ACCOUNTING");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateAccounting(
    event,
    loaded.row,
    parseAccounting(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

async function postDirectorDecision(event) {
  const denied = requireRole(event, "DIRECTOR");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.directorDecision(
    event,
    loaded.row,
    parseDirectorDecision(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = {
  putQa,
  putRnd,
  putExecutorIntake,
  putExecutorConsolidation,
  putAccounting,
  postDirectorDecision,
};
