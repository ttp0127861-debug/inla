const WORKFLOW_BY_TASK_COMPLETE = {
  executor_intake: "qa_rnd_review",
  executor_consolidation: "accounting_review",
  accounting_review: "director_review",
};

function taskTypesForStatus(status) {
  if (status === "executor_intake") return ["executor_intake"];
  if (status === "qa_rnd_review") return ["qa_review", "rnd_review"];
  if (status === "executor_consolidation") return ["executor_consolidation"];
  if (status === "accounting_review") return ["accounting_review"];
  if (status === "director_review") return ["director_review"];
  return [];
}

function workflowEventInsert(txn, params, idx) {
  const base = idx * 8;
  return txn.query(
    `INSERT INTO quotation_workflow_events (
       quotation_id, cycle_id, from_status, to_status, action_type,
       actor_username, actor_role, action_note
     ) VALUES (
       $${base + 1}, $${base + 2}, $${base + 3}::workflow_status_enum, $${base + 4}::workflow_status_enum,
       $${base + 5}::workflow_action_type_enum, $${base + 6}, $${base + 7}, $${base + 8}
     )`,
    params
  );
}

function statusUpdate(txn, quotationId, toStatus, actor, versionClause, params) {
  params.push(toStatus, actor, quotationId);
  const statusIdx = params.length - 2;
  const idIdx = params.length;
  return txn.query(
    `UPDATE quotations
     SET workflow_status = $${statusIdx}::workflow_status_enum,
         updated_by = $${statusIdx + 1},
         version = version + 1,
         updated_at = now()
     WHERE id = $${idIdx}${versionClause}
     RETURNING version`,
    params
  );
}

module.exports = {
  WORKFLOW_BY_TASK_COMPLETE,
  taskTypesForStatus,
  workflowEventInsert,
  statusUpdate,
};
