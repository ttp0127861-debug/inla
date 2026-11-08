const { query, runWithRequestContext } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal } = require("../middleware/auth");
const { STATUS_FOR_TASK, loadTask } = require("./tasks");
const { buildQuotationDetail } = require("./aggregate");
const { applyConsolidationLinePatches } = require("./lineItems");
const { fetchQuotationRow } = require("./access");
const {
  fetchLineNumbersOrdered,
  assertQaLineDataForPut,
  assertRndLineDataForPut,
} = require("./qaRndLinePayload");
const { qaLineUpdateAssignments, qaLineUpdateParams } = require("./qaLineColumns");

function assertTaskOpen(row, taskType) {
  if (STATUS_FOR_TASK[taskType] !== row.workflow_status) {
    return fail(409, "CONFLICT", "Role data is not editable at this workflow stage.");
  }
  return null;
}

async function assertRolePayloadEditable(row, taskType) {
  const gate = assertTaskOpen(row, taskType);
  if (gate) return gate;
  const task = await loadTask(row.current_cycle_id, taskType);
  if (task?.task_status === "completed") {
    return fail(409, "CONFLICT", "Task is completed; role data is read-only.");
  }
  return null;
}

async function updateQa(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "qa_review");
  if (gate) return gate;
  const lineNumbers = await fetchLineNumbersOrdered(row.current_cycle_id);
  const check = assertQaLineDataForPut(data.qaLineData, lineNumbers);
  if (check.statusCode) return check;
  const cycleId = row.current_cycle_id;
  const quotationId = row.id;
  const { setSql } = qaLineUpdateAssignments(4);
  await runWithRequestContext(event, (txn) =>
    check.normalized.map((line) =>
      txn.query(
        `UPDATE quotation_line_qa qa SET
           ${setSql},
           updated_at = now()
         FROM quotation_line_items li
         WHERE qa.line_item_id = li.id
           AND li.workflow_cycle_id = $1 AND li.quotation_id = $2 AND li.line_number = $3`,
        [cycleId, quotationId, line.lineNumber, ...qaLineUpdateParams(line)]
      )
    )
  );
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function updateRnd(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "rnd_review");
  if (gate) return gate;
  const lineNumbers = await fetchLineNumbersOrdered(row.current_cycle_id);
  const check = assertRndLineDataForPut(data.rndLineData, lineNumbers);
  if (check.statusCode) return check;
  const cycleId = row.current_cycle_id;
  const quotationId = row.id;
  await runWithRequestContext(event, (txn) =>
    check.normalized.map((line) =>
      txn.query(
        `UPDATE quotation_line_rnd rnd SET
           printing_plate_cost = COALESCE($4, printing_plate_cost),
           die_cost = COALESCE($5, die_cost),
           layout_code = COALESCE($6, layout_code),
           die_code = COALESCE($7, die_code),
           layout_quote_code = COALESCE($8, layout_quote_code),
           die_quote_code = COALESCE($9, die_quote_code),
           production_plan = $10,
           rnd_note = $11,
           updated_at = now()
         FROM quotation_line_items li
         WHERE rnd.line_item_id = li.id
           AND li.workflow_cycle_id = $1 AND li.quotation_id = $2 AND li.line_number = $3`,
        [
          cycleId,
          quotationId,
          line.lineNumber,
          line.printingPlateCost,
          line.dieCost,
          line.layoutCode,
          line.dieCode,
          line.layoutQuoteCode,
          line.dieQuoteCode,
          line.productionPlan,
          line.rndNote,
        ]
      )
    )
  );
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function updateExecutorIntake(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "executor_intake");
  if (gate) return gate;
  await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotation_executor_intake SET intake_note = COALESCE($3, intake_note)
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [row.current_cycle_id, row.id, data.intakeNote]
    ),
  ]);
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function updateExecutorConsolidation(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "executor_consolidation");
  if (gate) return gate;
  await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotation_executor_consolidation SET
         delivery_terms = COALESCE($3, delivery_terms),
         consolidation_note = COALESCE($4, consolidation_note)
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [row.current_cycle_id, row.id, data.deliveryTerms, data.consolidationNote]
    ),
  ]);
  if (data.lineItems !== undefined) {
    const patchErr = await applyConsolidationLinePatches(
      event,
      row.current_cycle_id,
      row.id,
      data.lineItems
    );
    if (patchErr) return patchErr;
  }
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function updateAccounting(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "accounting_review");
  if (gate) return gate;
  await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotation_accounting_data SET
         payment_terms = COALESCE($3, payment_terms),
         vat_rate = COALESCE($4, vat_rate),
         financial_adjustment = COALESCE($5, financial_adjustment),
         final_quotation_value = COALESCE($6, final_quotation_value),
         accounting_note = COALESCE($7, accounting_note)
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [
        row.current_cycle_id,
        row.id,
        data.paymentTerms,
        data.vatRate,
        data.financialAdjustment,
        data.finalQuotationValue,
        data.accountingNote,
      ]
    ),
  ]);
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function getDevelopmentMinutesRow(cycleId) {
  const result = await query(
    `SELECT * FROM quotation_development_minutes WHERE workflow_cycle_id = $1`,
    [cycleId]
  );
  return result.rows[0] || null;
}

async function updateDevelopmentMinutes(event, row, data) {
  const gate = await assertRolePayloadEditable(row, "rnd_review");
  if (gate) return gate;
  const payloadJson =
    data.payload === undefined ? null : JSON.stringify(data.payload);
  await runWithRequestContext(event, (txn) => [
    txn.query(
      `INSERT INTO quotation_development_minutes (
         workflow_cycle_id, quotation_id, meeting_place, meeting_date, payload
       ) VALUES ($1, $2, $3, $4::date, COALESCE($5::jsonb, '{}'::jsonb))
       ON CONFLICT (workflow_cycle_id) DO UPDATE SET
         meeting_place = COALESCE($3, quotation_development_minutes.meeting_place),
         meeting_date = COALESCE($4::date, quotation_development_minutes.meeting_date),
         payload = CASE
           WHEN $5::jsonb IS NULL THEN quotation_development_minutes.payload
           ELSE COALESCE(quotation_development_minutes.payload, '{}'::jsonb) || $5::jsonb
         END,
         updated_at = now()`,
      [row.current_cycle_id, row.id, data.meetingPlace, data.meetingDate, payloadJson]
    ),
  ]);
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

function assertDirectorLinesForSubmit(lines, lineNumbers) {
  if (lineNumbers.length === 0) {
    return fail(400, "VALIDATION_ERROR", "Director decision requires at least one line item.");
  }
  if (lines.length !== lineNumbers.length) {
    return fail(400, "VALIDATION_ERROR", "lines length must match quotation line items for this cycle.");
  }
  const need = new Set(lineNumbers);
  const seen = new Set();
  for (const line of lines) {
    if (!need.has(line.lineNumber)) {
      return fail(400, "VALIDATION_ERROR", `lines references unknown lineNumber ${line.lineNumber}.`);
    }
    if (seen.has(line.lineNumber)) {
      return fail(400, "VALIDATION_ERROR", `Duplicate lineNumber ${line.lineNumber} in lines.`);
    }
    seen.add(line.lineNumber);
  }
  for (const n of need) {
    if (!seen.has(n)) {
      return fail(400, "VALIDATION_ERROR", `lines is missing lineNumber ${n}.`);
    }
  }
  return null;
}

async function directorDecision(event, row, { lines, version }) {
  if (row.workflow_status !== "director_review") {
    return fail(409, "CONFLICT", "Director decision is only allowed during director review.");
  }

  const lineNumbers = await fetchLineNumbersOrdered(row.current_cycle_id);
  const shapeErr = assertDirectorLinesForSubmit(lines, lineNumbers);
  if (shapeErr) return shapeErr;

  const anyRejected = lines.some((l) => l.decision === "rejected");
  const toStatus = anyRejected ? "rejected" : "approved";
  const firstRejected = lines.find((l) => l.decision === "rejected");
  const actionType = anyRejected ? "reject" : "approve";
  const actionNote = anyRejected
    ? firstRejected?.rejectionReason
    : lines.map((l) => l.approvalNote).find((n) => n && String(n).trim()) || null;

  const { username, role } = getPrincipal(event);
  const headerParams = [toStatus, username, row.id];
  const vClause = version !== undefined ? ` AND version = $4` : "";
  if (version !== undefined) headerParams.push(version);

  const cycleId = row.current_cycle_id;
  const quotationId = row.id;

  const results = await runWithRequestContext(event, (txn) => {
    const stmts = lines.map((line) =>
      txn.query(
        `UPDATE quotation_line_director d SET
           director_decision = $4::director_decision_enum,
           approval_note = $5,
           rejection_reason = $6,
           decision_at = now(),
           updated_at = now()
         FROM quotation_line_items li
         WHERE d.line_item_id = li.id
           AND li.workflow_cycle_id = $1 AND li.quotation_id = $2 AND li.line_number = $3`,
        [
          cycleId,
          quotationId,
          line.lineNumber,
          line.decision,
          line.decision === "approved" ? line.approvalNote ?? null : null,
          line.decision === "rejected" ? line.rejectionReason : null,
        ]
      )
    );
    stmts.push(
      txn.query(
        `UPDATE quotation_tasks SET task_status = 'completed'::task_status_enum,
           completed_at = now(), sla_completed_at = now()
         WHERE cycle_id = $1 AND task_type = 'director_review'::task_type_enum`,
        [cycleId]
      )
    );
    stmts.push(
      txn.query(
        `UPDATE quotations SET workflow_status = $1::workflow_status_enum,
           business_outcome = CASE WHEN $1::text = 'approved' THEN 'not_updated'::business_outcome_enum ELSE business_outcome END,
           updated_by = $2, version = version + 1
           WHERE id = $3${vClause} RETURNING id`,
        headerParams
      )
    );
    stmts.push(
      txn.query(
        `INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role, action_note
         ) VALUES ($1, $2, 'director_review'::workflow_status_enum, $3::workflow_status_enum,
           $4::workflow_action_type_enum, $5, $6, $7)`,
        [quotationId, cycleId, toStatus, actionType, username, role, actionNote]
      )
    );
    return stmts;
  });

  const statusUpdate = results[results.length - 2];
  if (version !== undefined && statusUpdate.rowCount === 0) {
    return fail(409, "CONFLICT", "Quotation was modified by another request.");
  }
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

module.exports = {
  updateQa,
  updateRnd,
  getDevelopmentMinutesRow,
  updateDevelopmentMinutes,
  updateExecutorIntake,
  updateExecutorConsolidation,
  updateAccounting,
  directorDecision,
};
