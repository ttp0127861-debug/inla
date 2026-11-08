const { query, runWithRequestContext } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal } = require("../middleware/auth");
const { validateSubmitCustomerContact, loadCustomerById, loadContactForCustomer } = require("./references");
const { fetchLineItemRows, validateLineItemsForSubmit } = require("./lineItems");
const { slaHoursForTask, TASK_TYPES } = require("./sla");
const { versionWhere } = require("./sqlHelpers");
const { buildQuotationDetail } = require("./aggregate");
const { fetchQuotationRow } = require("./access");

async function nextRevisionNumber(quotationId) {
  const result = await query(
    `SELECT COALESCE(max(revision_number), 0) + 1 AS n FROM quotation_revisions WHERE quotation_id = $1`,
    [quotationId]
  );
  return result.rows[0].n;
}

async function submitQuotation(event, row, { resubmitReason, version }) {
  if (row.workflow_status !== "draft") {
    return fail(409, "CONFLICT", "Quotation must be in draft to submit.");
  }
  if (!row.current_cycle_id) return fail(409, "CONFLICT", "No workflow cycle.");
  const cycleResult = await query(`SELECT * FROM workflow_cycles WHERE id = $1`, [row.current_cycle_id]);
  const cycleRow = cycleResult.rows[0];
  if (!cycleRow || cycleRow.submitted_at) {
    return fail(409, "CONFLICT", "Current cycle was already submitted.");
  }
  if (cycleRow.cycle_type === "re_submit" && !resubmitReason) {
    return fail(400, "VALIDATION_ERROR", "resubmitReason is required for re-submit.");
  }

  const custErr = await validateSubmitCustomerContact(row.customer_id, row.contact_id);
  if (custErr) return custErr;

  const lineRows = await fetchLineItemRows(row.current_cycle_id);
  const lineErr = validateLineItemsForSubmit(lineRows);
  if (lineErr) return lineErr;

  const customer = await loadCustomerById(row.customer_id);
  const contact = row.contact_id ? await loadContactForCustomer(row.contact_id, row.customer_id) : null;
  const { username, role } = getPrincipal(event);
  const revisionNumber = await nextRevisionNumber(row.id);
  const revisionCode = `REV-${String(revisionNumber).padStart(2, "0")}`;
  const detail = await buildQuotationDetail(row);
  const snapshotJson = JSON.stringify({
    submittedAt: new Date().toISOString(),
    quotation: detail.quotation,
    currentCycle: detail.currentCycle,
    salesData: detail.salesData,
    lineItems: detail.lineItems,
  });

  const fromStatus = row.workflow_status;
  const headerParams = ["executor_intake", username, row.id];
  const vClause = versionWhere(version, headerParams);

  const results = await runWithRequestContext(event, (txn) => {
    const stmts = [
      txn.query(
        `UPDATE workflow_cycles SET resubmit_reason = COALESCE($1, resubmit_reason),
         submitted_at = now(), submitted_by = $2 WHERE id = $3`,
        [resubmitReason || null, username, row.current_cycle_id]
      ),
      txn.query(
        `INSERT INTO quotation_customer_snapshots (
           workflow_cycle_id, quotation_id, customer_type, customer_code, customer_name, tax_id,
           phone, email, address_line, province, contact_id, contact_full_name, contact_email,
           contact_phone, contact_job_title
         ) VALUES (
           $1, $2, $3::customer_type_enum, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
         ) ON CONFLICT (workflow_cycle_id) DO NOTHING`,
        [
          row.current_cycle_id,
          row.id,
          customer.customer_type,
          customer.code,
          customer.name,
          customer.tax_id,
          customer.phone,
          customer.email,
          customer.address_line,
          customer.province,
          contact?.id || null,
          contact?.full_name || null,
          contact?.email || null,
          contact?.phone || null,
          contact?.job_title || null,
        ]
      ),
    ];
    for (const taskType of TASK_TYPES) {
      const hours = slaHoursForTask(taskType, cycleRow.cycle_type);
      stmts.push(
        txn.query(
          `INSERT INTO quotation_tasks (quotation_id, cycle_id, task_type, task_status, sla_duration_hours)
           VALUES ($1, $2, $3::task_type_enum, 'pending', $4)
           ON CONFLICT (cycle_id, task_type) DO NOTHING`,
          [row.id, row.current_cycle_id, taskType, hours]
        )
      );
    }
    stmts.push(
      txn.query(
        `INSERT INTO quotation_revisions (
           quotation_id, cycle_id, revision_number, revision_code, snapshot_jsonb, created_by
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [row.id, row.current_cycle_id, revisionNumber, revisionCode, snapshotJson, username]
      ),
      txn.query(
        `UPDATE quotations SET workflow_status = $1::workflow_status_enum, updated_by = $2,
         version = version + 1, updated_at = now()
         WHERE id = $3 AND workflow_status = 'draft'${vClause} RETURNING id`,
        headerParams
      ),
      txn.query(
        `INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role, action_note
         ) VALUES ($1, $2, $3::workflow_status_enum, 'executor_intake'::workflow_status_enum,
           'submit'::workflow_action_type_enum, $4, $5, $6)`,
        [row.id, row.current_cycle_id, fromStatus, username, role, resubmitReason || null]
      )
    );
    return stmts;
  });

  const updated = results.find((r) => r.command === "UPDATE");
  if (version !== undefined && updated?.rowCount === 0) {
    return fail(409, "CONFLICT", "Quotation was modified by another request.");
  }

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

module.exports = { submitQuotation };
