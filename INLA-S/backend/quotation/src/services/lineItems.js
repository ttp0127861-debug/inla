const { query, runWithRequestContext } = require("inla-s-db");
const { fail } = require("../lib/http");
const { mapLineItem } = require("./mappers");

async function fetchLineItemRows(cycleId) {
  const result = await query(
    `SELECT * FROM quotation_line_items WHERE workflow_cycle_id = $1 ORDER BY line_number`,
    [cycleId]
  );
  return result.rows;
}

async function loadLineItems(cycleId) {
  return (await fetchLineItemRows(cycleId)).map(mapLineItem);
}

function nonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSalesLineRow(row) {
  if (!nonEmptyText(row.item_name)) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires itemName (LIN-02).");
  }
  if (!nonEmptyText(row.flute_type)) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires fluteType (LIN-03).");
  }
  if (row.length_mm == null || Number(row.length_mm) <= 0) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires lengthMm > 0 (LIN-04).");
  }
  if (row.width_mm == null || Number(row.width_mm) <= 0) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires widthMm > 0 (LIN-05).");
  }
  if (row.height_mm == null || Number(row.height_mm) <= 0) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires heightMm > 0 (LIN-06).");
  }
  if (row.quantity == null || Number(row.quantity) < 1) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires quantity >= 1 (LIN-08).");
  }
  return null;
}

function validateLineItemsForSubmit(rows) {
  if (!rows.length) {
    return fail(400, "VALIDATION_ERROR", "At least one line item is required to submit.");
  }
  for (const row of rows) {
    const err = validateSalesLineRow(row);
    if (err) return err;
  }
  return null;
}

function lineInsertWithChildCteSql() {
  return `
    WITH inserted AS (
      INSERT INTO quotation_line_items (
        workflow_cycle_id, quotation_id, line_number, item_code, item_name,
        flute_type, length_mm, width_mm, height_mm, quantity, line_remark
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, workflow_cycle_id, quotation_id
    ),
    qa AS (
      INSERT INTO quotation_line_qa (line_item_id, workflow_cycle_id, quotation_id)
      SELECT id, workflow_cycle_id, quotation_id FROM inserted
    ),
    rnd AS (
      INSERT INTO quotation_line_rnd (line_item_id, workflow_cycle_id, quotation_id)
      SELECT id, workflow_cycle_id, quotation_id FROM inserted
    ),
    director AS (
      INSERT INTO quotation_line_director (line_item_id, workflow_cycle_id, quotation_id)
      SELECT id, workflow_cycle_id, quotation_id FROM inserted
    )
    SELECT id FROM inserted`;
}

function lineItemReplaceStatements(txn, cycleId, quotationId, lines) {
  const stmts = [
    txn.query(`DELETE FROM quotation_line_qa WHERE workflow_cycle_id = $1`, [cycleId]),
    txn.query(`DELETE FROM quotation_line_rnd WHERE workflow_cycle_id = $1`, [cycleId]),
    txn.query(`DELETE FROM quotation_line_director WHERE workflow_cycle_id = $1`, [cycleId]),
    txn.query(`DELETE FROM quotation_line_items WHERE workflow_cycle_id = $1`, [cycleId]),
  ];
  for (const line of lines) {
    stmts.push(
      txn.query(lineInsertWithChildCteSql(), [
        cycleId,
        quotationId,
        line.lineNumber,
        line.itemCode ?? null,
        line.itemName,
        line.fluteType,
        line.lengthMm,
        line.widthMm,
        line.heightMm,
        line.quantity,
        line.lineRemark ?? null,
      ])
    );
  }
  return stmts;
}

async function replaceLineItems(event, cycleId, quotationId, lines) {
  await runWithRequestContext(event, (txn) => lineItemReplaceStatements(txn, cycleId, quotationId, lines));
}

/** Copy spec lines to a new cycle; unit_price cleared (EXECUTOR re-enters LIN-07). */
function copyLineItemsInsertSql(fromCycleParamIndex) {
  return `
    INSERT INTO quotation_line_items (
      workflow_cycle_id, quotation_id, line_number, item_code, item_name,
      flute_type, length_mm, width_mm, height_mm, quantity, line_remark
    )
    SELECT link.cycle_id, link.new_id, li.line_number, li.item_code, li.item_name,
      li.flute_type, li.length_mm, li.width_mm, li.height_mm, li.quantity, li.line_remark
    FROM link
    JOIN quotation_line_items li ON li.workflow_cycle_id = $${fromCycleParamIndex}`;
}

function resubmitCopyLineItemsSql() {
  return `
    INSERT INTO quotation_line_items (
      workflow_cycle_id, quotation_id, line_number, item_code, item_name,
      flute_type, length_mm, width_mm, height_mm, quantity, line_remark
    )
    SELECT upd.cycle_id, upd.quotation_id, li.line_number, li.item_code, li.item_name,
      li.flute_type, li.length_mm, li.width_mm, li.height_mm, li.quantity, li.line_remark
    FROM upd
    JOIN quotation_line_items li ON li.workflow_cycle_id = $4`;
}

async function applyConsolidationLinePatches(event, cycleId, quotationId, patches) {
  if (!patches?.length) return null;
  const results = await runWithRequestContext(event, (txn) =>
    patches.map((patch) => {
      if (patch.id) {
        return txn.query(
          `UPDATE quotation_line_items SET
             unit_price = COALESCE($4, unit_price),
             line_remark = COALESCE($5, line_remark),
             updated_at = now()
           WHERE workflow_cycle_id = $1 AND quotation_id = $2 AND id = $3::uuid
           RETURNING id`,
          [cycleId, quotationId, patch.id, patch.unitPrice, patch.lineRemark]
        );
      }
      return txn.query(
        `UPDATE quotation_line_items SET
           unit_price = COALESCE($4, unit_price),
           line_remark = COALESCE($5, line_remark),
           updated_at = now()
         WHERE workflow_cycle_id = $1 AND quotation_id = $2 AND line_number = $3
         RETURNING id`,
        [cycleId, quotationId, patch.lineNumber, patch.unitPrice, patch.lineRemark]
      );
    })
  );
  const missing = patches.length - results.filter((r) => r.rowCount > 0).length;
  if (missing > 0) {
    return fail(400, "VALIDATION_ERROR", "One or more consolidation lineItems do not match this cycle.");
  }
  return null;
}

async function validateConsolidationLinePrices(cycleId) {
  const result = await query(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE unit_price IS NULL OR unit_price < 0)::int AS invalid
     FROM quotation_line_items WHERE workflow_cycle_id = $1`,
    [cycleId]
  );
  const { total, invalid } = result.rows[0];
  if (total < 1) {
    return fail(400, "VALIDATION_ERROR", "At least one line item is required to complete consolidation.");
  }
  if (invalid > 0) {
    return fail(400, "VALIDATION_ERROR", "Each line item requires unitPrice >= 0 (LIN-07) to complete consolidation.");
  }
  return null;
}

module.exports = {
  loadLineItems,
  fetchLineItemRows,
  validateLineItemsForSubmit,
  lineItemReplaceStatements,
  replaceLineItems,
  copyLineItemsInsertSql,
  resubmitCopyLineItemsSql,
  applyConsolidationLinePatches,
  validateConsolidationLinePrices,
};
