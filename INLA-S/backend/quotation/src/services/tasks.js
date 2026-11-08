const { query, runWithRequestContext } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal } = require("../middleware/auth");
const { WORKFLOW_BY_TASK_COMPLETE } = require("./workflow");
const { computeSlaAlertState } = require("./sla");
const { buildQuotationDetail } = require("./aggregate");
const { fetchQuotationRow } = require("./access");
const { validateConsolidationLinePrices } = require("./lineItems");
const { validateQaCompleteForCycle, validateRndCompleteForCycle } = require("./qaRndLinePayload");

const STATUS_FOR_TASK = {
  executor_intake: "executor_intake",
  qa_review: "qa_rnd_review",
  rnd_review: "qa_rnd_review",
  executor_consolidation: "executor_consolidation",
  accounting_review: "accounting_review",
  director_review: "director_review",
};

const ATT_SECTION_BY_TASK = {
  qa_review: { section: "qa", role: "QA" },
  rnd_review: { section: "rnd", role: "R&D" },
  executor_consolidation: { section: "executor_consolidation", role: "EXECUTOR" },
};

function attachmentsEnforced() {
  return process.env.ATTACHMENTS_ENABLED === "true";
}

function nonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function loadTask(cycleId, taskType) {
  const result = await query(
    `SELECT * FROM quotation_tasks WHERE cycle_id = $1 AND task_type = $2::task_type_enum`,
    [cycleId, taskType]
  );
  return result.rows[0] || null;
}

async function countAttachments(cycleId, section, role) {
  const result = await query(
    `SELECT count(*)::int AS n FROM quotation_attachments
     WHERE cycle_id = $1 AND section = $2::attachment_section_enum
       AND uploaded_by_role = $3 AND deleted_at IS NULL`,
    [cycleId, section, role]
  );
  return result.rows[0].n;
}

async function startTask(event, row, taskType) {
  if (STATUS_FOR_TASK[taskType] !== row.workflow_status) {
    return fail(409, "CONFLICT", "Task is not active for the current workflow stage.");
  }
  const task = await loadTask(row.current_cycle_id, taskType);
  if (!task) return fail(404, "NOT_FOUND", "Task not found.");
  if (task.task_status === "completed") {
    return fail(409, "CONFLICT", "Task is already completed.");
  }
  const { username, role } = getPrincipal(event);
  const hours = task.sla_duration_hours;

  await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotation_tasks
       SET task_status = CASE WHEN task_status = 'pending' THEN 'in_progress'::task_status_enum ELSE task_status END,
           started_at = COALESCE(started_at, now()),
           sla_started_at = COALESCE(sla_started_at, now()),
           sla_deadline_at = COALESCE(sla_deadline_at, now() + ($3::numeric * interval '1 hour'))
       WHERE id = $1 AND cycle_id = $2`,
      [task.id, row.current_cycle_id, String(hours)]
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
       ) VALUES ($1, $2, $3::workflow_status_enum, $3::workflow_status_enum,
         'task_start'::workflow_action_type_enum, $4, $5)`,
      [row.id, row.current_cycle_id, row.workflow_status, username, role]
    ),
  ]);

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function validateComplete(row, taskType) {
  const attRule = ATT_SECTION_BY_TASK[taskType];
  if (attRule && attachmentsEnforced()) {
    const n = await countAttachments(row.current_cycle_id, attRule.section, attRule.role);
    if (n < 1) {
      return fail(400, "VALIDATION_ERROR", `At least one ${attRule.role} attachment is required.`);
    }
  }

  if (taskType === "qa_review") {
    const qaErr = await validateQaCompleteForCycle(row.current_cycle_id);
    if (qaErr) return qaErr;
  }

  if (taskType === "rnd_review") {
    const rndErr = await validateRndCompleteForCycle(row.current_cycle_id);
    if (rndErr) return rndErr;
  }

  if (taskType === "executor_consolidation") {
    const lineErr = await validateConsolidationLinePrices(row.current_cycle_id);
    if (lineErr) return lineErr;
  }

  if (taskType === "accounting_review") {
    const data = await query(
      `SELECT final_quotation_value FROM quotation_accounting_data WHERE workflow_cycle_id = $1`,
      [row.current_cycle_id]
    );
    const val = data.rows[0]?.final_quotation_value;
    if (val == null || Number(val) < 0) {
      return fail(400, "VALIDATION_ERROR", "finalQuotationValue is required to complete accounting.");
    }
  }

  return null;
}

async function completeTask(event, row, taskType) {
  if (taskType === "director_review") {
    return fail(
      409,
      "VALIDATION_ERROR",
      "Use POST /quotations/{code}/director/decision to approve or reject."
    );
  }

  if (STATUS_FOR_TASK[taskType] !== row.workflow_status) {
    return fail(409, "CONFLICT", "Task is not active for the current workflow stage.");
  }
  const task = await loadTask(row.current_cycle_id, taskType);
  if (!task) return fail(404, "NOT_FOUND", "Task not found.");
  if (task.task_status === "completed") {
    return fail(409, "CONFLICT", "Task is already completed.");
  }

  const validation = await validateComplete(row, taskType);
  if (validation) return validation;

  const { username, role } = getPrincipal(event);
  const alert = computeSlaAlertState(task.sla_started_at, task.sla_deadline_at, new Date());
  const fromStatus = row.workflow_status;
  const nextStatus = WORKFLOW_BY_TASK_COMPLETE[taskType];

  const results = await runWithRequestContext(event, (txn) => {
    const stmts = [
      txn.query(`SELECT workflow_status FROM quotations WHERE id = $1 FOR UPDATE`, [row.id]),
      txn.query(
        `UPDATE quotation_tasks
         SET task_status = 'completed'::task_status_enum,
             completed_at = now(),
             sla_completed_at = now(),
             sla_alert_state = $3::sla_alert_state_enum
         WHERE id = $1 AND cycle_id = $2 AND task_status != 'completed'::task_status_enum
         RETURNING id`,
        [task.id, row.current_cycle_id, alert]
      ),
      txn.query(
        `INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
         ) VALUES ($1, $2, $3::workflow_status_enum, $3::workflow_status_enum,
           'task_complete'::workflow_action_type_enum, $4, $5)`,
        [row.id, row.current_cycle_id, fromStatus, username, role]
      ),
    ];

    if (taskType === "qa_review" || taskType === "rnd_review") {
      stmts.push(
        txn.query(
          `WITH moved AS (
             UPDATE quotations q SET
               workflow_status = 'executor_consolidation'::workflow_status_enum,
               updated_by = $2,
               version = q.version + 1,
               updated_at = now()
             WHERE q.id = $1
               AND q.workflow_status = 'qa_rnd_review'::workflow_status_enum
               AND NOT EXISTS (
                 SELECT 1 FROM quotation_tasks t
                 WHERE t.cycle_id = $3
                   AND t.task_type IN ('qa_review'::task_type_enum, 'rnd_review'::task_type_enum)
                   AND t.task_status != 'completed'::task_status_enum
               )
             RETURNING q.id
           )
           INSERT INTO quotation_workflow_events (
             quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
           )
           SELECT $1, $3, 'qa_rnd_review'::workflow_status_enum, 'executor_consolidation'::workflow_status_enum,
             'task_complete'::workflow_action_type_enum, $2, $4
           FROM moved`,
          [row.id, username, row.current_cycle_id, role]
        )
      );
    } else if (nextStatus) {
      stmts.push(
        txn.query(
          `WITH moved AS (
             UPDATE quotations q SET
               workflow_status = $4::workflow_status_enum,
               updated_by = $2,
               version = q.version + 1,
               updated_at = now()
             WHERE q.id = $1 AND q.workflow_status = $3::workflow_status_enum
             RETURNING q.id
           )
           INSERT INTO quotation_workflow_events (
             quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
           )
           SELECT $1, $5, $3::workflow_status_enum, $4::workflow_status_enum,
             'task_complete'::workflow_action_type_enum, $2, $6
           FROM moved`,
          [row.id, username, fromStatus, nextStatus, row.current_cycle_id, role]
        )
      );
    }
    return stmts;
  });

  const taskUpdate = results[1];
  if (!taskUpdate?.rows?.[0]) {
    return fail(409, "CONFLICT", "Task is already completed.");
  }

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

module.exports = { startTask, completeTask, loadTask, STATUS_FOR_TASK };
