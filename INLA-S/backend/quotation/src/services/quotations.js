const { query, runWithRequestContext } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal, isSales, isAdmin } = require("../middleware/auth");
const { hasActiveSalesRelation } = require("./references");
const { mapQuotation } = require("./mappers");
const { SELECT_QUOTATION, fetchQuotationRow } = require("./access");
const { assertCustomerAndContactForSales } = require("./references");
const { salesUpdateSets, salesInsertQuery, versionWhere } = require("./sqlHelpers");
const { insertEmptyRolePayloads, lineChildInsertCtes } = require("./cycles");
const { buildQuotationDetail } = require("./aggregate");
const { lineItemReplaceStatements } = require("./lineItems");
async function createQuotation(event, data) {
  const check = await assertCustomerAndContactForSales(event, data.customerId, data.contactId);
  if (check.response) return check.response;

  const { username } = getPrincipal(event);
  const actor = username || null;

  const boot = await runWithRequestContext(event, (txn) => [
    txn.query(
      `WITH ins AS (
         INSERT INTO quotations (
           sales_owner_username, customer_id, contact_id, created_by, updated_by
         ) VALUES ($1, $2, $3, $4, $4)
         RETURNING id
       ),
       cyc AS (
         INSERT INTO workflow_cycles (quotation_id, cycle_number, cycle_type)
         SELECT id, 1, 'new' FROM ins
         RETURNING id, quotation_id
       ),
       link AS (
         UPDATE quotations q SET current_cycle_id = cyc.id
         FROM cyc WHERE q.id = cyc.quotation_id
         RETURNING q.id, cyc.id AS cycle_id
       )
       SELECT id, cycle_id FROM link`,
      [username, data.customerId, data.contactId, actor]
    ),
  ]);

  const { id, cycle_id: cycleId } = boot[0].rows[0];
  await runWithRequestContext(event, (txn) => [
    salesInsertQuery(txn, cycleId, id, data.sales),
    ...insertEmptyRolePayloads(txn, cycleId, id),
    ...(data.lineItems !== undefined
      ? lineItemReplaceStatements(txn, cycleId, id, data.lineItems)
      : []),
  ]);

  return buildQuotationDetail(await fetchQuotationRow(id));
}

async function listQuotations(event, filters, pagination) {
  const params = [];
  const where = ["1=1"];

  if (isSales(event)) {
    params.push(getPrincipal(event).username);
    where.push(`lower(q.sales_owner_username) = lower($${params.length})`);
  }

  if (filters.workflowStatus) {
    params.push(filters.workflowStatus);
    where.push(`q.workflow_status = $${params.length}::workflow_status_enum`);
  }
  if (filters.businessOutcome) {
    params.push(filters.businessOutcome);
    where.push(`q.business_outcome = $${params.length}::business_outcome_enum`);
  }
  if (filters.cycleType) {
    params.push(filters.cycleType);
    where.push(`wc.cycle_type = $${params.length}::cycle_type_enum`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    const idx = params.length;
    where.push(`(q.code ILIKE $${idx} OR c.name ILIKE $${idx} OR c.code ILIKE $${idx})`);
  }

  const whereSql = where.join(" AND ");
  const countResult = await query(
    `SELECT count(*)::int AS total
     FROM quotations q
     JOIN customers c ON c.id = q.customer_id
     LEFT JOIN workflow_cycles wc ON wc.id = q.current_cycle_id
     WHERE ${whereSql}`,
    params
  );

  params.push(pagination.pageSize);
  const limitIdx = params.length;
  params.push(pagination.offset);
  const offsetIdx = params.length;

  const rows = await query(
    `${SELECT_QUOTATION}
     WHERE ${whereSql}
     ORDER BY q.updated_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    quotations: rows.rows.map(mapQuotation),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function listQuotationsForCustomer(event, customerCode, pagination) {
  const customer = await query(`SELECT id FROM customers WHERE code = $1`, [customerCode]);
  if (!customer.rows[0]) return fail(404, "NOT_FOUND", "Customer not found.");
  const customerId = customer.rows[0].id;

  if (isSales(event) && !isAdmin(event)) {
    const allowed = await hasActiveSalesRelation(customerId, getPrincipal(event).username);
    if (!allowed) return fail(404, "NOT_FOUND", "Customer not found.");
  }

  const params = [customerId];
  const where = [`q.customer_id = $1`];
  if (isSales(event)) {
    params.push(getPrincipal(event).username);
    where.push(`q.sales_owner_username = $${params.length}`);
  }

  const whereSql = where.join(" AND ");
  const countResult = await query(
    `SELECT count(*)::int AS total FROM quotations q WHERE ${whereSql}`,
    params
  );
  params.push(pagination.pageSize);
  const limitIdx = params.length;
  params.push(pagination.offset);
  const offsetIdx = params.length;
  const rows = await query(
    `${SELECT_QUOTATION} WHERE ${whereSql} ORDER BY q.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  return {
    quotations: rows.rows.map(mapQuotation),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function updateDraftQuotation(event, row, data) {
  if (row.workflow_status !== "draft") {
    return fail(409, "CONFLICT", "Only draft quotations can be updated.");
  }
  const cycle = await query(`SELECT submitted_at FROM workflow_cycles WHERE id = $1`, [row.current_cycle_id]);
  if (cycle.rows[0]?.submitted_at) {
    return fail(409, "CONFLICT", "Current cycle was submitted; sales data is locked.");
  }

  const customerId = data.customerId ?? row.customer_id;
  const contactId = data.contactId !== undefined ? data.contactId : row.contact_id;
  const check = await assertCustomerAndContactForSales(event, customerId, contactId);
  if (check.response) return check.response;

  const actor = getPrincipal(event).username || null;
  const headerParams = [customerId, contactId, actor, row.id];
  const vClause = versionWhere(data.version, headerParams);

  const salesSets = salesUpdateSets(data.sales);
  const salesParams = [...salesSets.params, row.current_cycle_id];

  const results = await runWithRequestContext(event, (txn) => {
    const stmts = [];
    if (data.customerId !== undefined || data.contactId !== undefined) {
      stmts.push(
        txn.query(
          `UPDATE quotations SET customer_id = $1, contact_id = $2, updated_by = $3,
           version = version + 1, updated_at = now()
           WHERE id = $4 AND workflow_status = 'draft'${vClause} RETURNING id`,
          headerParams
        )
      );
    } else if (data.version !== undefined) {
      stmts.push(
        txn.query(
          `UPDATE quotations SET updated_by = $1, version = version + 1, updated_at = now()
           WHERE id = $2 AND workflow_status = 'draft'${versionWhere(data.version, [actor, row.id])} RETURNING id`,
          [actor, row.id, data.version]
        )
      );
    }
    if (salesSets.sets.length) {
      stmts.push(
        txn.query(
          `UPDATE quotation_sales_data SET ${salesSets.sets.join(", ")}, updated_at = now()
           WHERE workflow_cycle_id = $${salesParams.length}`,
          salesParams
        )
      );
    }
    if (data.lineItems !== undefined) {
      stmts.push(...lineItemReplaceStatements(txn, row.current_cycle_id, row.id, data.lineItems));
    }
    const touchedSalesOrLines = salesSets.sets.length || data.lineItems !== undefined;
    if (
      touchedSalesOrLines &&
      !data.customerId &&
      data.contactId === undefined &&
      data.version === undefined
    ) {
      stmts.push(
        txn.query(
          `UPDATE quotations SET updated_by = $1, version = version + 1, updated_at = now()
           WHERE id = $2 AND workflow_status = 'draft' RETURNING id`,
          [actor, row.id]
        )
      );
    }
    return stmts.length ? stmts : [txn.query(`SELECT $1::uuid AS id`, [row.id])];
  });

  const headerUpdate = results.find((r) => r.rows && r.command === "UPDATE");
  if (data.version !== undefined && headerUpdate && headerUpdate.rowCount === 0) {
    return fail(409, "CONFLICT", "Quotation was modified by another request.");
  }

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function cancelDraftQuotation(event, row) {
  if (row.workflow_status !== "draft") {
    return fail(409, "CONFLICT", "Only draft quotations can be cancelled.");
  }
  const actor = getPrincipal(event).username || null;
  const fromStatus = row.workflow_status;
  const { role } = getPrincipal(event);

  await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotations SET workflow_status = 'cancelled', cancelled_at = now(), cancelled_by = $1,
       updated_by = $1, version = version + 1 WHERE id = $2 AND workflow_status = 'draft' RETURNING id`,
      [actor, row.id]
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
       ) VALUES ($1, $2, $3::workflow_status_enum, 'cancelled'::workflow_status_enum,
         'cancel'::workflow_action_type_enum, $4, $5)`,
      [row.id, row.current_cycle_id, fromStatus, actor, role]
    ),
  ]);

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function prepareResubmit(event, row) {
  const allowed =
    row.workflow_status === "rejected" ||
    (row.workflow_status === "approved" && row.business_outcome === "lost");
  if (!allowed) {
    return fail(409, "CONFLICT", "Re-submit is only allowed from rejected or lost outcome.");
  }

  const cycleNumber = await query(
    `SELECT COALESCE(max(cycle_number), 0) + 1 AS n FROM workflow_cycles WHERE quotation_id = $1`,
    [row.id]
  );

  const { username, role } = getPrincipal(event);
  const prevCycleId = row.current_cycle_id;
  const fromStatus = row.workflow_status;

  await runWithRequestContext(event, (txn) => [
    txn.query(
      `WITH new_cyc AS (
         INSERT INTO workflow_cycles (quotation_id, cycle_number, cycle_type)
         VALUES ($1, $2, 're_submit') RETURNING id
       ),
       upd AS (
         UPDATE quotations q SET workflow_status = 'draft', current_cycle_id = new_cyc.id,
           updated_by = $3, version = q.version + 1, updated_at = now()
         FROM new_cyc WHERE q.id = $1
         RETURNING new_cyc.id AS cycle_id, q.id AS quotation_id
       ),
       ins_sales AS (
         INSERT INTO quotation_sales_data (
           workflow_cycle_id, quotation_id, sales_note, box_type, length_mm, width_mm, height_mm,
           dimension_type, material, layer_count, flute_type, product_load_kg, printing_description,
           print_color_count, print_side_count, quantity_pieces, delivery_location,
           desired_delivery_time, additional_requirements
         )
         SELECT upd.cycle_id, upd.quotation_id,
           s.sales_note, s.box_type, s.length_mm, s.width_mm, s.height_mm, s.dimension_type,
           s.material, s.layer_count, s.flute_type, s.product_load_kg, s.printing_description,
           s.print_color_count, s.print_side_count, s.quantity_pieces, s.delivery_location,
           s.desired_delivery_time, s.additional_requirements
         FROM upd
         JOIN quotation_sales_data s ON s.workflow_cycle_id = $4
       ),
       ins_lines AS (
         INSERT INTO quotation_line_items (
           workflow_cycle_id, quotation_id, line_number, item_code, item_name,
           flute_type, length_mm, width_mm, height_mm, quantity, line_remark
         )
         SELECT upd.cycle_id, upd.quotation_id, li.line_number, li.item_code, li.item_name,
           li.flute_type, li.length_mm, li.width_mm, li.height_mm, li.quantity, li.line_remark
         FROM upd
         JOIN quotation_line_items li ON li.workflow_cycle_id = $4
       ),
       ${lineChildInsertCtes("upd")},
       ins_minutes AS (
         INSERT INTO quotation_development_minutes (workflow_cycle_id, quotation_id)
         SELECT cycle_id, quotation_id FROM upd
       ),
       ins_intake AS (
         INSERT INTO quotation_executor_intake (workflow_cycle_id, quotation_id)
         SELECT cycle_id, quotation_id FROM upd
       ),
       ins_cons AS (
         INSERT INTO quotation_executor_consolidation (workflow_cycle_id, quotation_id)
         SELECT cycle_id, quotation_id FROM upd
       ),
       ins_acc AS (
         INSERT INTO quotation_accounting_data (workflow_cycle_id, quotation_id)
         SELECT cycle_id, quotation_id FROM upd
       ),
       evt AS (
         INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
         )
         SELECT upd.quotation_id, upd.cycle_id, $5::workflow_status_enum, 'draft'::workflow_status_enum,
           'resubmit_open'::workflow_action_type_enum, $3, $6
         FROM upd
       )
       SELECT cycle_id FROM upd`,
      [row.id, cycleNumber.rows[0].n, username, prevCycleId, fromStatus, role]
    ),
  ]);

  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

async function cloneQuotation(event, sourceRow, { copyAttachmentIds }) {
  const { username, role } = getPrincipal(event);
  const actor = username;
  const sourceCycleId = sourceRow.current_cycle_id;

  if (copyAttachmentIds.length) {
    const check = await query(
      `SELECT count(*)::int AS n FROM quotation_attachments
       WHERE id = ANY($1::uuid[]) AND quotation_id = $2 AND cycle_id = $3 AND deleted_at IS NULL`,
      [copyAttachmentIds, sourceRow.id, sourceCycleId]
    );
    if (check.rows[0].n !== copyAttachmentIds.length) {
      return fail(400, "VALIDATION_ERROR", "copyAttachmentIds must belong to the source quotation cycle.");
    }
  }

  const createRes = await runWithRequestContext(event, (txn) => [
    txn.query(
      `WITH ins AS (
         INSERT INTO quotations (
           sales_owner_username, customer_id, contact_id, cloned_from_quotation_id, created_by, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $5)
         RETURNING id
       ),
       cyc AS (
         INSERT INTO workflow_cycles (quotation_id, cycle_number, cycle_type)
         SELECT id, 1, 'new' FROM ins RETURNING id, quotation_id
       ),
       link AS (
         UPDATE quotations q SET current_cycle_id = cyc.id FROM cyc WHERE q.id = cyc.quotation_id
         RETURNING q.id AS new_id, cyc.id AS cycle_id
       ),
       ins_sales AS (
         INSERT INTO quotation_sales_data (
           workflow_cycle_id, quotation_id, sales_note, box_type, length_mm, width_mm, height_mm,
           dimension_type, material, layer_count, flute_type, product_load_kg, printing_description,
           print_color_count, print_side_count, quantity_pieces, delivery_location,
           desired_delivery_time, additional_requirements
         )
         SELECT link.cycle_id, link.new_id,
           s.sales_note, s.box_type, s.length_mm, s.width_mm, s.height_mm, s.dimension_type,
           s.material, s.layer_count, s.flute_type, s.product_load_kg, s.printing_description,
           s.print_color_count, s.print_side_count, s.quantity_pieces, s.delivery_location,
           s.desired_delivery_time, s.additional_requirements
         FROM link
         JOIN quotation_sales_data s ON s.workflow_cycle_id = $6
       ),
       ins_lines AS (
         INSERT INTO quotation_line_items (
           workflow_cycle_id, quotation_id, line_number, item_code, item_name,
           flute_type, length_mm, width_mm, height_mm, quantity, line_remark
         )
         SELECT link.cycle_id, link.new_id, li.line_number, li.item_code, li.item_name,
           li.flute_type, li.length_mm, li.width_mm, li.height_mm, li.quantity, li.line_remark
         FROM link
         JOIN quotation_line_items li ON li.workflow_cycle_id = $6
       ),
       ${lineChildInsertCtes("link")},
       ins_minutes AS (INSERT INTO quotation_development_minutes SELECT cycle_id, new_id FROM link),
       ins_intake AS (INSERT INTO quotation_executor_intake SELECT cycle_id, new_id FROM link),
       ins_cons AS (INSERT INTO quotation_executor_consolidation SELECT cycle_id, new_id FROM link),
       ins_acc AS (INSERT INTO quotation_accounting_data SELECT cycle_id, new_id FROM link),
       evt AS (
         INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
         )
         SELECT link.new_id, link.cycle_id, NULL, 'draft'::workflow_status_enum,
           'clone'::workflow_action_type_enum, $1, $7
         FROM link
       )
       SELECT new_id, cycle_id FROM link`,
      [username, sourceRow.customer_id, sourceRow.contact_id, sourceRow.id, actor, sourceCycleId, role]
    ),
  ]);

  const { new_id: newId, cycle_id: cycleId } = createRes[0].rows[0];

  if (copyAttachmentIds.length) {
    await runWithRequestContext(event, (txn) => [
      txn.query(
        `INSERT INTO quotation_attachments (
           quotation_id, cycle_id, section, file_name, file_extension, mime_type, file_size_bytes,
           storage_key, uploaded_by, uploaded_by_role, source_attachment_id
         )
         SELECT $1, $2, a.section, a.file_name, a.file_extension, a.mime_type, a.file_size_bytes,
           a.storage_key, $3, $4, a.id
         FROM quotation_attachments a
         WHERE a.id = ANY($5::uuid[])`,
        [newId, cycleId, username, role, copyAttachmentIds]
      ),
    ]);
  }

  return buildQuotationDetail(await fetchQuotationRow(newId));
}

async function updateBusinessOutcome(event, row, { businessOutcome, version }) {
  if (row.workflow_status !== "approved") {
    return fail(409, "CONFLICT", "Business outcome can only change when workflow is approved.");
  }
  const current = row.business_outcome;
  const allowed = {
    not_updated: ["sent_to_customer", "won", "lost"],
    sent_to_customer: ["won", "lost"],
    won: [],
    lost: [],
  };
  if (!allowed[current]?.includes(businessOutcome)) {
    return fail(409, "CONFLICT", "Invalid business outcome transition.");
  }

  const params = [businessOutcome, getPrincipal(event).username, row.id];
  const vClause = versionWhere(version, params);
  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE quotations SET business_outcome = $1::business_outcome_enum, updated_by = $2,
       version = version + 1 WHERE id = $3${vClause} RETURNING id`,
      params
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role, action_note
       ) VALUES ($1, $2, 'approved'::workflow_status_enum, 'approved'::workflow_status_enum,
         'outcome_update'::workflow_action_type_enum, $3, 'SALES', $4)`,
      [row.id, row.current_cycle_id, getPrincipal(event).username, businessOutcome]
    ),
  ]);
  if (version !== undefined && results[0].rowCount === 0) {
    return fail(409, "CONFLICT", "Quotation was modified by another request.");
  }
  return buildQuotationDetail(await fetchQuotationRow(row.id));
}

module.exports = {
  createQuotation,
  listQuotations,
  listQuotationsForCustomer,
  updateDraftQuotation,
  cancelDraftQuotation,
  prepareResubmit,
  cloneQuotation,
  updateBusinessOutcome,
  buildQuotationDetail,
};
