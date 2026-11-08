const { query } = require("inla-s-db");
const { mapQuotation } = require("./mappers");
const { SELECT_QUOTATION } = require("./access");

async function similarByProduct(row) {
  const sales = await query(`SELECT * FROM quotation_sales_data WHERE workflow_cycle_id = $1`, [
    row.current_cycle_id,
  ]);
  const s = sales.rows[0];
  if (!s?.box_type) return { quotations: [] };

  const result = await query(
    `${SELECT_QUOTATION}
     JOIN quotation_sales_data sd ON sd.workflow_cycle_id = q.current_cycle_id
     WHERE q.id <> $1 AND sd.box_type = $2 AND ($3::text = '' OR sd.material = $3)
     ORDER BY q.updated_at DESC LIMIT 5`,
    [row.id, s.box_type, s.material || ""]
  );
  return { quotations: result.rows.map(mapQuotation) };
}

async function similarByCustomer(row) {
  const result = await query(
    `${SELECT_QUOTATION} WHERE q.customer_id = $1 AND q.id <> $2
     ORDER BY q.created_at DESC LIMIT 5`,
    [row.customer_id, row.id]
  );
  return { quotations: result.rows.map(mapQuotation) };
}

module.exports = { similarByProduct, similarByCustomer };
