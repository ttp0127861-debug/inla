const { query, runWithRequestContext } = require("inla-s-db");
const { getPrincipal, isAdmin } = require("../middleware/auth");
const { mapCustomer } = require("./mappers");
const { phoneSearchPatterns } = require("./validation");

function insertParams(data, actor) {
  return [
    data.customerType,
    data.name,
    data.shortName,
    data.taxId,
    data.phone,
    data.email,
    data.addressLine,
    data.province,
    data.website,
    data.notes,
    actor,
  ];
}

async function createCustomer(event, data) {
  const { username, role } = getPrincipal(event);
  const actor = username || null;
  const baseParams = insertParams(data, actor);

  if (role === "SALES") {
    const results = await runWithRequestContext(event, (txn) => [
      txn.query(
        `WITH ins AS (
           INSERT INTO customers (
             customer_type, name, short_name, tax_id, phone, email,
             address_line, province, website, notes, created_by, updated_by
           ) VALUES (
             $1::customer_type_enum, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
           )
           RETURNING *
         ),
         rel AS (
           INSERT INTO customer_sales_relations (customer_id, sales_username, created_by)
           SELECT id, $12, $11 FROM ins
         )
         SELECT * FROM ins`,
        [...baseParams, username]
      ),
    ]);
    return mapCustomer(results[0].rows[0]);
  }

  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `INSERT INTO customers (
         customer_type, name, short_name, tax_id, phone, email,
         address_line, province, website, notes, created_by, updated_by
       ) VALUES (
         $1::customer_type_enum, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
       )
       RETURNING *`,
      baseParams
    ),
  ]);
  return mapCustomer(results[0].rows[0]);
}

async function listCustomers(event, filters, pagination) {
  const params = [];
  const where = ["1=1"];

  if (!isAdmin(event)) {
    params.push(getPrincipal(event).username);
    where.push(
      `EXISTS (
         SELECT 1 FROM customer_sales_relations r
         WHERE r.customer_id = c.id AND r.sales_username = $${params.length} AND r.status = 'active'
       )`
    );
  }

  if (filters.customerType) {
    params.push(filters.customerType);
    where.push(`c.customer_type = $${params.length}::customer_type_enum`);
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`c.status = $${params.length}::entity_status_enum`);
  }
  if (filters.province) {
    params.push(filters.province);
    where.push(`c.province = $${params.length}`);
  }
  if (filters.q) {
    const textIdx = params.length + 1;
    params.push(`%${filters.q}%`);
    const parts = [
      `c.name ILIKE $${textIdx}`,
      `c.code ILIKE $${textIdx}`,
      `c.tax_id ILIKE $${textIdx}`,
      `c.email ILIKE $${textIdx}`,
    ];
    for (const pattern of phoneSearchPatterns(filters.q)) {
      params.push(pattern);
      parts.push(`c.phone ILIKE $${params.length}`);
    }
    where.push(`(${parts.join(" OR ")})`);
  }

  const whereSql = where.join(" AND ");
  const countResult = await query(`SELECT count(*)::int AS total FROM customers c WHERE ${whereSql}`, params);
  const total = countResult.rows[0].total;

  params.push(pagination.pageSize);
  const limitIdx = params.length;
  params.push(pagination.offset);
  const offsetIdx = params.length;

  const rows = await query(
    `SELECT c.* FROM customers c
     WHERE ${whereSql}
     ORDER BY c.updated_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    customers: rows.rows.map(mapCustomer),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
  };
}

async function updateCustomer(event, customerId, data) {
  const sets = [];
  const params = [];
  const actor = getPrincipal(event).username || null;

  const fields = [
    ["customerType", "customer_type", "customer_type_enum"],
    ["name", "name", null],
    ["shortName", "short_name", null],
    ["taxId", "tax_id", null],
    ["phone", "phone", null],
    ["email", "email", null],
    ["addressLine", "address_line", null],
    ["province", "province", null],
    ["website", "website", null],
    ["notes", "notes", null],
  ];

  for (const [key, column, enumType] of fields) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      const cast = enumType ? `::${enumType}` : "";
      sets.push(`${column} = $${params.length}${cast}`);
    }
  }

  params.push(actor);
  sets.push(`updated_by = $${params.length}`);
  params.push(customerId);

  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE customers SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    ),
  ]);
  return mapCustomer(results[0].rows[0]);
}

async function setCustomerStatus(event, customerId, status) {
  const actor = getPrincipal(event).username || null;
  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE customers
       SET status = $1::entity_status_enum, updated_by = $2
       WHERE id = $3
       RETURNING *`,
      [status, actor, customerId]
    ),
  ]);
  return mapCustomer(results[0].rows[0]);
}

module.exports = { createCustomer, listCustomers, updateCustomer, setCustomerStatus };
