const { query } = require("inla-s-db");
const { fail } = require("../lib/http");
const { getPrincipal } = require("../middleware/auth");

async function hasActiveSalesRelation(customerId, salesUsername) {
  const result = await query(
    `SELECT 1 FROM customer_sales_relations
     WHERE customer_id = $1 AND sales_username = $2 AND status = 'active'`,
    [customerId, salesUsername]
  );
  return result.rows.length > 0;
}

async function loadCustomerById(customerId) {
  const result = await query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
  return result.rows[0] || null;
}

async function loadContactForCustomer(contactId, customerId) {
  if (!contactId) return null;
  const result = await query(`SELECT * FROM customer_contacts WHERE id = $1`, [contactId]);
  const row = result.rows[0];
  if (!row || row.customer_id !== customerId) return null;
  return row;
}

async function countActiveContacts(customerId) {
  const result = await query(
    `SELECT count(*)::int AS n FROM customer_contacts WHERE customer_id = $1 AND status = 'active'`,
    [customerId]
  );
  return result.rows[0].n;
}

async function assertCustomerAndContactForSales(event, customerId, contactId) {
  const customer = await loadCustomerById(customerId);
  if (!customer) {
    return { response: fail(400, "VALIDATION_ERROR", "Customer not found.") };
  }
  const { username } = getPrincipal(event);
  const allowed = await hasActiveSalesRelation(customer.id, username);
  if (!allowed) {
    return { response: fail(400, "VALIDATION_ERROR", "Customer not found or not assigned to you.") };
  }
  if (contactId) {
    const contact = await loadContactForCustomer(contactId, customerId);
    if (!contact) {
      return { response: fail(400, "VALIDATION_ERROR", "Contact not found for this customer.") };
    }
  }
  return { customer };
}

async function validateSubmitCustomerContact(customerId, contactId) {
  const customer = await loadCustomerById(customerId);
  if (!customer) return fail(400, "VALIDATION_ERROR", "Customer not found.");
  if (customer.status !== "active") {
    return fail(400, "VALIDATION_ERROR", "Customer must be active to submit.");
  }
  if (customer.customer_type === "business") {
    const activeCount = await countActiveContacts(customerId);
    if (activeCount < 1) {
      return fail(400, "VALIDATION_ERROR", "Business customer must have at least one active contact.");
    }
    if (!contactId) {
      return fail(400, "VALIDATION_ERROR", "Contact is required for business customers.");
    }
    const contact = await loadContactForCustomer(contactId, customerId);
    if (!contact || contact.status !== "active") {
      return fail(400, "VALIDATION_ERROR", "Contact must be active.");
    }
  } else if (contactId) {
    const contact = await loadContactForCustomer(contactId, customerId);
    if (!contact || contact.status !== "active") {
      return fail(400, "VALIDATION_ERROR", "Contact must be active.");
    }
  }
  return null;
}

module.exports = {
  assertCustomerAndContactForSales,
  validateSubmitCustomerContact,
  loadCustomerById,
  loadContactForCustomer,
  hasActiveSalesRelation,
  countActiveContacts,
};
