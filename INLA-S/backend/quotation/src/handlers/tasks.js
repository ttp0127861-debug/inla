const { json } = require("../lib/http");
const { pathParam, parsePagination } = require("../lib/request");
const { requireWorkflowMutation, requireTaskRole } = require("../middleware/auth");
const { loadQuotationForRead } = require("../services/access");
const { startTask, completeTask } = require("../services/tasks");
const { listTaskInbox } = require("../services/taskInbox");
const {
  parseQuotationCodeParam,
  parseTaskTypeParam,
  parseTaskInboxFilters,
} = require("../services/validation");

async function listInbox(event) {
  const filters = parseTaskInboxFilters(event.queryStringParameters || {});
  const pagination = parsePagination(event.queryStringParameters || {});
  const result = await listTaskInbox(event, filters, pagination);
  return json(200, result);
}

async function start(event) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  const taskType = parseTaskTypeParam(pathParam(event, "taskType"));
  const roleDenied = requireTaskRole(event, taskType);
  if (roleDenied) return roleDenied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await startTask(event, loaded.row, taskType);
  if (result.statusCode) return result;
  return json(200, result);
}

async function complete(event) {
  const denied = requireWorkflowMutation(event);
  if (denied) return denied;
  const taskType = parseTaskTypeParam(pathParam(event, "taskType"));
  const roleDenied = requireTaskRole(event, taskType);
  if (roleDenied) return roleDenied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await completeTask(event, loaded.row, taskType);
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = { listInbox, start, complete };
