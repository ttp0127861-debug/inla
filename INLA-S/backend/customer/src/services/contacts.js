const { query, runWithRequestContext } = require("inla-s-db");
const { mapContact } = require("./mappers");

async function listContacts(customerId, pagination) {
  const countResult = await query(
    `SELECT count(*)::int AS total FROM customer_contacts WHERE customer_id = $1`,
    [customerId]
  );
  const result = await query(
    `SELECT * FROM customer_contacts
     WHERE customer_id = $1
     ORDER BY is_primary DESC, full_name ASC
     LIMIT $2 OFFSET $3`,
    [customerId, pagination.pageSize, pagination.offset]
  );
  return {
    contacts: result.rows.map(mapContact),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function getContact(customerId, contactId) {
  const result = await query(
    `SELECT * FROM customer_contacts WHERE customer_id = $1 AND id = $2`,
    [customerId, contactId]
  );
  return result.rows[0] ? mapContact(result.rows[0]) : null;
}

async function createContact(event, customerId, data) {
  const results = await runWithRequestContext(event, (txn) => {
    const statements = [];
    if (data.isPrimary) {
      statements.push(
        txn.query(
          `UPDATE customer_contacts SET is_primary = false
           WHERE customer_id = $1 AND is_primary = true AND status = 'active'`,
          [customerId]
        )
      );
    }
    statements.push(
      txn.query(
        `INSERT INTO customer_contacts (
           customer_id, full_name, job_title, department, email, phone, notes, is_primary
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          customerId,
          data.fullName,
          data.jobTitle,
          data.department,
          data.email,
          data.phone,
          data.notes,
          data.isPrimary,
        ]
      )
    );
    return statements;
  });
  const last = results[results.length - 1];
  return mapContact(last.rows[0]);
}

async function updateContact(event, customerId, contactId, data) {
  const results = await runWithRequestContext(event, (txn) => {
    const statements = [];
    if (data.isPrimary === true) {
      statements.push(
        txn.query(
          `UPDATE customer_contacts SET is_primary = false
           WHERE customer_id = $1 AND id <> $2 AND is_primary = true AND status = 'active'`,
          [customerId, contactId]
        )
      );
    }

    const sets = [];
    const params = [customerId, contactId];
    const fields = [
      ["fullName", "full_name"],
      ["jobTitle", "job_title"],
      ["department", "department"],
      ["email", "email"],
      ["phone", "phone"],
      ["notes", "notes"],
      ["isPrimary", "is_primary"],
    ];
    for (const [key, column] of fields) {
      if (data[key] !== undefined) {
        params.push(data[key]);
        sets.push(`${column} = $${params.length}`);
      }
    }
    if (sets.length === 0) {
      const error = new Error("Invalid body.");
      error.name = "ValidationError";
      throw error;
    }

    statements.push(
      txn.query(
        `UPDATE customer_contacts SET ${sets.join(", ")}
         WHERE customer_id = $1 AND id = $2
         RETURNING *`,
        params
      )
    );
    return statements;
  });
  const last = results[results.length - 1];
  return mapContact(last.rows[0]);
}

async function deactivateContact(event, customerId, contactId) {
  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `UPDATE customer_contacts
       SET status = 'inactive'::entity_status_enum, is_primary = false
       WHERE customer_id = $1 AND id = $2
       RETURNING *`,
      [customerId, contactId]
    ),
  ]);
  return mapContact(results[0].rows[0]);
}

module.exports = { listContacts, getContact, createContact, updateContact, deactivateContact };
