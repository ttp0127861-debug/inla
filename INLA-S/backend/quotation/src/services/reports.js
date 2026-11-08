const { query } = require("inla-s-db");
const { getPrincipal, isSales } = require("../middleware/auth");
/**
 * Reporting period anchor (OQ-RPT-05/06 pending):
 * all RPT endpoints filter quotations by `quotations.created_at` in [fromDate, toDate] (inclusive calendar days, UTC).
 * Revisit if business KPIs should use cycle `submitted_at` instead.
 */
const PERIOD_ANCHOR = "quotationCreatedAt";

const DEPARTMENT_LABELS = {
  executor_intake: "Tiếp nhận",
  qa_review: "QA",
  rnd_review: "R&D",
  executor_consolidation: "Tổng hợp",
  accounting_review: "Kế toán",
  director_review: "Phê duyệt",
};

const WORKFLOW_STATUS_ORDER = [
  "draft",
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
  "approved",
  "rejected",
  "cancelled",
];

function meta(filters) {
  return {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    periodAnchor: PERIOD_ANCHOR,
  };
}

function buildQuotationScope(event, filters) {
  const params = [filters.fromDate, filters.toDate];
  const where = [
    `q.created_at >= $1::date`,
    `q.created_at < ($2::date + interval '1 day')`,
  ];

  if (isSales(event)) {
    params.push(getPrincipal(event).username);
    where.push(`lower(q.sales_owner_username) = lower($${params.length})`);
  }

  if (filters.department) {
    params.push(filters.department);
    const idx = params.length;
    where.push(
      `EXISTS (
         SELECT 1 FROM quotation_tasks t
         WHERE t.quotation_id = q.id
           AND t.cycle_id = q.current_cycle_id
           AND t.task_type = $${idx}::task_type_enum
       )`
    );
  }

  return { whereSql: where.join(" AND "), params };
}

async function getOperationsReport(event, filters) {
  const { whereSql, params } = buildQuotationScope(event, filters);
  const result = await query(
    `SELECT q.workflow_status::text AS workflow_status, count(*)::int AS count
     FROM quotations q
     WHERE ${whereSql}
     GROUP BY q.workflow_status`,
    params
  );

  const counts = new Map(result.rows.map((row) => [row.workflow_status, row.count]));
  const byWorkflowStatus = WORKFLOW_STATUS_ORDER.filter((status) => counts.has(status)).map(
    (workflowStatus) => ({
      workflowStatus,
      count: counts.get(workflowStatus),
    })
  );
  for (const [workflowStatus, count] of counts) {
    if (!WORKFLOW_STATUS_ORDER.includes(workflowStatus)) {
      byWorkflowStatus.push({ workflowStatus, count });
    }
  }

  const total = byWorkflowStatus.reduce((sum, row) => sum + row.count, 0);
  return { ...meta(filters), total, byWorkflowStatus };
}

async function getBusinessReport(event, filters) {
  const { whereSql, params } = buildQuotationScope(event, filters);

  const outcomeResult = await query(
    `SELECT q.business_outcome::text AS business_outcome, count(*)::int AS count
     FROM quotations q
     WHERE ${whereSql}
     GROUP BY q.business_outcome`,
    params
  );

  const byOutcome = Object.fromEntries(
    outcomeResult.rows.map((row) => [row.business_outcome, row.count])
  );
  const won = byOutcome.won || 0;
  const lost = byOutcome.lost || 0;
  const sentOnly = byOutcome.sent_to_customer || 0;
  const sent = sentOnly + won + lost;

  /**
   * Win rate denominator (OQ-RPT-05 pending): won / sent when sent > 0, else null.
   */
  const winRate = sent > 0 ? won / sent : null;

  /**
   * OQ-RPT-06 assumption: sum `final_quotation_value` from the latest cycle per quotation
   * where workflow is approved and quotation business_outcome = won (per-line director rollup already applied).
   */
  const valueResult = await query(
    `SELECT COALESCE(SUM(sub.final_quotation_value), 0)::float8 AS total_won_value
     FROM (
       SELECT DISTINCT ON (q.id)
         acc.final_quotation_value
       FROM quotations q
       JOIN workflow_cycles wc ON wc.quotation_id = q.id
       JOIN quotation_accounting_data acc ON acc.workflow_cycle_id = wc.id
       WHERE ${whereSql}
         AND q.business_outcome = 'won'::business_outcome_enum
         AND q.workflow_status = 'approved'::workflow_status_enum
         AND acc.final_quotation_value IS NOT NULL
       ORDER BY q.id, wc.cycle_number DESC
     ) sub`,
    params
  );

  return {
    ...meta(filters),
    sent,
    won,
    lost,
    winRate,
    totalWonValue: valueResult.rows[0]?.total_won_value ?? 0,
  };
}

async function getDepartmentsReport(event, filters) {
  const { whereSql, params } = buildQuotationScope(event, filters);
  const taskParams = [...params, filters.fromDate, filters.toDate];
  const fromIdx = params.length + 1;
  const toIdx = params.length + 2;

  let taskTypeSql = "";
  if (filters.department) {
    taskParams.push(filters.department);
    taskTypeSql = `AND t.task_type = $${taskParams.length}::task_type_enum`;
  }

  const result = await query(
    `SELECT
       t.task_type::text AS task_type,
       count(*)::int AS completed_tasks,
       avg(
         CASE
           WHEN t.started_at IS NOT NULL AND t.completed_at IS NOT NULL
             THEN extract(epoch FROM (t.completed_at - t.started_at)) / 3600.0
           ELSE NULL
         END
       )::float8 AS avg_duration_hours,
       avg(t.sla_duration_hours)::float8 AS avg_sla_hours,
       count(*) FILTER (
         WHERE t.sla_deadline_at IS NOT NULL
           AND t.completed_at IS NOT NULL
           AND t.completed_at > t.sla_deadline_at
       )::int AS over_sla_count
     FROM quotation_tasks t
     JOIN quotations q ON q.id = t.quotation_id
     WHERE ${whereSql}
       AND t.task_status = 'completed'::task_status_enum
       AND t.completed_at >= $${fromIdx}::date
       AND t.completed_at < ($${toIdx}::date + interval '1 day')
       ${taskTypeSql}
     GROUP BY t.task_type
     ORDER BY CASE t.task_type
       WHEN 'executor_intake'::task_type_enum THEN 1
       WHEN 'qa_review'::task_type_enum THEN 2
       WHEN 'rnd_review'::task_type_enum THEN 3
       WHEN 'executor_consolidation'::task_type_enum THEN 4
       WHEN 'accounting_review'::task_type_enum THEN 5
       WHEN 'director_review'::task_type_enum THEN 6
       ELSE 99
     END`,
    taskParams
  );

  const departments = result.rows.map((row) => ({
    taskType: row.task_type,
    departmentLabel: DEPARTMENT_LABELS[row.task_type] || row.task_type,
    avgDurationHours: row.avg_duration_hours,
    avgSlaHours: row.avg_sla_hours,
    completedTasks: row.completed_tasks,
    overSlaCount: row.over_sla_count,
  }));

  return { ...meta(filters), departments };
}

async function getResubmitReport(event, filters) {
  const { whereSql, params } = buildQuotationScope(event, filters);

  const summaryResult = await query(
    `WITH scoped AS (
       SELECT q.id
       FROM quotations q
       WHERE ${whereSql}
     ),
     cycle_stats AS (
       SELECT
         q.id AS quotation_id,
         count(wc.id)::int AS cycle_count,
         bool_or(wc.cycle_type = 're_submit'::cycle_type_enum) AS has_resubmit
       FROM scoped q
       JOIN workflow_cycles wc ON wc.quotation_id = q.id
       WHERE wc.submitted_at IS NOT NULL
       GROUP BY q.id
     )
     SELECT
       count(*)::int AS submitted_quotations,
       count(*) FILTER (WHERE has_resubmit)::int AS quotations_with_resubmit,
       avg(cycle_count)::float8 AS avg_cycles_per_quotation
     FROM cycle_stats`,
    params
  );

  const summary = summaryResult.rows[0] || {
    submitted_quotations: 0,
    quotations_with_resubmit: 0,
    avg_cycles_per_quotation: null,
  };
  const submittedQuotations = summary.submitted_quotations || 0;
  const quotationsWithResubmit = summary.quotations_with_resubmit || 0;
  const avgResubmitRate =
    submittedQuotations > 0 ? quotationsWithResubmit / submittedQuotations : null;

  const seriesResult = await query(
    `WITH scoped AS (
       SELECT q.id
       FROM quotations q
       WHERE ${whereSql}
     ),
     months AS (
       SELECT
         to_char(date_trunc('month', wc.submitted_at), 'YYYY-MM') AS month,
         count(DISTINCT wc.quotation_id)::int AS submitted_quotations,
         count(DISTINCT wc.quotation_id) FILTER (
           WHERE wc.cycle_type = 're_submit'::cycle_type_enum
         )::int AS quotations_with_resubmit
       FROM scoped q
       JOIN workflow_cycles wc ON wc.quotation_id = q.id
       WHERE wc.submitted_at IS NOT NULL
         AND wc.submitted_at >= $${params.length + 1}::date
         AND wc.submitted_at < ($${params.length + 2}::date + interval '1 day')
       GROUP BY 1
       ORDER BY 1
     )
     SELECT
       month,
       submitted_quotations,
       quotations_with_resubmit,
       CASE
         WHEN submitted_quotations > 0
           THEN quotations_with_resubmit::float8 / submitted_quotations
         ELSE NULL
       END AS resubmit_rate
     FROM months`,
    [...params, filters.fromDate, filters.toDate]
  );

  const monthlySeries = seriesResult.rows.map((row) => ({
    month: row.month,
    submittedQuotations: row.submitted_quotations,
    quotationsWithResubmit: row.quotations_with_resubmit,
    resubmitRate: row.resubmit_rate,
  }));

  return {
    ...meta(filters),
    avgResubmitRate,
    avgCyclesPerQuotation: summary.avg_cycles_per_quotation,
    submittedQuotations,
    quotationsWithResubmit,
    monthlySeries,
  };
}

module.exports = {
  PERIOD_ANCHOR,
  getOperationsReport,
  getBusinessReport,
  getDepartmentsReport,
  getResubmitReport,
};
