const { query } = require("inla-s-db");

const EMPTY_PAYLOAD_INSERTS = [
  (txn, cycleId, quotationId) =>
    txn.query(
      `INSERT INTO quotation_development_minutes (workflow_cycle_id, quotation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [cycleId, quotationId]
    ),
  (txn, cycleId, quotationId) =>
    txn.query(
      `INSERT INTO quotation_executor_intake (workflow_cycle_id, quotation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [cycleId, quotationId]
    ),
  (txn, cycleId, quotationId) =>
    txn.query(
      `INSERT INTO quotation_executor_consolidation (workflow_cycle_id, quotation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [cycleId, quotationId]
    ),
  (txn, cycleId, quotationId) =>
    txn.query(
      `INSERT INTO quotation_accounting_data (workflow_cycle_id, quotation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [cycleId, quotationId]
    ),
];

function insertEmptyRolePayloads(txn, cycleId, quotationId) {
  return EMPTY_PAYLOAD_INSERTS.map((fn) => fn(txn, cycleId, quotationId));
}

async function nextCycleNumber(quotationId) {
  const result = await query(
    `SELECT COALESCE(max(cycle_number), 0) + 1 AS n FROM workflow_cycles WHERE quotation_id = $1`,
    [quotationId]
  );
  return result.rows[0].n;
}

async function loadCycle(cycleId) {
  const result = await query(`SELECT * FROM workflow_cycles WHERE id = $1`, [cycleId]);
  return result.rows[0] || null;
}

/** CTEs: insert empty per-line qa/rnd/director rows for every line on src.cycle_id. */
function lineChildInsertCtes(joinCteName) {
  const fromLines = `
    FROM quotation_line_items li
    JOIN ${joinCteName} src ON li.workflow_cycle_id = src.cycle_id`;
  return `
    ins_line_qa AS (
      INSERT INTO quotation_line_qa (line_item_id, workflow_cycle_id, quotation_id)
      SELECT li.id, li.workflow_cycle_id, li.quotation_id ${fromLines}
    ),
    ins_line_rnd AS (
      INSERT INTO quotation_line_rnd (line_item_id, workflow_cycle_id, quotation_id)
      SELECT li.id, li.workflow_cycle_id, li.quotation_id ${fromLines}
    ),
    ins_line_director AS (
      INSERT INTO quotation_line_director (line_item_id, workflow_cycle_id, quotation_id)
      SELECT li.id, li.workflow_cycle_id, li.quotation_id ${fromLines}
    )`;
}

module.exports = {
  insertEmptyRolePayloads,
  nextCycleNumber,
  loadCycle,
  lineChildInsertCtes,
};
