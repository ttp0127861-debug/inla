const { query } = require("inla-s-db");
const { mapWorkflowEvent, mapAuditEvent } = require("./mappers");

async function listWorkflowHistory(quotationId) {
  const result = await query(
    `SELECT * FROM quotation_workflow_events
     WHERE quotation_id = $1 ORDER BY action_at DESC, id DESC`,
    [quotationId]
  );
  return { events: result.rows.map(mapWorkflowEvent) };
}

async function listAuditHistory(quotationId, pagination) {
  const countResult = await query(
    `SELECT count(*)::int AS total FROM audit_events WHERE quotation_id = $1`,
    [quotationId]
  );
  const rows = await query(
    `SELECT * FROM audit_events WHERE quotation_id = $1
     ORDER BY occurred_at DESC, id DESC LIMIT $2 OFFSET $3`,
    [quotationId, pagination.pageSize, pagination.offset]
  );
  return {
    auditEvents: rows.rows.map(mapAuditEvent),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

module.exports = { listWorkflowHistory, listAuditHistory };
