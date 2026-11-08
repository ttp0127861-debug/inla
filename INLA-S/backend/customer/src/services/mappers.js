function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    customerType: row.customer_type,
    name: row.name,
    shortName: row.short_name,
    taxId: row.tax_id,
    phone: row.phone,
    email: row.email,
    addressLine: row.address_line,
    province: row.province,
    website: row.website,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    fullName: row.full_name,
    jobTitle: row.job_title,
    department: row.department,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    isPrimary: row.is_primary,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSalesRelation(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    salesUsername: row.sales_username,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    endedAt: row.ended_at,
    endedBy: row.ended_by,
  };
}

function mapAuditEvent(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    occurredAt: row.occurred_at,
    actorUsername: row.actor_username,
    actorRole: row.actor_role,
    requestId: row.request_id,
    schemaName: row.schema_name,
    tableName: row.table_name,
    operation: row.operation,
    entityId: row.entity_id,
    customerId: row.customer_id,
    action: row.action,
    oldData: row.old_data,
    newData: row.new_data,
  };
}

module.exports = { mapCustomer, mapContact, mapSalesRelation, mapAuditEvent };
