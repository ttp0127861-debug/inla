const { query } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal, isSales } = require("../middleware/auth");

const SELECT_QUOTATION = `
  SELECT q.*,
         c.code AS customer_code,
         c.name AS customer_name,
         c.customer_type,
         c.status AS customer_status,
         cc.full_name AS contact_full_name,
         cc.status AS contact_status,
         wc.cycle_number,
         wc.cycle_type,
         wc.submitted_at AS cycle_submitted_at,
         wc.resubmit_reason,
         ad.final_quotation_value AS accounting_final_quotation_value
  FROM quotations q
  JOIN customers c ON c.id = q.customer_id
  LEFT JOIN customer_contacts cc ON cc.id = q.contact_id
  LEFT JOIN workflow_cycles wc ON wc.id = q.current_cycle_id
  LEFT JOIN quotation_accounting_data ad ON ad.workflow_cycle_id = q.current_cycle_id
`;

async function findQuotationByCode(code) {
  const result = await query(`${SELECT_QUOTATION} WHERE q.code = $1`, [code]);
  return result.rows[0] || null;
}

async function findQuotationById(id) {
  const result = await query(`${SELECT_QUOTATION} WHERE q.id = $1`, [id]);
  return result.rows[0] || null;
}

function salesOwnerMismatch(row, username) {
  return row.sales_owner_username !== username;
}

async function loadQuotationForRead(event, code) {
  const row = await findQuotationByCode(code);
  if (!row) return { response: fail(404, "NOT_FOUND", "Quotation not found.") };
  if (isSales(event) && salesOwnerMismatch(row, getPrincipal(event).username)) {
    return { response: fail(404, "NOT_FOUND", "Quotation not found.") };
  }
  return { row };
}

async function loadQuotationForSalesOwner(event, code) {
  const read = await loadQuotationForRead(event, code);
  if (read.response) return read;
  if (getPrincipal(event).role !== "SALES") {
    return { response: fail(403, "FORBIDDEN", "Only SALES can perform this action.") };
  }
  if (salesOwnerMismatch(read.row, getPrincipal(event).username)) {
    return { response: fail(404, "NOT_FOUND", "Quotation not found.") };
  }
  return read;
}

async function fetchQuotationRow(id) {
  const result = await query(`${SELECT_QUOTATION} WHERE q.id = $1`, [id]);
  return result.rows[0] || null;
}

module.exports = {
  findQuotationByCode,
  findQuotationById,
  fetchQuotationRow,
  loadQuotationForRead,
  loadQuotationForSalesOwner,
  SELECT_QUOTATION,
};
