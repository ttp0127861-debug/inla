const { query, runWithRequestContext } = require("inla-s-db");
const { getPrincipal } = require("../middleware/auth");
const { mapSalesRelation } = require("./mappers");

async function listSalesRelations(customerId, pagination) {
  const countResult = await query(
    `SELECT count(*)::int AS total FROM customer_sales_relations
     WHERE customer_id = $1 AND status = 'active'`,
    [customerId]
  );
  const result = await query(
    `SELECT * FROM customer_sales_relations
     WHERE customer_id = $1 AND status = 'active'
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [customerId, pagination.pageSize, pagination.offset]
  );
  return {
    sales: result.rows.map(mapSalesRelation),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function addSalesRelation(event, customerId, salesUsername) {
  const actor = getPrincipal(event).username || null;

  const existing = await query(
    `SELECT * FROM customer_sales_relations
     WHERE customer_id = $1 AND sales_username = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [customerId, salesUsername]
  );

  if (existing.rows[0]?.status === "active") {
    const error = new Error("This sales user is already linked to the customer.");
    error.code = "23505";
    throw error;
  }

  if (existing.rows[0]?.status === "inactive") {
    const results = await runWithRequestContext(event, (txn) => [
      txn.query(
        `UPDATE customer_sales_relations
         SET status = 'active'::relation_status_enum,
             ended_at = NULL,
             ended_by = NULL,
             created_by = COALESCE(created_by, $3)
         WHERE id = $1 AND customer_id = $2
         RETURNING *`,
        [existing.rows[0].id, customerId, actor]
      ),
    ]);
    return mapSalesRelation(results[0].rows[0]);
  }

  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `INSERT INTO customer_sales_relations (customer_id, sales_username, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [customerId, salesUsername, actor]
    ),
  ]);
  return mapSalesRelation(results[0].rows[0]);
}

async function removeSalesRelation(event, customerId, salesUsername) {
  const actor = getPrincipal(event).username || null;
  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE customer_sales_relations
       SET status = 'inactive'::relation_status_enum,
           ended_at = now(),
           ended_by = $3
       WHERE customer_id = $1 AND sales_username = $2 AND status = 'active'
       RETURNING *`,
      [customerId, salesUsername, actor]
    ),
  ]);
  return results[0].rows[0] ? mapSalesRelation(results[0].rows[0]) : null;
}

module.exports = { listSalesRelations, addSalesRelation, removeSalesRelation };
