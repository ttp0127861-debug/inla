const { json } = require("../lib/http");
const { readBody, pathParam, parsePagination } = require("../lib/request");
const { requireWorkflowMutation } = require("../middleware/auth");
const { loadQuotationForRead } = require("../services/access");
const attachmentService = require("../services/attachments");
const {
  parseQuotationCodeParam,
  parsePresignAttachment,
  parseConfirmAttachment,
} = require("../services/validation");

async function list(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const q = event.queryStringParameters || {};
  const pagination = parsePagination(q);
  return json(
    200,
    await attachmentService.listAttachments(
      loaded.row,
      { cycleId: q.cycleId, section: q.section },
      pagination
    )
  );
}

async function presign(event) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await attachmentService.presignUpload(
    event,
    loaded.row,
    parsePresignAttachment(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

async function confirm(event) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await attachmentService.confirmUpload(
    event,
    loaded.row,
    parseConfirmAttachment(readBody(event))
  );
  if (result.statusCode) return result;
  return json(201, result);
}

async function remove(event) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const attachmentId = pathParam(event, "attachmentId");
  const result = await attachmentService.softDeleteAttachment(event, loaded.row, attachmentId);
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = { list, presign, confirm, remove };
