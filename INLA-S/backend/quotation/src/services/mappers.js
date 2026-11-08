const { mapQaLineRowFromDb } = require("./qaLineColumns");

function mapCycle(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    quotationId: row.quotation_id,
    cycleNumber: row.cycle_number,
    cycleType: row.cycle_type,
    resubmitReason: row.resubmit_reason,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function mapQuotation(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    salesOwnerUsername: row.sales_owner_username,
    customerId: row.customer_id,
    customerCode: row.customer_code ?? undefined,
    customerName: row.customer_name ?? undefined,
    contactId: row.contact_id,
    contactFullName: row.contact_full_name ?? undefined,
    clonedFromQuotationId: row.cloned_from_quotation_id,
    workflowStatus: row.workflow_status,
    businessOutcome: row.business_outcome,
    currentCycleId: row.current_cycle_id,
    currentCycleNumber: row.cycle_number ?? undefined,
    currentCycleType: row.cycle_type ?? undefined,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
    finalQuotationValue:
      row.accounting_final_quotation_value != null
        ? Number(row.accounting_final_quotation_value)
        : undefined,
  };
}

function mapSalesData(row) {
  if (!row) return null;
  return {
    salesNote: row.sales_note,
    boxType: row.box_type,
    lengthMm: row.length_mm != null ? Number(row.length_mm) : null,
    widthMm: row.width_mm != null ? Number(row.width_mm) : null,
    heightMm: row.height_mm != null ? Number(row.height_mm) : null,
    dimensionType: row.dimension_type,
    material: row.material,
    layerCount: row.layer_count,
    fluteType: row.flute_type,
    productLoadKg: row.product_load_kg != null ? Number(row.product_load_kg) : null,
    printingDescription: row.printing_description,
    printColorCount: row.print_color_count,
    printSideCount: row.print_side_count,
    quantityPieces: row.quantity_pieces,
    deliveryLocation: row.delivery_location,
    desiredDeliveryTime: row.desired_delivery_time,
    additionalRequirements: row.additional_requirements,
    updatedAt: row.updated_at,
  };
}

function mapQaLineRow(row) {
  return mapQaLineRowFromDb(row);
}

function mapRndLineRow(row) {
  return {
    lineNumber: row.line_number,
    printingPlateCost: row.printing_plate_cost != null ? Number(row.printing_plate_cost) : 0,
    dieCost: row.die_cost != null ? Number(row.die_cost) : 0,
    layoutCode: row.layout_code ?? null,
    layoutQuoteCode: row.layout_quote_code ?? null,
    dieCode: row.die_code ?? null,
    dieQuoteCode: row.die_quote_code ?? null,
    productionPlan: row.production_plan ?? null,
    rndNote: row.rnd_note ?? null,
  };
}

function mapDirectorLineRow(row) {
  return {
    lineNumber: row.line_number,
    directorDecision: row.director_decision ?? null,
    approvalNote: row.approval_note ?? null,
    rejectionReason: row.rejection_reason ?? null,
    decisionAt: row.decision_at ?? null,
  };
}

function mapQaData(rows) {
  if (!rows?.length) return { qaLineData: [] };
  return { qaLineData: rows.map(mapQaLineRow) };
}

function mapRndData(rows) {
  if (!rows?.length) return { rndLineData: [] };
  return { rndLineData: rows.map(mapRndLineRow) };
}

function mapDirectorData(rows) {
  if (!rows?.length) return { directorLineData: [] };
  return { directorLineData: rows.map(mapDirectorLineRow) };
}

function formatIsoDate(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function mapDevelopmentMinutes(row) {
  if (!row) return null;
  const stored = row.payload && typeof row.payload === "object" ? row.payload : {};
  const flat = { ...stored };
  if (row.meeting_place != null) flat.meetingPlace = row.meeting_place;
  if (row.meeting_date != null) flat.meetingDate = formatIsoDate(row.meeting_date);
  delete flat.payload;
  delete flat.updatedAt;
  return flat;
}

function mapExecutorIntake(row) {
  if (!row) return null;
  return { intakeNote: row.intake_note };
}

function mapExecutorConsolidation(row) {
  if (!row) return null;
  return {
    deliveryTerms: row.delivery_terms,
    consolidationNote: row.consolidation_note,
  };
}

function mapLineItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    lineNumber: row.line_number,
    itemCode: row.item_code,
    itemName: row.item_name,
    fluteType: row.flute_type,
    lengthMm: row.length_mm != null ? Number(row.length_mm) : null,
    widthMm: row.width_mm != null ? Number(row.width_mm) : null,
    heightMm: row.height_mm != null ? Number(row.height_mm) : null,
    quantity: row.quantity,
    unitPrice: row.unit_price != null ? Number(row.unit_price) : null,
    lineRemark: row.line_remark,
  };
}

function mapAccounting(row) {
  if (!row) return null;
  return {
    paymentTerms: row.payment_terms,
    vatRate: row.vat_rate != null ? Number(row.vat_rate) : 10,
    financialAdjustment: row.financial_adjustment,
    finalQuotationValue: row.final_quotation_value != null ? Number(row.final_quotation_value) : null,
    accountingNote: row.accounting_note,
  };
}


function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    quotationId: row.quotation_id,
    cycleId: row.cycle_id,
    taskType: row.task_type,
    taskStatus: row.task_status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    slaStartedAt: row.sla_started_at,
    slaDeadlineAt: row.sla_deadline_at,
    slaCompletedAt: row.sla_completed_at,
    slaDurationHours: row.sla_duration_hours != null ? Number(row.sla_duration_hours) : null,
    slaAlertState: row.sla_alert_state,
  };
}

function mapAttachment(row) {
  if (!row) return null;
  return {
    id: row.id,
    quotationId: row.quotation_id,
    cycleId: row.cycle_id,
    section: row.section,
    fileName: row.file_name,
    fileExtension: row.file_extension,
    mimeType: row.mime_type,
    fileSizeBytes: Number(row.file_size_bytes),
    storageKey: row.storage_key,
    uploadedBy: row.uploaded_by,
    uploadedByRole: row.uploaded_by_role,
    uploadedAt: row.uploaded_at,
    sourceAttachmentId: row.source_attachment_id,
    deletedAt: row.deleted_at,
  };
}

function mapWorkflowEvent(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    quotationId: row.quotation_id,
    cycleId: row.cycle_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actionType: row.action_type,
    actorUsername: row.actor_username,
    actorRole: row.actor_role,
    actionAt: row.action_at,
    actionNote: row.action_note,
  };
}

function mapRevision(row) {
  if (!row) return null;
  return {
    id: row.id,
    quotationId: row.quotation_id,
    cycleId: row.cycle_id,
    revisionNumber: row.revision_number,
    revisionCode: row.revision_code,
    createdAt: row.created_at,
    createdBy: row.created_by,
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
    tableName: row.table_name,
    operation: row.operation,
    entityId: row.entity_id,
    quotationId: row.quotation_id,
    action: row.action,
    oldData: row.old_data,
    newData: row.new_data,
  };
}

function mapCustomerSnapshot(row) {
  if (!row) return null;
  return {
    customerType: row.customer_type,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    taxId: row.tax_id,
    phone: row.phone,
    email: row.email,
    addressLine: row.address_line,
    province: row.province,
    contactId: row.contact_id,
    contactFullName: row.contact_full_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    contactJobTitle: row.contact_job_title,
    createdAt: row.created_at,
  };
}

module.exports = {
  mapQuotation,
  mapCycle,
  mapSalesData,
  mapQaData,
  mapRndData,
  mapDevelopmentMinutes,
  mapExecutorIntake,
  mapExecutorConsolidation,
  mapLineItem,
  mapAccounting,
  mapDirectorData,
  mapQaLineRow,
  mapRndLineRow,
  mapDirectorLineRow,
  mapTask,
  mapAttachment,
  mapWorkflowEvent,
  mapRevision,
  mapAuditEvent,
  mapCustomerSnapshot,
};
