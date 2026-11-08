const { query } = require("inla-s-db");
const { fail } = require("../lib/http");
const { isAdmin, getPrincipal } = require("../middleware/auth");

async function findCustomerByCode(code) {
  const result = await query("SELECT * FROM customers WHERE code = $1", [code]);
  return result.rows[0] || null;
}

async function hasActiveSalesRelation(customerId, salesUsername) {
  const result = await query(
    `SELECT 1 FROM customer_sales_relations
     WHERE customer_id = $1 AND sales_username = $2 AND status = 'active'`,
    [customerId, salesUsername]
  );
  return result.rows.length > 0;
}

async function loadCustomerForAccess(event, code) {
  const customer = await findCustomerByCode(code);
  if (!customer) return { response: fail(404, "NOT_FOUND", "Customer not found.") };
  if (isAdmin(event)) return { customer };
  const { username } = getPrincipal(event);
  const allowed = await hasActiveSalesRelation(customer.id, username);
  if (!allowed) return { response: fail(404, "NOT_FOUND", "Customer not found.") };
  return { customer };
}

module.exports = { findCustomerByCode, hasActiveSalesRelation, loadCustomerForAccess };
