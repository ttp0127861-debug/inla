const { query } = require("inla-s-db");
const { mapAuditEvent } = require("./mappers");

async function listHistory(customerId, pagination) {
  const countResult = await query(
    `SELECT count(*)::int AS total FROM audit_events WHERE customer_id = $1`,
    [customerId]
  );
  const total = countResult.rows[0].total;

  const rows = await query(
    `SELECT * FROM audit_events
     WHERE customer_id = $1
     ORDER BY occurred_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [customerId, pagination.pageSize, pagination.offset]
  );

  return {
    events: rows.rows.map(mapAuditEvent),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
  };
}

module.exports = { listHistory };
