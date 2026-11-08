const { isDatabaseConfigured } = require("inla-s-db");
const { fail, mapError } = require("./lib/http");
const { requireQuotationModule, enrichPrincipal } = require("./middleware/auth");
const quotations = require("./handlers/quotations");
const tasks = require("./handlers/tasks");
const payloads = require("./handlers/payloads");
const history = require("./handlers/history");
const attachments = require("./handlers/attachments");
const customerQuotations = require("./handlers/customerQuotations");
const reports = require("./handlers/reports");
const developmentMinutes = require("./handlers/developmentMinutes");

exports.handler = async (event) => {
  try {
    if (!isDatabaseConfigured()) {
      return fail(500, "INTERNAL_ERROR", "DATABASE_URL is not configured.");
    }
    const denied = requireQuotationModule(event);
    if (denied) return denied;
    await enrichPrincipal(event);

    const key = event.routeKey;
    if (key === "GET /tasks") return tasks.listInbox(event);
    if (key === "GET /quotations") return quotations.list(event);
    if (key === "POST /quotations") return quotations.create(event);
    if (key === "GET /quotations/{code}") return quotations.get(event);
    if (key === "PUT /quotations/{code}") return quotations.updateDraft(event);
    if (key === "POST /quotations/{code}/cancel") return quotations.cancelDraft(event);
    if (key === "POST /quotations/{code}/submit") return quotations.submit(event);
    if (key === "POST /quotations/{code}/resubmit/prepare") return quotations.resubmitPrepare(event);
    if (key === "POST /quotations/{code}/resubmit/submit") return quotations.resubmitSubmit(event);
    if (key === "POST /quotations/{code}/clone") return quotations.clone(event);
    if (key === "PATCH /quotations/{code}/business-outcome") return quotations.patchOutcome(event);

    if (key === "POST /quotations/{code}/tasks/{taskType}/start") return tasks.start(event);
    if (key === "POST /quotations/{code}/tasks/{taskType}/complete") return tasks.complete(event);

    if (key === "PUT /quotations/{code}/qa") return payloads.putQa(event);
    if (key === "PUT /quotations/{code}/rnd") return payloads.putRnd(event);
    if (key === "GET /quotations/{code}/development-minutes") return developmentMinutes.get(event);
    if (key === "PUT /quotations/{code}/development-minutes") return developmentMinutes.put(event);
    if (key === "PUT /quotations/{code}/executor/intake") return payloads.putExecutorIntake(event);
    if (key === "PUT /quotations/{code}/executor/consolidation") return payloads.putExecutorConsolidation(event);
    if (key === "PUT /quotations/{code}/accounting") return payloads.putAccounting(event);
    if (key === "POST /quotations/{code}/director/decision") return payloads.postDirectorDecision(event);

    if (key === "GET /quotations/{code}/attachments") return attachments.list(event);
    if (key === "POST /quotations/{code}/attachments/presign") return attachments.presign(event);
    if (key === "POST /quotations/{code}/attachments/confirm") return attachments.confirm(event);
    if (key === "DELETE /quotations/{code}/attachments/{attachmentId}") return attachments.remove(event);

    if (key === "GET /quotations/{code}/history") return history.history(event);
    if (key === "GET /quotations/{code}/revisions") return history.revisions(event);
    if (key === "GET /quotations/{code}/revisions/{revisionCode}") return history.revisionDetail(event);
    if (key === "GET /quotations/{code}/similar-by-product") return history.similarProduct(event);
    if (key === "GET /quotations/{code}/similar-by-customer") return history.similarCustomer(event);

    if (key === "GET /customers/{customerCode}/quotations") return customerQuotations.listForCustomer(event);

    if (key === "GET /reports/operations") return reports.operations(event);
    if (key === "GET /reports/business") return reports.business(event);
    if (key === "GET /reports/departments") return reports.departments(event);
    if (key === "GET /reports/resubmit") return reports.resubmit(event);

    return fail(404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (error.name === "ValidationError") return fail(400, "VALIDATION_ERROR", error.message);
    return mapError(error);
  }
};
