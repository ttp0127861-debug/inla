const { query } = require("inla-s-db");
const { getPrincipal, isSales } = require("../middleware/auth");
const { mapQuotation, mapTask } = require("./mappers");
const { computeSlaAlertState } = require("./sla");

/** Mirrors `frontend/src/lib/taskInbox.ts` ACTIVE_WORKFLOW */
const ACTIVE_WORKFLOW = [
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];

/** Mirrors `frontend/src/lib/taskInbox.ts` TASKS_BY_ROLE (+ ADMIN all types) */
const TASKS_BY_ROLE = {
  EXECUTOR: ["executor_intake", "executor_consolidation"],
  QA: ["qa_review"],
  "R&D": ["rnd_review"],
  ACCOUNTING: ["accounting_review"],
  DIRECTOR: ["director_review"],
  ADMIN: [
    "executor_intake",
    "qa_review",
    "rnd_review",
    "executor_consolidation",
    "accounting_review",
    "director_review",
  ],
};

const SLA_STATE_SQL = `
  CASE
    WHEN t.task_status = 'completed'::task_status_enum THEN 'normal'::text
    WHEN t.sla_deadline_at IS NULL THEN 'normal'::text
    WHEN now() > t.sla_deadline_at THEN 'overdue'::text
    WHEN t.sla_started_at IS NOT NULL
      AND extract(epoch FROM (now() - t.sla_started_at))
          >= extract(epoch FROM (t.sla_deadline_at - t.sla_started_at)) * 0.5
      THEN 'warning'::text
    ELSE 'normal'::text
  END
`;

function inboxTaskTypes(event) {
  const { role, groups } = getPrincipal(event);
  if (groups.includes("ADMIN") || role === "ADMIN") return TASKS_BY_ROLE.ADMIN;
  if (TASKS_BY_ROLE[role]) return TASKS_BY_ROLE[role];
  return TASKS_BY_ROLE.ADMIN;
}

/** Task type must match quotation workflow stage (same as completeTask guard). */
const STAGE_MATCH_SQL = `
  q.workflow_status = CASE t.task_type
    WHEN 'executor_intake'::task_type_enum THEN 'executor_intake'::workflow_status_enum
    WHEN 'qa_review'::task_type_enum THEN 'qa_rnd_review'::workflow_status_enum
    WHEN 'rnd_review'::task_type_enum THEN 'qa_rnd_review'::workflow_status_enum
    WHEN 'executor_consolidation'::task_type_enum THEN 'executor_consolidation'::workflow_status_enum
    WHEN 'accounting_review'::task_type_enum THEN 'accounting_review'::workflow_status_enum
    WHEN 'director_review'::task_type_enum THEN 'director_review'::workflow_status_enum
  END
`;

function mapInboxRow(row) {
  const quotation = mapQuotation({
    id: row.q_id,
    code: row.q_code,
    sales_owner_username: row.sales_owner_username,
    customer_id: row.customer_id,
    contact_id: row.contact_id,
    cloned_from_quotation_id: row.cloned_from_quotation_id,
    workflow_status: row.workflow_status,
    business_outcome: row.business_outcome,
    current_cycle_id: row.current_cycle_id,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    cancelled_at: row.cancelled_at,
    cancelled_by: row.cancelled_by,
    customer_code: row.customer_code,
    customer_name: row.customer_name,
    cycle_number: row.cycle_number,
    cycle_type: row.cycle_type,
  });

  const task = mapTask({
    id: row.task_id,
    quotation_id: row.quotation_id,
    cycle_id: row.cycle_id,
    task_type: row.task_type,
    task_status: row.task_status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    sla_started_at: row.sla_started_at,
    sla_deadline_at: row.sla_deadline_at,
    sla_completed_at: row.sla_completed_at,
    sla_duration_hours: row.sla_duration_hours,
    sla_alert_state: computeSlaAlertState(
      row.sla_started_at,
      row.sla_deadline_at,
      row.completed_at
    ),
  });

  return { quotation, task };
}

async function listTaskInbox(event, { slaAlertState }, pagination) {
  const taskTypes = inboxTaskTypes(event);
  if (!taskTypes.length) {
    return { tasks: [], page: pagination.page, pageSize: pagination.pageSize, total: 0 };
  }

  const params = [];
  params.push(taskTypes);
  const taskTypesIdx = params.length;

  params.push(ACTIVE_WORKFLOW);
  const workflowIdx = params.length;

  let scopeSql = "1=1";
  if (isSales(event)) {
    params.push(getPrincipal(event).username);
    scopeSql = `q.sales_owner_username = $${params.length}`;
  }

  let slaFilterSql = "";
  if (slaAlertState) {
    params.push(slaAlertState);
    slaFilterSql = ` AND effective_sla_state = $${params.length}`;
  }

  const baseCte = `
    WITH scoped AS (
      SELECT
        t.id AS task_id,
        t.quotation_id,
        t.cycle_id,
        t.task_type,
        t.task_status,
        t.started_at,
        t.completed_at,
        t.sla_started_at,
        t.sla_deadline_at,
        t.sla_completed_at,
        t.sla_duration_hours,
        q.id AS q_id,
        q.code AS q_code,
        q.sales_owner_username,
        q.customer_id,
        q.contact_id,
        q.cloned_from_quotation_id,
        q.workflow_status,
        q.business_outcome,
        q.current_cycle_id,
        q.version,
        q.created_at,
        q.updated_at,
        q.created_by,
        q.updated_by,
        q.cancelled_at,
        q.cancelled_by,
        c.code AS customer_code,
        c.name AS customer_name,
        wc.cycle_number,
        wc.cycle_type,
        ${SLA_STATE_SQL} AS effective_sla_state
      FROM quotation_tasks t
      INNER JOIN quotations q ON q.id = t.quotation_id
      INNER JOIN customers c ON c.id = q.customer_id
      LEFT JOIN workflow_cycles wc ON wc.id = q.current_cycle_id
      WHERE t.cycle_id = q.current_cycle_id
        AND t.task_type = ANY($${taskTypesIdx}::task_type_enum[])
        AND t.task_status IN ('pending'::task_status_enum, 'in_progress'::task_status_enum)
        AND q.workflow_status = ANY($${workflowIdx}::workflow_status_enum[])
        AND ${STAGE_MATCH_SQL}
        AND ${scopeSql}
    ),
    filtered AS (
      SELECT * FROM scoped WHERE 1=1${slaFilterSql}
    )
  `;

  const countResult = await query(`${baseCte} SELECT count(*)::int AS total FROM filtered`, params);
  const total = countResult.rows[0].total;

  params.push(pagination.pageSize);
  const limitIdx = params.length;
  params.push(pagination.offset);
  const offsetIdx = params.length;

  const rows = await query(
    `${baseCte}
     SELECT * FROM filtered
     ORDER BY
       CASE effective_sla_state WHEN 'overdue' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
       sla_deadline_at ASC NULLS LAST,
       q_code ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  const tasks = rows.rows.map(mapInboxRow);

  return {
    tasks,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
  };
}

module.exports = { listTaskInbox, inboxTaskTypes, ACTIVE_WORKFLOW, TASKS_BY_ROLE };
