const { query } = require("inla-s-db");
const { mapRevision } = require("./mappers");

async function listRevisions(quotationId, pagination) {
  const countResult = await query(
    `SELECT count(*)::int AS total FROM quotation_revisions WHERE quotation_id = $1`,
    [quotationId]
  );
  const result = await query(
    `SELECT id, quotation_id, cycle_id, revision_number, revision_code, created_at, created_by
     FROM quotation_revisions WHERE quotation_id = $1
     ORDER BY revision_number DESC
     LIMIT $2 OFFSET $3`,
    [quotationId, pagination.pageSize, pagination.offset]
  );
  return {
    revisions: result.rows.map(mapRevision),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function getRevision(quotationId, revisionCode) {
  const result = await query(
    `SELECT * FROM quotation_revisions WHERE quotation_id = $1 AND revision_code = $2`,
    [quotationId, revisionCode]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    revision: mapRevision(row),
    snapshot: row.snapshot_jsonb,
  };
}

module.exports = { listRevisions, getRevision };
