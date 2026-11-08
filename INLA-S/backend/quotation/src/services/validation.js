const WORKFLOW_STATUSES = [
  "draft",
  "cancelled",
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
  "approved",
  "rejected",
];
const BUSINESS_OUTCOMES = ["not_updated", "sent_to_customer", "won", "lost"];
const CYCLE_TYPES = ["new", "re_submit"];
const TASK_TYPES = [
  "executor_intake",
  "qa_review",
  "rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];
const ATTACHMENT_SECTIONS = [
  "sales",
  "qa",
  "rnd",
  "executor_intake",
  "executor_consolidation",
  "accounting",
];
const DIMENSION_TYPES = ["inner", "outer"];
const INK_COVERAGE_BANDS = ["le_30", "le_50", "le_70", "le_100"];
const DIRECTOR_DECISIONS = ["approved", "rejected"];
const SLA_ALERT_STATES = ["normal", "warning", "overdue"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUOTATION_CODE_RE = /^BG-\d{6,}$/;
const CUSTOMER_CODE_RE = /^KH-\d{6,}$/;

const ATT_MIME = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};
const ATT_EXT = {
  image: ["jpg", "jpeg", "png", "webp"],
  video: ["mp4", "mov", "webm"],
  doc: ["pdf", "doc", "docx", "xls", "xlsx"],
};

function invalid(field) {
  const error = new Error(`Invalid ${field}.`);
  error.name = "ValidationError";
  return error;
}

function cleanText(value, maxLen) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text || text.length > maxLen || /[\u0000-\u001F]/.test(text)) return null;
  return text;
}

function cleanOptionalText(value, maxLen) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return cleanText(value, maxLen);
}

function cleanUuid(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim().toLowerCase();
  return UUID_RE.test(text) ? text : null;
}

function cleanEnum(value, allowed) {
  if (value === undefined || value === null || value === "") return undefined;
  return allowed.includes(value) ? value : null;
}

function cleanInt(value, min = null) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = parseInt(String(value), 10);
  if (!Number.isFinite(n)) return null;
  if (min != null && n < min) return null;
  return n;
}

function cleanDecimal(value, min = null) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (min != null && n < min) return null;
  return n;
}

function cleanBool(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return null;
}

function tripletFull(l, w, h) {
  return l != null && w != null && h != null && l > 0 && w > 0 && h > 0;
}

function tripletPartial(l, w, h) {
  const set = [l, w, h].filter((v) => v != null);
  if (!set.length) return false;
  return !tripletFull(l, w, h);
}

function resolveLineItemDimensions(item, index) {
  let innerL = cleanDecimal(item.innerLengthMm, 0.0001);
  let innerW = cleanDecimal(item.innerWidthMm, 0.0001);
  let innerH = cleanDecimal(item.innerHeightMm, 0.0001);
  let outerL = cleanDecimal(item.outerLengthMm, 0.0001);
  let outerW = cleanDecimal(item.outerWidthMm, 0.0001);
  let outerH = cleanDecimal(item.outerHeightMm, 0.0001);

  if (item.lengthMm !== undefined || item.widthMm !== undefined || item.heightMm !== undefined) {
    if (innerL == null && item.lengthMm !== undefined) innerL = cleanDecimal(item.lengthMm, 0.0001);
    if (innerW == null && item.widthMm !== undefined) innerW = cleanDecimal(item.widthMm, 0.0001);
    if (innerH == null && item.heightMm !== undefined) innerH = cleanDecimal(item.heightMm, 0.0001);
  }

  if (tripletPartial(innerL, innerW, innerH)) {
    throw invalid(`lineItems[${index}].innerLengthMm`);
  }
  if (tripletPartial(outerL, outerW, outerH)) {
    throw invalid(`lineItems[${index}].outerLengthMm`);
  }

  const innerFull = tripletFull(innerL, innerW, innerH);
  const outerFull = tripletFull(outerL, outerW, outerH);
  if (!innerFull && !outerFull) {
    throw invalid(`lineItems[${index}]`);
  }

  const lengthMm = innerFull ? innerL : outerL;
  const widthMm = innerFull ? innerW : outerW;
  const heightMm = innerFull ? innerH : outerH;

  return {
    lengthMm,
    widthMm,
    heightMm,
    innerLengthMm: innerFull ? innerL : null,
    innerWidthMm: innerFull ? innerW : null,
    innerHeightMm: innerFull ? innerH : null,
    outerLengthMm: outerFull ? outerL : null,
    outerWidthMm: outerFull ? outerW : null,
    outerHeightMm: outerFull ? outerH : null,
  };
}

function validatePackagingFlags(item, index) {
  if (item.palletStackStrapped === true && item.palletStackUnstrapped === true) {
    throw invalid(`lineItems[${index}].palletStack`);
  }
  if (item.shrinkWrap === true && item.noShrinkWrap === true) {
    throw invalid(`lineItems[${index}].shrinkWrap`);
  }
}

function parseSalesFields(body, { required = false } = {}) {
  const fields = {
    salesNote: cleanOptionalText(body.salesNote, 4000),
    boxType: cleanText(body.boxType, 200),
    lengthMm: cleanDecimal(body.lengthMm, required ? 0.0001 : null),
    widthMm: cleanDecimal(body.widthMm, required ? 0.0001 : null),
    heightMm: cleanDecimal(body.heightMm, required ? 0.0001 : null),
    dimensionType: cleanEnum(body.dimensionType, DIMENSION_TYPES),
    material: cleanText(body.material, 200),
    layerCount: cleanInt(body.layerCount, required ? 1 : 0),
    fluteType: cleanText(body.fluteType, 100),
    productLoadKg: cleanDecimal(body.productLoadKg, required ? 0.0001 : null),
    printingDescription: cleanText(body.printingDescription, 4000),
    printColorCount: cleanInt(body.printColorCount, 0),
    printSideCount: cleanInt(body.printSideCount, 0),
    quantityPieces: cleanInt(body.quantityPieces, required ? 1 : 0),
    deliveryLocation: cleanText(body.deliveryLocation, 500),
    desiredDeliveryTime: cleanText(body.desiredDeliveryTime, 200),
    additionalRequirements: cleanOptionalText(body.additionalRequirements, 4000),
    customerRequestNo: cleanOptionalText(body.customerRequestNo, 200),
  };
  if (required) {
    const req = [
      "boxType",
      "lengthMm",
      "widthMm",
      "heightMm",
      "dimensionType",
      "material",
      "layerCount",
      "fluteType",
      "productLoadKg",
      "printingDescription",
      "printColorCount",
      "printSideCount",
      "quantityPieces",
      "deliveryLocation",
      "desiredDeliveryTime",
    ];
    for (const key of req) {
      if (fields[key] === undefined || fields[key] === null) throw invalid(key);
    }
  }
  return fields;
}

function parseSalesLineItemInput(item, index, { required = false } = {}) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw invalid(`lineItems[${index}]`);
  }
  const lineNumber = cleanInt(item.lineNumber, 1) ?? index + 1;
  if (item.lineNumber !== undefined && lineNumber === null) throw invalid(`lineItems[${index}].lineNumber`);

  const itemName = cleanText(item.itemName, 500);
  const fluteType = cleanText(item.fluteType, 100);
  const layerCount = cleanInt(item.layerCount, 1);
  const quantity = cleanInt(item.quantity, 1);
  const dims = resolveLineItemDimensions(item, index);

  const palletStackStrapped = item.palletStackStrapped !== undefined ? cleanBool(item.palletStackStrapped) : undefined;
  const palletStackUnstrapped =
    item.palletStackUnstrapped !== undefined ? cleanBool(item.palletStackUnstrapped) : undefined;
  const shrinkWrap = item.shrinkWrap !== undefined ? cleanBool(item.shrinkWrap) : undefined;
  const noShrinkWrap = item.noShrinkWrap !== undefined ? cleanBool(item.noShrinkWrap) : undefined;
  if (palletStackStrapped === null) throw invalid(`lineItems[${index}].palletStackStrapped`);
  if (palletStackUnstrapped === null) throw invalid(`lineItems[${index}].palletStackUnstrapped`);
  if (shrinkWrap === null) throw invalid(`lineItems[${index}].shrinkWrap`);
  if (noShrinkWrap === null) throw invalid(`lineItems[${index}].noShrinkWrap`);

  const inkCoverageBand = cleanEnum(item.inkCoverageBand, INK_COVERAGE_BANDS);
  if (item.inkCoverageBand !== undefined && item.inkCoverageBand !== null && item.inkCoverageBand !== "" && !inkCoverageBand) {
    throw invalid(`lineItems[${index}].inkCoverageBand`);
  }

  const productWeightG = item.productWeightG !== undefined ? cleanInt(item.productWeightG, 1) : undefined;
  if (item.productWeightG !== undefined && item.productWeightG !== null && item.productWeightG !== "" && productWeightG === null) {
    throw invalid(`lineItems[${index}].productWeightG`);
  }
  const printColorCount = item.printColorCount !== undefined ? cleanInt(item.printColorCount, 0) : undefined;
  if (
    item.printColorCount !== undefined &&
    item.printColorCount !== null &&
    item.printColorCount !== "" &&
    printColorCount === null
  ) {
    throw invalid(`lineItems[${index}].printColorCount`);
  }
  const unitsPerBundle = item.unitsPerBundle !== undefined ? cleanInt(item.unitsPerBundle, 1) : undefined;
  if (item.unitsPerBundle !== undefined && item.unitsPerBundle !== null && item.unitsPerBundle !== "" && unitsPerBundle === null) {
    throw invalid(`lineItems[${index}].unitsPerBundle`);
  }
  const bundlesPerPallet = item.bundlesPerPallet !== undefined ? cleanInt(item.bundlesPerPallet, 1) : undefined;
  if (
    item.bundlesPerPallet !== undefined &&
    item.bundlesPerPallet !== null &&
    item.bundlesPerPallet !== "" &&
    bundlesPerPallet === null
  ) {
    throw invalid(`lineItems[${index}].bundlesPerPallet`);
  }

  const draft = {
    lineNumber,
    itemCode: cleanOptionalText(item.itemCode, 100),
    fgCode: cleanOptionalText(item.fgCode, 100),
    sapCode: cleanOptionalText(item.sapCode, 100),
    itemName,
    fluteType,
    ...dims,
    layerCount,
    productWeightG: productWeightG ?? null,
    printColorCount: printColorCount ?? null,
    quantity,
    deliveryLocation: cleanOptionalText(item.deliveryLocation, 500),
    salesLineNote: cleanOptionalText(item.salesLineNote, 4000),
    burstWithDriverNote: cleanOptionalText(item.burstWithDriverNote, 2000),
    burstWithoutDriverNote: cleanOptionalText(item.burstWithoutDriverNote, 2000),
    compressionStrengthNote: cleanOptionalText(item.compressionStrengthNote, 2000),
    paperStructureNote: cleanOptionalText(item.paperStructureNote, 4000),
    unitsPerBundle: unitsPerBundle ?? null,
    bundlesPerPallet: bundlesPerPallet ?? null,
    palletStackStrapped: palletStackStrapped ?? null,
    palletStackUnstrapped: palletStackUnstrapped ?? null,
    shrinkWrap: shrinkWrap ?? null,
    noShrinkWrap: noShrinkWrap ?? null,
    inkCoverageBand: inkCoverageBand ?? null,
    lineRemark: cleanOptionalText(item.lineRemark, 4000),
  };

  validatePackagingFlags(
    {
      palletStackStrapped: draft.palletStackStrapped,
      palletStackUnstrapped: draft.palletStackUnstrapped,
      shrinkWrap: draft.shrinkWrap,
      noShrinkWrap: draft.noShrinkWrap,
    },
    index
  );

  if (required) {
    if (!draft.itemName) throw invalid(`lineItems[${index}].itemName`);
    if (!draft.fluteType) throw invalid(`lineItems[${index}].fluteType`);
    if (draft.layerCount == null) throw invalid(`lineItems[${index}].layerCount`);
    if (draft.quantity == null) throw invalid(`lineItems[${index}].quantity`);
  } else if (!draft.itemName || !draft.fluteType || draft.layerCount == null || draft.quantity == null) {
    throw invalid(`lineItems[${index}]`);
  }

  return draft;
}

/** Full replace of cycle line items on Sales draft PUT (see openapi). Empty array clears all lines. */
function parseLineItemsForDraft(items) {
  if (items === undefined) return undefined;
  if (!Array.isArray(items)) throw invalid("lineItems");
  return items.map((item, index) => parseSalesLineItemInput(item, index, { required: true }));
}

function parseConsolidationLineItemPatch(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw invalid(`lineItems[${index}]`);
  }
  const id = cleanUuid(item.id);
  const lineNumber = cleanInt(item.lineNumber, 1);
  if (item.id !== undefined && item.id !== null && item.id !== "" && !id) {
    throw invalid(`lineItems[${index}].id`);
  }
  if (item.lineNumber !== undefined && lineNumber === null) {
    throw invalid(`lineItems[${index}].lineNumber`);
  }
  if (!id && lineNumber === undefined) {
    throw invalid(`lineItems[${index}]`);
  }
  const unitPrice =
    item.unitPrice === undefined ? undefined : cleanDecimal(item.unitPrice, 0);
  if (item.unitPrice !== undefined && unitPrice === null) {
    throw invalid(`lineItems[${index}].unitPrice`);
  }
  return {
    id,
    lineNumber,
    unitPrice,
    lineRemark: cleanOptionalText(item.lineRemark, 4000),
  };
}

function parseCreateQuotation(body) {
  const customerId = cleanUuid(body.customerId);
  if (!customerId) throw invalid("customerId");
  let contactId = null;
  if (body.contactId !== undefined && body.contactId !== null) {
    contactId = cleanUuid(body.contactId);
    if (!contactId) throw invalid("contactId");
  }
  const sales = parseSalesFields(body, { required: false });
  const lineItems = body.lineItems !== undefined ? parseLineItemsForDraft(body.lineItems) : undefined;
  return { customerId, contactId, sales, lineItems };
}

function parseUpdateQuotationDraft(body) {
  const customerId = body.customerId !== undefined ? cleanUuid(body.customerId) : undefined;
  let contactId;
  if (body.contactId !== undefined) {
    if (body.contactId === null) contactId = null;
    else {
      contactId = cleanUuid(body.contactId);
      if (!contactId) throw invalid("contactId");
    }
  }
  const version = cleanInt(body.version, 1);
  const sales = parseSalesFields(body, { required: false });
  const lineItems = body.lineItems !== undefined ? parseLineItemsForDraft(body.lineItems) : undefined;
  const hasSales = Object.values(sales).some((v) => v !== undefined);
  const hasLineItems = lineItems !== undefined;
  if (body.customerId !== undefined && !customerId) throw invalid("customerId");
  if (body.version !== undefined && version === null) throw invalid("version");
  if (
    customerId === undefined &&
    contactId === undefined &&
    version === undefined &&
    !hasSales &&
    !hasLineItems
  ) {
    throw invalid("body");
  }
  return { customerId, contactId, version, sales, lineItems };
}

function parseTaskInboxFilters(query) {
  const slaAlertState = cleanEnum(query?.slaAlertState, SLA_ALERT_STATES);
  if (query?.slaAlertState && !slaAlertState) throw invalid("slaAlertState");
  return { slaAlertState };
}

function parseListFilters(query) {
  const q = query?.q ? String(query.q).trim().slice(0, 200) : undefined;
  const workflowStatus = cleanEnum(query?.workflowStatus, WORKFLOW_STATUSES);
  const businessOutcome = cleanEnum(query?.businessOutcome, BUSINESS_OUTCOMES);
  const cycleType = cleanEnum(query?.cycleType, CYCLE_TYPES);
  if (query?.workflowStatus && !workflowStatus) throw invalid("workflowStatus");
  if (query?.businessOutcome && !businessOutcome) throw invalid("businessOutcome");
  if (query?.cycleType && !cycleType) throw invalid("cycleType");
  return { q: q || undefined, workflowStatus, businessOutcome, cycleType };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

/** OQ-RPT-02: default reporting window = last 30 calendar days (UTC). */
function defaultReportDateRange() {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 30);
  return { fromDate: isoDateOnly(fromDate), toDate: isoDateOnly(toDate) };
}

function parseIsoDateField(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim();
  if (!ISO_DATE_RE.test(text)) throw invalid(field);
  const parsed = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || isoDateOnly(parsed) !== text) throw invalid(field);
  return text;
}

function parseReportFilters(query) {
  const defaults = defaultReportDateRange();
  const fromDate = parseIsoDateField(query?.fromDate, "fromDate") ?? defaults.fromDate;
  const toDate = parseIsoDateField(query?.toDate, "toDate") ?? defaults.toDate;
  if (fromDate > toDate) throw invalid("dateRange");

  const department = cleanEnum(query?.department, TASK_TYPES);
  if (query?.department && query.department !== "all" && !department) throw invalid("department");
  return {
    fromDate,
    toDate,
    department: department || undefined,
  };
}

function parseQuotationCodeParam(code) {
  const cleaned = String(code).trim();
  if (!QUOTATION_CODE_RE.test(cleaned)) throw invalid("code");
  return cleaned;
}

function parseCustomerCodeParam(code) {
  const cleaned = String(code).trim();
  if (!CUSTOMER_CODE_RE.test(cleaned)) throw invalid("customerCode");
  return cleaned;
}

function parseTaskTypeParam(taskType) {
  const t = cleanEnum(taskType, TASK_TYPES);
  if (!t) throw invalid("taskType");
  return t;
}

function parseResubmitSubmit(body) {
  const resubmitReason = cleanText(body.resubmitReason, 2000);
  if (!resubmitReason) throw invalid("resubmitReason");
  const version = cleanInt(body.version, 1);
  if (body.version !== undefined && version === null) throw invalid("version");
  return { resubmitReason, version };
}

function parseClone(body) {
  if (!body || body.copyAttachmentIds === undefined) {
    return { copyAttachmentIds: [] };
  }
  if (!Array.isArray(body.copyAttachmentIds)) {
    throw invalid("copyAttachmentIds");
  }
  const copyAttachmentIds = body.copyAttachmentIds.map((id) => cleanUuid(id)).filter(Boolean);
  if (copyAttachmentIds.length !== body.copyAttachmentIds.length) {
    throw invalid("copyAttachmentIds");
  }
  return { copyAttachmentIds };
}

function parseBusinessOutcome(body) {
  const businessOutcome = cleanEnum(body.businessOutcome, BUSINESS_OUTCOMES);
  const version = cleanInt(body.version, 1);
  if (!businessOutcome) throw invalid("businessOutcome");
  if (body.version !== undefined && version === null) throw invalid("version");
  return { businessOutcome, version };
}

function parseDirectorLineDecision(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw invalid(`lines[${index}]`);
  }
  const lineNumber = cleanInt(item.lineNumber, 1);
  const decision = cleanEnum(item.decision, DIRECTOR_DECISIONS);
  const approvalNote = cleanOptionalText(item.approvalNote, 2000);
  const rejectionReason = cleanOptionalText(item.rejectionReason, 2000);
  if (!lineNumber) throw invalid(`lines[${index}].lineNumber`);
  if (!decision) throw invalid(`lines[${index}].decision`);
  if (decision === "rejected" && !rejectionReason) throw invalid(`lines[${index}].rejectionReason`);
  return { lineNumber, decision, approvalNote, rejectionReason };
}

function parseDirectorDecision(body) {
  const version = cleanInt(body.version, 1);
  if (!Array.isArray(body.lines) || body.lines.length === 0) throw invalid("lines");
  const lines = body.lines.map((item, index) => parseDirectorLineDecision(item, index));
  if (body.version !== undefined && version === null) throw invalid("version");
  return { lines, version };
}

function parsePresignAttachment(body) {
  const fileName = cleanText(body.fileName, 255);
  const mimeType = cleanText(body.mimeType, 100);
  const section = cleanEnum(body.section, ATTACHMENT_SECTIONS);
  const size = cleanInt(body.size, 1);
  if (!fileName) throw invalid("fileName");
  if (!mimeType) throw invalid("mimeType");
  if (!section) throw invalid("section");
  if (!size) throw invalid("size");
  validateAttachmentFile(fileName, mimeType, size);
  return { fileName, mimeType, section, size };
}

function parseConfirmAttachment(body) {
  const presign = parsePresignAttachment(body);
  const storageKey = cleanText(body.storageKey, 500);
  if (!storageKey) throw invalid("storageKey");
  return { ...presign, storageKey };
}

function validateAttachmentFile(fileName, mimeType, sizeBytes) {
  const ext = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  let category = null;
  if (ATT_EXT.image.includes(ext) && ATT_MIME.image.includes(mimeType)) category = "image";
  else if (ATT_EXT.video.includes(ext) && ATT_MIME.video.includes(mimeType)) category = "video";
  else if (ATT_EXT.doc.includes(ext) && ATT_MIME.doc.includes(mimeType)) category = "doc";
  if (!category) {
    const error = new Error("Unsupported file type or MIME.");
    error.name = "ValidationError";
    throw error;
  }
  const max = category === "image" ? 10 * 1024 * 1024 : category === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
  if (sizeBytes > max) {
    const error = new Error("File exceeds size limit for its type.");
    error.name = "ValidationError";
    throw error;
  }
}

function isIsoDate(value) {
  if (value == null) return false;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  return Number.isFinite(Date.parse(text));
}

function cleanOptionalIsoDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (!isIsoDate(value)) throw invalid("meetingDate");
  return String(value).trim();
}

function parseDevelopmentMinutesPayload(body) {
  const meetingPlace = cleanOptionalText(body.meetingPlace, 500);
  const meetingDate = cleanOptionalIsoDate(body.meetingDate);
  if (body.payload === undefined) {
    return { meetingPlace, meetingDate, payload: undefined };
  }
  if (body.payload === null || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    throw invalid("payload");
  }
  const p = body.payload;
  const payload = {};

  if (p.participants !== undefined) {
    if (!Array.isArray(p.participants)) throw invalid("participants");
    payload.participants = p.participants.map((item, index) => {
      if (!item || typeof item !== "object") throw invalid(`participants[${index}]`);
      const seq = cleanInt(item.seq, 1);
      const fullName = cleanText(item.fullName, 200);
      const department = cleanText(item.department, 200);
      if (!seq) throw invalid(`participants[${index}].seq`);
      if (!fullName) throw invalid(`participants[${index}].fullName`);
      if (!department) throw invalid(`participants[${index}].department`);
      return {
        seq,
        fullName,
        department,
        jobTitle: cleanOptionalText(item.jobTitle, 200),
      };
    });
  }

  if (p.printPlates !== undefined) {
    if (!Array.isArray(p.printPlates)) throw invalid("printPlates");
    payload.printPlates = p.printPlates.map((item, index) => {
      if (!item || typeof item !== "object") throw invalid(`printPlates[${index}]`);
      const plateNo = cleanInt(item.plateNo, 1);
      if (!plateNo || plateNo > 7) throw invalid(`printPlates[${index}].plateNo`);
      return {
        plateNo,
        colorSystem: cleanOptionalText(item.colorSystem, 200),
        formulaComposition: cleanOptionalText(item.formulaComposition, 500),
        quota: cleanOptionalText(item.quota, 200),
        trame: cleanOptionalText(item.trame, 200),
        anilox: cleanOptionalText(item.anilox, 200),
      };
    });
  }

  const textFields = [
    ["designNotes", 4000],
    ["sampleBoxNotes", 4000],
    ["finishDieCut", 500],
    ["finishGlue", 500],
    ["finishStaple", 500],
    ["uvCoating", 500],
    ["bundlingMethod", 4000],
    ["palletNotes", 4000],
    ["shippingNotes", 4000],
    ["otherNotes", 4000],
    ["meetingConclusion", 4000],
    ["fluteKind", 200],
    ["creasing", 200],
    ["sheetSize", 500],
    ["fluteOther", 500],
    ["filmLamination", 500],
  ];
  for (const [key, maxLen] of textFields) {
    if (p[key] !== undefined) payload[key] = cleanOptionalText(p[key], maxLen);
  }

  const topLevelPayloadKeys = ["fluteKind", "creasing", "sheetSize", "fluteOther", "filmLamination"];
  for (const key of topLevelPayloadKeys) {
    if (body[key] !== undefined) payload[key] = cleanOptionalText(body[key], 500);
  }

  return { meetingPlace, meetingDate, payload };
}

function parseQaPayload(body) {
  if (!body || typeof body !== "object") throw invalid("body");
  if (body.qaLineData === undefined) throw invalid("qaLineData");
  if (!Array.isArray(body.qaLineData)) throw invalid("qaLineData");
  return { qaLineData: body.qaLineData };
}

function parseRndPayload(body) {
  if (!body || typeof body !== "object") throw invalid("body");
  if (body.rndLineData === undefined) throw invalid("rndLineData");
  if (!Array.isArray(body.rndLineData)) throw invalid("rndLineData");
  return { rndLineData: body.rndLineData };
}

function parseExecutorIntake(body) {
  return { intakeNote: cleanOptionalText(body.intakeNote, 4000) };
}

function parseExecutorConsolidation(body) {
  let lineItems;
  if (body.lineItems !== undefined) {
    if (!Array.isArray(body.lineItems)) throw invalid("lineItems");
    lineItems = body.lineItems.map((item, index) => parseConsolidationLineItemPatch(item, index));
  }
  return {
    deliveryTerms: cleanOptionalText(body.deliveryTerms, 500),
    consolidationNote: cleanOptionalText(body.consolidationNote, 4000),
    lineItems,
  };
}

function parseAccounting(body) {
  return {
    paymentTerms: cleanOptionalText(body.paymentTerms, 500),
    vatRate: cleanDecimal(body.vatRate, 0),
    financialAdjustment: cleanOptionalText(body.financialAdjustment, 500),
    finalQuotationValue: cleanDecimal(body.finalQuotationValue, 0),
    accountingNote: cleanOptionalText(body.accountingNote, 4000),
  };
}

module.exports = {
  parseCreateQuotation,
  parseUpdateQuotationDraft,
  parseListFilters,
  parseReportFilters,
  parseTaskInboxFilters,
  parseQuotationCodeParam,
  parseCustomerCodeParam,
  parseTaskTypeParam,
  parseResubmitSubmit,
  parseClone,
  parseBusinessOutcome,
  parseDirectorDecision,
  parsePresignAttachment,
  parseConfirmAttachment,
  parseQaPayload,
  parseRndPayload,
  parseDevelopmentMinutesPayload,
  parseExecutorIntake,
  parseExecutorConsolidation,
  parseAccounting,
  parseSalesFields,
  parseLineItemsForDraft,
  TASK_TYPES,
  ATTACHMENT_SECTIONS,
};
