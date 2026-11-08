const { query } = require("inla-s-db");
const {
  mapQuotation,
  mapCycle,
  mapSalesData,
  mapQaData,
  mapRndData,
  mapDevelopmentMinutes,
  mapExecutorIntake,
  mapExecutorConsolidation,
  mapAccounting,
  mapDirectorData,
  mapTask,
  mapCustomerSnapshot,
} = require("./mappers");
const { computeSlaAlertState } = require("./sla");
const { loadLineItems } = require("./lineItems");
const { QA_LINE_SQL_SELECT } = require("./qaLineColumns");

const QA_LINE_SELECT = `
  SELECT
    li.line_number,
    ${QA_LINE_SQL_SELECT}
  FROM quotation_line_qa qa
  JOIN quotation_line_items li ON li.id = qa.line_item_id
  WHERE qa.workflow_cycle_id = $1
  ORDER BY li.line_number`;

const RND_LINE_SELECT = `
  SELECT
    li.line_number,
    rnd.printing_plate_cost,
    rnd.die_cost,
    rnd.layout_code,
    rnd.die_code,
    rnd.layout_quote_code,
    rnd.die_quote_code,
    rnd.production_plan,
    rnd.rnd_note
  FROM quotation_line_rnd rnd
  JOIN quotation_line_items li ON li.id = rnd.line_item_id
  WHERE rnd.workflow_cycle_id = $1
  ORDER BY li.line_number`;

const DIRECTOR_LINE_SELECT = `
  SELECT
    li.line_number,
    d.director_decision,
    d.approval_note,
    d.rejection_reason,
    d.decision_at
  FROM quotation_line_director d
  JOIN quotation_line_items li ON li.id = d.line_item_id
  WHERE d.workflow_cycle_id = $1
  ORDER BY li.line_number`;

async function loadCyclePayloads(cycleId) {
  const [sales, qaLines, rndLines, minutes, intake, consolidation, accounting, directorLines, snapshot] =
    await Promise.all([
      query(`SELECT * FROM quotation_sales_data WHERE workflow_cycle_id = $1`, [cycleId]),
      query(QA_LINE_SELECT, [cycleId]),
      query(RND_LINE_SELECT, [cycleId]),
      query(`SELECT * FROM quotation_development_minutes WHERE workflow_cycle_id = $1`, [cycleId]),
      query(`SELECT * FROM quotation_executor_intake WHERE workflow_cycle_id = $1`, [cycleId]),
      query(`SELECT * FROM quotation_executor_consolidation WHERE workflow_cycle_id = $1`, [cycleId]),
      query(`SELECT * FROM quotation_accounting_data WHERE workflow_cycle_id = $1`, [cycleId]),
      query(DIRECTOR_LINE_SELECT, [cycleId]),
      query(`SELECT * FROM quotation_customer_snapshots WHERE workflow_cycle_id = $1`, [cycleId]),
    ]);
  return {
    salesData: mapSalesData(sales.rows[0]),
    qaData: mapQaData(qaLines.rows),
    rndData: mapRndData(rndLines.rows),
    developmentMinutes: mapDevelopmentMinutes(minutes.rows[0]),
    executorIntake: mapExecutorIntake(intake.rows[0]),
    executorConsolidation: mapExecutorConsolidation(consolidation.rows[0]),
    accountingData: mapAccounting(accounting.rows[0]),
    directorData: mapDirectorData(directorLines.rows),
    customerSnapshot: mapCustomerSnapshot(snapshot.rows[0]),
  };
}

async function loadTasks(cycleId) {
  const result = await query(
    `SELECT * FROM quotation_tasks WHERE cycle_id = $1 ORDER BY task_type`,
    [cycleId]
  );
  return result.rows.map((row) => {
    const task = mapTask(row);
    task.slaAlertState = computeSlaAlertState(
      row.sla_started_at,
      row.sla_deadline_at,
      row.sla_completed_at
    );
    return task;
  });
}

async function buildQuotationDetail(row) {
  const quotation = mapQuotation(row);
  let currentCycle = null;
  let payloads = {};
  let tasks = [];
  let lineItems = [];
  if (row.current_cycle_id) {
    const cycleResult = await query(`SELECT * FROM workflow_cycles WHERE id = $1`, [row.current_cycle_id]);
    currentCycle = mapCycle(cycleResult.rows[0]);
    payloads = await loadCyclePayloads(row.current_cycle_id);
    tasks = await loadTasks(row.current_cycle_id);
    lineItems = await loadLineItems(row.current_cycle_id);
  }
  return { quotation, currentCycle, ...payloads, lineItems, tasks };
}

module.exports = { buildQuotationDetail, loadCyclePayloads, loadTasks };
