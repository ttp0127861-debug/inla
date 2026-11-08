/**
 * SLA duration snapshot (hours, 24/7) — matches admin SLA mock (frontend AdminPages):
 * NEW: intake 2h, QA 4h, R&D 5h, consolidation 2h, accounting 3h, director 2h.
 * RE_SUBMIT: intake 1h; QA/R&D/consolidation/accounting/director 2h each (RES-011 baseline).
 */
const NEW_HOURS = {
  executor_intake: 2,
  qa_review: 4,
  rnd_review: 5,
  executor_consolidation: 2,
  accounting_review: 3,
  director_review: 2,
};

const RESUBMIT_HOURS = {
  executor_intake: 1,
  qa_review: 2,
  rnd_review: 2,
  executor_consolidation: 2,
  accounting_review: 2,
  director_review: 2,
};

const TASK_TYPES = [
  "executor_intake",
  "qa_review",
  "rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];

function slaHoursForTask(taskType, cycleType) {
  const table = cycleType === "re_submit" ? RESUBMIT_HOURS : NEW_HOURS;
  return table[taskType] ?? 2;
}

function computeSlaAlertState(startedAt, deadlineAt, completedAt, now = new Date()) {
  if (completedAt) return "normal";
  if (!deadlineAt) return "normal";
  const deadline = new Date(deadlineAt).getTime();
  const start = startedAt ? new Date(startedAt).getTime() : deadline;
  const nowMs = now.getTime();
  if (nowMs > deadline) return "overdue";
  const total = deadline - start;
  if (total <= 0) return "normal";
  const elapsed = nowMs - start;
  if (elapsed >= total * 0.5) return "warning";
  return "normal";
}

module.exports = { slaHoursForTask, TASK_TYPES, computeSlaAlertState, NEW_HOURS, RESUBMIT_HOURS };
