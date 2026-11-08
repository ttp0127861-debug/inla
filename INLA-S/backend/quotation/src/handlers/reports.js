const { json, fail } = require("../lib/http");
const { isSales } = require("../middleware/auth");
const { parseReportFilters } = require("../services/validation");
const reports = require("../services/reports");

async function operations(event) {
  const filters = parseReportFilters(event.queryStringParameters || {});
  return json(200, await reports.getOperationsReport(event, filters));
}

async function business(event) {
  const filters = parseReportFilters(event.queryStringParameters || {});
  return json(200, await reports.getBusinessReport(event, filters));
}

async function departments(event) {
  if (isSales(event)) {
    return fail(403, "FORBIDDEN", "Department performance reports are not available for SALES.");
  }
  const filters = parseReportFilters(event.queryStringParameters || {});
  return json(200, await reports.getDepartmentsReport(event, filters));
}

async function resubmit(event) {
  const filters = parseReportFilters(event.queryStringParameters || {});
  return json(200, await reports.getResubmitReport(event, filters));
}

module.exports = { operations, business, departments, resubmit };
