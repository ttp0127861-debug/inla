const fs = require("fs");
const path = require("path");
const { query, runWithRequestContext } = require("../../src/index.js");

const REPO_DIR = path.resolve(__dirname, "../../../repo");
const TSV_PATH = path.join(REPO_DIR, "quotations.tsv");
const MAP_PATH = path.join(REPO_DIR, "sales-label-map.json");
const CREATED_BY = "seed:quotations:dev";
const ACTOR = { username: CREATED_BY, role: "SYSTEM", requestId: "seed-quotations-dev" };

const TASK_TYPES = [
  "executor_intake",
  "qa_review",
  "rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];

const SLA_NEW = {
  executor_intake: 2,
  qa_review: 4,
  rnd_review: 5,
  executor_consolidation: 2,
  accounting_review: 3,
  director_review: 2,
};

const WORKFLOW_STATUSES = new Set([
  "draft",
  "cancelled",
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
  "approved",
  "rejected",
]);

const OUTCOMES = new Set(["not_updated", "sent_to_customer", "won", "lost"]);

const SYNC_QUOTATION_CODE_SEQ = `
SELECT CASE
  WHEN max_code IS NULL THEN setval('quotation_code_seq', 1, false)
  ELSE setval('quotation_code_seq', max_code, true)
END
FROM (
  SELECT MAX(CAST(SUBSTRING(code FROM 4) AS integer)) AS max_code
  FROM quotations
  WHERE code ~ '^BG-[0-9]+$'
) AS codes
`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function defaultSales(row) {
  return {
    salesNote: `[${row.scenarioId}] Dev seed scenario`,
    customerRequestNo: `YCBG/26/${row.scenarioId}`,
    boxType: row.boxType,
    lengthMm: row.lengthMm,
    widthMm: row.widthMm,
    heightMm: row.heightMm,
    dimensionType: "inner",
    material: "Carton 3 lớp",
    layerCount: 3,
    fluteType: "BC",
    productLoadKg: 12.5,
    printingDescription: "In offset 4 màu mặt ngoài",
    printColorCount: 4,
    printSideCount: 1,
    quantityPieces: row.quantityPieces,
    deliveryLocation: "Kho khách hàng — TP.HCM",
    desiredDeliveryTime: "15 ngày kể từ PO",
    additionalRequirements: row.notes || null,
  };
}

/** BM02 per-line sample (`BM02-field-map.md` bảng 1 + 2). */
function bm02ForLine(row, sales, lineNumber) {
  const outerPad = 4;
  const inkBands = ["le_30", "le_50", "le_70", "le_100"];
  return {
    fgCode: `FG-${row.scenarioId}-L${lineNumber}`,
    sapCode: `45${String(lineNumber).padStart(2, "0")}${row.scenarioId.replace(/\D/g, "").padStart(6, "0")}`.slice(0, 18),
    innerLengthMm: sales.lengthMm,
    innerWidthMm: sales.widthMm,
    innerHeightMm: sales.heightMm,
    outerLengthMm: sales.lengthMm + outerPad,
    outerWidthMm: sales.widthMm + outerPad,
    outerHeightMm: sales.heightMm + outerPad,
    layerCount: sales.layerCount,
    productWeightG: 12000 + lineNumber * 150,
    printColorCount: sales.printColorCount,
    deliveryLocation: sales.deliveryLocation,
    salesLineNote: `[${row.scenarioId}] Ghi chú BM02 dòng ${lineNumber}`,
    burstWithDriverNote: `Độ bục có driver — seed L${lineNumber}`,
    burstWithoutDriverNote: `Độ bục không driver — seed L${lineNumber}`,
    compressionStrengthNote: `Độ nén min 4000N (Sales pre-fill) L${lineNumber}`,
    paperStructureNote: `Kraft/Test BC — cấu trúc giấy Sales L${lineNumber}`,
    unitsPerBundle: 20 + lineNumber,
    bundlesPerPallet: 36,
    palletStackStrapped: lineNumber !== 2,
    palletStackUnstrapped: lineNumber === 2,
    shrinkWrap: lineNumber !== 3,
    noShrinkWrap: lineNumber === 3,
    inkCoverageBand: inkBands[(lineNumber - 1) % inkBands.length],
  };
}

function loadRows() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  const lines = fs
    .readFileSync(TSV_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("quotations.tsv needs a header row and at least one data row.");

  const header = lines[0].split("\t");
  const expected = [
    "scenario_id",
    "customer_name",
    "sales_label",
    "workflow_status",
    "business_outcome",
    "cycle_type",
    "box_type",
    "length_mm",
    "width_mm",
    "height_mm",
    "quantity_pieces",
    "seed_flags",
    "notes",
  ];
  if (header.join("\t") !== expected.join("\t")) {
    throw new Error(`quotations.tsv header mismatch.\nExpected: ${expected.join("\t")}\nGot: ${header.join("\t")}`);
  }

  const scenarioIds = new Set();
  return lines.slice(1).map((line, offset) => {
    const index = offset + 2;
    const parts = line.split("\t");
    if (parts.length !== expected.length) {
      throw new Error(`Row ${index}: expected ${expected.length} columns, got ${parts.length}.`);
    }
    const [
      scenarioId,
      customerName,
      salesLabel,
      workflowStatus,
      businessOutcomeRaw,
      cycleType,
      boxType,
      lengthMm,
      widthMm,
      heightMm,
      quantityPieces,
      seedFlags,
      notes,
    ] = parts.map((p) => p.trim());

    if (!scenarioIds.has(scenarioId)) scenarioIds.add(scenarioId);
    else throw new Error(`Row ${index}: duplicate scenario_id ${scenarioId}.`);

    if (!WORKFLOW_STATUSES.has(workflowStatus)) {
      throw new Error(`Row ${index}: invalid workflow_status ${JSON.stringify(workflowStatus)}.`);
    }
    if (cycleType !== "new") {
      throw new Error(`Row ${index}: only cycle_type 'new' is supported in seed v1.`);
    }
    let businessOutcome = null;
    if (businessOutcomeRaw && businessOutcomeRaw !== "-") {
      if (!OUTCOMES.has(businessOutcomeRaw)) {
        throw new Error(`Row ${index}: invalid business_outcome ${JSON.stringify(businessOutcomeRaw)}.`);
      }
      businessOutcome = businessOutcomeRaw;
    }
    if (workflowStatus === "approved" && !businessOutcome) {
      throw new Error(`Row ${index}: approved rows need business_outcome (not '-').`);
    }
    if (workflowStatus !== "approved" && businessOutcome) {
      throw new Error(`Row ${index}: business_outcome only allowed when workflow_status is approved.`);
    }
    if (!Object.prototype.hasOwnProperty.call(map, salesLabel)) {
      throw new Error(`Row ${index}: sales_label ${JSON.stringify(salesLabel)} missing from sales-label-map.json.`);
    }
    const salesUsername = String(map[salesLabel]).trim().toLowerCase();
    if (!salesUsername) throw new Error(`Row ${index}: empty sales username for label ${salesLabel}.`);

    const length = Number(lengthMm);
    const width = Number(widthMm);
    const height = Number(heightMm);
    const qty = Number(quantityPieces);
    if (!boxType) throw new Error(`Row ${index}: box_type is required.`);
    if (!Number.isFinite(length) || length <= 0) throw new Error(`Row ${index}: invalid length_mm.`);
    if (!Number.isFinite(width) || width <= 0) throw new Error(`Row ${index}: invalid width_mm.`);
    if (!Number.isFinite(height) || height <= 0) throw new Error(`Row ${index}: invalid height_mm.`);
    if (!Number.isInteger(qty) || qty < 1) throw new Error(`Row ${index}: invalid quantity_pieces.`);

    const flags = seedFlags && seedFlags !== "-" ? seedFlags : "";
    if (workflowStatus === "qa_rnd_review" && flags && !["qa_done", "both_active"].includes(flags)) {
      throw new Error(`Row ${index}: seed_flags must be qa_done, both_active, or '-'.`);
    }

    return {
      index,
      scenarioId,
      customerName,
      salesLabel,
      salesUsername,
      workflowStatus,
      businessOutcome: businessOutcome || "not_updated",
      cycleType,
      boxType,
      lengthMm: length,
      widthMm: width,
      heightMm: height,
      quantityPieces: qty,
      seedFlags: flags,
      notes,
    };
  });
}

async function resolveCustomer(customerName, salesUsername) {
  const result = await query(
    `SELECT c.id, c.customer_type, c.code, c.name, c.tax_id, c.phone, c.email, c.address_line, c.province,
            cc.id AS contact_id, cc.full_name AS contact_full_name, cc.email AS contact_email,
            cc.phone AS contact_phone, cc.job_title AS contact_job_title
     FROM customers c
     JOIN customer_sales_relations r ON r.customer_id = c.id AND r.status = 'active' AND r.sales_username = $2
     JOIN customer_contacts cc ON cc.customer_id = c.id AND cc.is_primary = true AND cc.status = 'active'
     WHERE c.name = $1 AND c.created_by = 'seed:dev'
     LIMIT 1`,
    [customerName, salesUsername]
  );
  if (!result.rows[0]) {
    throw new Error(
      `No seed:dev customer ${JSON.stringify(customerName)} with active sales ${salesUsername}. Run npm run seed:dev first.`
    );
  }
  return result.rows[0];
}

function emptyPayloadStatements(txn, cycleId, quotationId) {
  return [
    txn.query(
      `INSERT INTO quotation_development_minutes (workflow_cycle_id, quotation_id) VALUES ($1, $2)`,
      [cycleId, quotationId]
    ),
    txn.query(
      `INSERT INTO quotation_executor_intake (workflow_cycle_id, quotation_id) VALUES ($1, $2)`,
      [cycleId, quotationId]
    ),
    txn.query(
      `INSERT INTO quotation_executor_consolidation (workflow_cycle_id, quotation_id) VALUES ($1, $2)`,
      [cycleId, quotationId]
    ),
    txn.query(
      `INSERT INTO quotation_accounting_data (workflow_cycle_id, quotation_id) VALUES ($1, $2)`,
      [cycleId, quotationId]
    ),
  ];
}

function salesHeaderInsert(txn, cycleId, quotationId, sales) {
  return txn.query(
    `INSERT INTO quotation_sales_data (
       workflow_cycle_id, quotation_id, customer_request_no, sales_note, delivery_location,
       desired_delivery_time, additional_requirements
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      cycleId,
      quotationId,
      sales.customerRequestNo,
      sales.salesNote,
      sales.deliveryLocation,
      sales.desiredDeliveryTime,
      sales.additionalRequirements,
    ]
  );
}

function lineItemInsert(txn, cycleId, quotationId, row, sales, lineNumber = 1) {
  const b = bm02ForLine(row, sales, lineNumber);
  return txn.query(
    `WITH inserted AS (
       INSERT INTO quotation_line_items (
         workflow_cycle_id, quotation_id, line_number, item_name, flute_type,
         length_mm, width_mm, height_mm, quantity,
         fg_code, sap_code,
         inner_length_mm, inner_width_mm, inner_height_mm,
         outer_length_mm, outer_width_mm, outer_height_mm,
         layer_count, product_weight_g, print_color_count,
         delivery_location, sales_line_note,
         burst_with_driver_note, burst_without_driver_note,
         compression_strength_note, paper_structure_note,
         units_per_bundle, bundles_per_pallet,
         pallet_stack_strapped, pallet_stack_unstrapped, shrink_wrap, no_shrink_wrap,
         ink_coverage_band
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33::ink_coverage_band_enum
       )
       RETURNING id, workflow_cycle_id, quotation_id
     ),
     qa AS (
       INSERT INTO quotation_line_qa (line_item_id, workflow_cycle_id, quotation_id)
       SELECT id, workflow_cycle_id, quotation_id FROM inserted
       RETURNING 1 AS _seed_ok
     ),
     rnd AS (
       INSERT INTO quotation_line_rnd (line_item_id, workflow_cycle_id, quotation_id)
       SELECT id, workflow_cycle_id, quotation_id FROM inserted
       RETURNING 1 AS _seed_ok
     ),
     _plates AS (
       INSERT INTO quotation_line_rnd_print_plates (
         line_item_id, workflow_cycle_id, quotation_id, plate_no
       )
       SELECT i.id, i.workflow_cycle_id, i.quotation_id, gs.n
       FROM inserted i
       CROSS JOIN generate_series(1, 7) AS gs(n)
     ),
     director AS (
       INSERT INTO quotation_line_director (line_item_id, workflow_cycle_id, quotation_id)
       SELECT id, workflow_cycle_id, quotation_id FROM inserted
       RETURNING 1 AS _seed_ok
     )
     SELECT i.id FROM inserted i CROSS JOIN qa CROSS JOIN rnd CROSS JOIN director`,
    [
      cycleId,
      quotationId,
      lineNumber,
      sales.boxType,
      sales.fluteType,
      sales.lengthMm,
      sales.widthMm,
      sales.heightMm,
      sales.quantityPieces,
      b.fgCode,
      b.sapCode,
      b.innerLengthMm,
      b.innerWidthMm,
      b.innerHeightMm,
      b.outerLengthMm,
      b.outerWidthMm,
      b.outerHeightMm,
      b.layerCount,
      b.productWeightG,
      b.printColorCount,
      b.deliveryLocation,
      b.salesLineNote,
      b.burstWithDriverNote,
      b.burstWithoutDriverNote,
      b.compressionStrengthNote,
      b.paperStructureNote,
      b.unitsPerBundle,
      b.bundlesPerPallet,
      b.palletStackStrapped,
      b.palletStackUnstrapped,
      b.shrinkWrap,
      b.noShrinkWrap,
      b.inkCoverageBand,
    ]
  );
}

function submitStatements(txn, ids, customer) {
  const { quotationId, cycleId } = ids;
  const stmts = [
    txn.query(
      `UPDATE workflow_cycles SET submitted_at = now(), submitted_by = $2 WHERE id = $1`,
      [cycleId, CREATED_BY]
    ),
    txn.query(
      `INSERT INTO quotation_customer_snapshots (
         workflow_cycle_id, quotation_id, customer_type, customer_code, customer_name, tax_id,
         phone, email, address_line, province, contact_id, contact_full_name, contact_email,
         contact_phone, contact_job_title
       ) VALUES (
         $1, $2, $3::customer_type_enum, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
       ) ON CONFLICT (workflow_cycle_id) DO NOTHING`,
      [
        cycleId,
        quotationId,
        customer.customer_type,
        customer.code,
        customer.name,
        customer.tax_id,
        customer.phone,
        customer.email,
        customer.address_line,
        customer.province,
        customer.contact_id,
        customer.contact_full_name,
        customer.contact_email,
        customer.contact_phone,
        customer.contact_job_title,
      ]
    ),
  ];
  for (const taskType of TASK_TYPES) {
    stmts.push(
      txn.query(
        `INSERT INTO quotation_tasks (quotation_id, cycle_id, task_type, task_status, sla_duration_hours)
         VALUES ($1, $2, $3::task_type_enum, 'pending', $4)
         ON CONFLICT (cycle_id, task_type) DO NOTHING`,
        [quotationId, cycleId, taskType, SLA_NEW[taskType]]
      )
    );
  }
  stmts.push(
    txn.query(
      `INSERT INTO quotation_revisions (
         quotation_id, cycle_id, revision_number, revision_code, snapshot_jsonb, created_by
       ) VALUES ($1, $2, 1, 'REV-01', '{}'::jsonb, $3)`,
      [quotationId, cycleId, CREATED_BY]
    ),
    txn.query(
      `UPDATE quotations SET workflow_status = 'executor_intake'::workflow_status_enum,
         updated_by = $2, version = version + 1 WHERE id = $1`,
      [quotationId, CREATED_BY]
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
       ) VALUES ($1, $2, 'draft'::workflow_status_enum, 'executor_intake'::workflow_status_enum,
         'submit'::workflow_action_type_enum, $3, 'SYSTEM')`,
      [quotationId, cycleId, CREATED_BY]
    )
  );
  return stmts;
}

function cancelDraftStatements(txn, quotationId, cycleId) {
  return [
    txn.query(
      `UPDATE quotations SET workflow_status = 'cancelled'::workflow_status_enum,
         cancelled_at = now(), cancelled_by = $2, updated_by = $2, version = version + 1
       WHERE id = $1`,
      [quotationId, CREATED_BY]
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
       ) VALUES ($1, $2, 'draft'::workflow_status_enum, 'cancelled'::workflow_status_enum,
         'cancel'::workflow_action_type_enum, $3, 'SYSTEM')`,
      [quotationId, cycleId, CREATED_BY]
    ),
  ];
}

function setTaskStatus(txn, cycleId, taskType, status) {
  return txn.query(
    `UPDATE quotation_tasks SET
       task_status = $3::task_status_enum,
       started_at = CASE WHEN $3::text IN ('in_progress', 'completed') THEN COALESCE(started_at, now()) ELSE started_at END,
       completed_at = CASE WHEN $3::text = 'completed' THEN now() ELSE NULL END,
       sla_started_at = CASE WHEN $3::text IN ('in_progress', 'completed') THEN COALESCE(sla_started_at, now()) ELSE sla_started_at END,
       sla_completed_at = CASE WHEN $3::text = 'completed' THEN now() ELSE NULL END
     WHERE cycle_id = $1 AND task_type = $2::task_type_enum`,
    [cycleId, taskType, status]
  );
}

function setWorkflow(txn, quotationId, cycleId, fromStatus, toStatus) {
  return [
    txn.query(
      `UPDATE quotations SET workflow_status = $2::workflow_status_enum, updated_by = $3, version = version + 1
       WHERE id = $1`,
      [quotationId, toStatus, CREATED_BY]
    ),
    txn.query(
      `INSERT INTO quotation_workflow_events (
         quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
       ) VALUES ($1, $2, $3::workflow_status_enum, $4::workflow_status_enum,
         'task_complete'::workflow_action_type_enum, $5, 'SYSTEM')`,
      [quotationId, cycleId, fromStatus, toStatus, CREATED_BY]
    ),
  ];
}

function samplePaperLayers(suffix) {
  return {
    facePaperType: `Duplex mặt ${suffix}`,
    faceBasisWeight: "250",
    flutePaperType: "Kraft liner",
    fluteBasisWeight: "150",
    middlePaperType: "Medium C",
    middleBasisWeight: "112",
    flute2PaperType: "Kraft liner",
    flute2BasisWeight: "150",
    middle2PaperType: "Medium B",
    middle2BasisWeight: "125",
    flute3PaperType: "Test liner nâu",
    flute3BasisWeight: "140",
    bottomPaperType: "Test liner",
    bottomBasisWeight: "180",
  };
}

function runPaperStructure(variant) {
  const types = [
    `K80-${variant}`,
    `M112-${variant}`,
    `K150-${variant}`,
    `M125-${variant}`,
    `K150-${variant}`,
    `M112-${variant}`,
    `T180-${variant}`,
  ];
  const weights = ["250", "112", "150", "125", "150", "112", "180"];
  return { paperTypes: types, basisWeights: weights };
}

const SEED_QA_LINE_JSON = JSON.stringify([
  {
    lineNumber: 1,
    qualityAssessmentResult: "Đạt (seed full UI)",
    qualityRequirements: "Đáp ứng quy cách dev seed — QaLineDataRow đầy đủ",
    qaNote: "Ghi chú QA mẫu thùng dòng 1",
    burstStandard: "≥ 800 kPa",
    compressionStandard: "≥ 4000 N",
    weightLimitStandard: "≤ 15 kg",
    kcgStandard: "Đạt Tiger spec seed",
    kcgQaSxProposal1: "Đề xuất QA+SX dòng 1 (seed)",
    kcgQaSxProposal2: "Đề xuất QA+SX phương án 2",
    kcgQaSxProposal3: "Đề xuất QA+SX phương án 3",
    edgeCrushStandard: "≥ 6.5 kN/m",
    slipAngleStandard: "≥ 28°",
    waterproofStandard: "Chống ẩm 24h không vỡ",
    ...samplePaperLayers("L1"),
    runQualityAssessmentResult: "Đạt chạy máy (seed)",
    runQaNote: "Chạy thử line 1 — 2 cấu trúc giấy",
    runBurstStandard: "≥ 780 kPa",
    runCompressionStandard: "≥ 3950 N",
    runWeightLimitStandard: "≤ 14.5 kg",
    runKcgStandard: "Đạt spec chạy máy",
    runEdgeCrushStandard: "≥ 6.2 kN/m",
    runSlipAngleStandard: "≥ 27°",
    runWaterproofStandard: "Không thấm 12h",
    runKcgQaSxProposal1: "Run proposal 1 — giảm middle 5%",
    runFacePaperType: "Duplex chạy máy",
    runFaceBasisWeight: "245",
    runFlutePaperType: "Kraft",
    runFluteBasisWeight: "148",
    runMiddlePaperType: "Medium C run",
    runMiddleBasisWeight: "110",
    runFlute2PaperType: "Kraft 2",
    runFlute2BasisWeight: "148",
    runMiddle2PaperType: "Medium B run",
    runMiddle2BasisWeight: "122",
    runFlute3PaperType: "Test liner",
    runFlute3BasisWeight: "138",
    runBottomPaperType: "Test liner đáy",
    runBottomBasisWeight: "175",
    runPaperStructures: [runPaperStructure("A"), runPaperStructure("B")],
  },
  {
    lineNumber: 2,
    qualityAssessmentResult: "Đạt (seed L2)",
    qualityRequirements: "Quy cách dòng 2 seed",
    qaNote: "Ghi chú QA dòng 2",
    burstStandard: "≥ 750 kPa",
    compressionStandard: "≥ 3800 N",
    weightLimitStandard: "≤ 14 kg",
    kcgStandard: "Tiger spec seed L2",
    kcgQaSxProposal1: "Đề xuất QA+SX L2-1",
    kcgQaSxProposal2: null,
    kcgQaSxProposal3: "Đề xuất QA+SX L2-3",
    edgeCrushStandard: "≥ 6.0 kN/m",
    slipAngleStandard: "≥ 26°",
    waterproofStandard: "Chống ẩm cơ bản",
    ...samplePaperLayers("L2"),
    runQualityAssessmentResult: "Đạt chạy máy L2",
    runBurstStandard: "≥ 740 kPa",
    runCompressionStandard: "≥ 3750 N",
    runWeightLimitStandard: "≤ 13.8 kg",
    runKcgStandard: "Spec L2 run",
    runEdgeCrushStandard: "≥ 5.8 kN/m",
    runSlipAngleStandard: "≥ 25°",
    runWaterproofStandard: "Không thấm 8h",
    runKcgQaSxProposal1: "Run L2 — tăng flute",
    runPaperStructures: [runPaperStructure("L2")],
  },
  {
    lineNumber: 3,
    qualityAssessmentResult: "Đạt (seed L3)",
    qualityRequirements: "Quy cách dòng 3 — multi-line full cycle",
    qaNote: "Ghi chú QA dòng 3",
    burstStandard: "≥ 720 kPa",
    compressionStandard: "≥ 3600 N",
    weightLimitStandard: "≤ 13 kg",
    kcgStandard: "Tiger spec seed L3",
    kcgQaSxProposal1: "Đề xuất QA+SX L3-1",
    kcgQaSxProposal2: "Đề xuất QA+SX L3-2",
    kcgQaSxProposal3: null,
    edgeCrushStandard: "≥ 5.5 kN/m",
    slipAngleStandard: "≥ 24°",
    waterproofStandard: "Không yêu cầu đặc biệt",
    ...samplePaperLayers("L3"),
    runQualityAssessmentResult: "Đạt chạy máy L3",
    runBurstStandard: "≥ 710 kPa",
    runCompressionStandard: "≥ 3550 N",
    runWeightLimitStandard: "≤ 12.8 kg",
    runKcgStandard: "Spec L3 run",
    runEdgeCrushStandard: "≥ 5.4 kN/m",
    runSlipAngleStandard: "≥ 23°",
    runWaterproofStandard: "—",
    runKcgQaSxProposal1: "Run L3 — giữ nguyên cấu trúc",
    runPaperStructures: [runPaperStructure("L3")],
  },
]);

const SEED_RND_LINE_JSON = JSON.stringify([
  {
    lineNumber: 1,
    printingPlateCost: 1500000,
    dieCost: 800000,
    productionPlan: "in cuộn > sóng > bế > xếp thành phẩm > đóng pallet",
    rndNote: "R&D line 1 seed — full technical",
    layoutCode: "LYT-BG-001",
    dieCode: "KB-2026-001",
    layoutQuoteCode: "BGIN-7781",
    dieQuoteCode: "BGKB-4420",
    fluteKind: "BC",
    creasing: "Cán lằn 3 đường",
    sheetSize: "1200 x 800 mm",
    fluteOther: "Sóng BC tiêu chuẩn nội bộ",
    printOtherNotes: "In mặt ngoài 4 màu + logo",
    finishGlue: "Dán keo nóng đáy",
    finishStaple: "Không ghim",
    finishDieCut: "Bế tự động Kongsberg",
    filmLamination: "Cán màng matt",
    bundlingMethod: "Bó 25 chiếc / kiện",
    palletNotes: "Pallet gỗ 1.2x1m, stretch film",
  },
  {
    lineNumber: 2,
    printingPlateCost: 1200000,
    dieCost: 650000,
    productionPlan: "in > sóng > bế > dán > đóng kiện",
    rndNote: "R&D line 2 seed",
    layoutCode: "LYT-BG-002",
    dieCode: "KB-2026-002",
    layoutQuoteCode: "BGIN-7782",
    dieQuoteCode: "BGKB-4421",
    fluteKind: "BE",
    creasing: "Cán lằn 2 đường",
    sheetSize: "1150 x 760 mm",
    finishGlue: "Dán keo",
    finishDieCut: "Bế tay phụ",
    filmLamination: "Không cán",
    bundlingMethod: "Bó 20 chiếc",
    palletNotes: "Pallet nhựa tái sử dụng",
  },
  {
    lineNumber: 3,
    printingPlateCost: 980000,
    dieCost: 520000,
    productionPlan: "in > sóng > bế > dán > QC > đóng pallet (line 3)",
    rndNote: "R&D line 3 seed — multi-SKU",
    layoutCode: "LYT-BG-003",
    dieCode: "KB-2026-003",
    fluteKind: "BC",
    sheetSize: "1100 x 720 mm",
    finishStaple: "Ghim đáy 2 điểm",
    bundlingMethod: "Xếp chồng không bó",
  },
]);

const SEED_PRINT_PLATES_JSON = JSON.stringify(
  [1, 2, 3, 4, 5, 6, 7].map((plateNo) => ({
    lineNumber: 1,
    plateNo,
    colorSystem: plateNo <= 4 ? `PMS ${180 + plateNo}C` : "Mực phủ (spot)",
    formulaComposition: `Công thức P${plateNo} — cyan/magenta blend seed`,
    quota: `${1.2 + plateNo * 0.05} g/m²`,
    trame: plateNo % 2 === 0 ? "150 LPI" : "133 LPI",
    anilox: String(800 + plateNo * 100),
  }))
);

function seedDevelopmentMinutesPayload() {
  const printPlates = [1, 2, 3, 4, 5, 6, 7].map((plateNo) => ({
    plateNo,
    colorSystem: `BM3-P${plateNo}`,
    formulaComposition: `BM03 plate ${plateNo}`,
    quota: "1.0 g/m²",
    trame: "133",
    anilox: "900",
  }));
  return {
    participants: [
      { seq: 1, fullName: "Nguyễn R&D Seed", department: "PTDSP" },
      { seq: 2, fullName: "Trần QA Seed", department: "QA" },
      { seq: 3, fullName: "Lê Sales Seed", department: "Sales" },
    ],
    printPlates,
    designNotes: "Layout thùng mẫu seed — đồng bộ FE minutesToApi",
    sampleBoxNotes: "Mẫu thùng #1: BC 1200x800, tải 12.5kg",
    finishDieCut: "Bế tự động",
    finishGlue: "Dán keo nóng đáy",
    finishStaple: "Không ghim",
    uvCoating: "UV partial logo",
    bundlingMethod: "Bó 25 chiếc / kiện",
    palletNotes: "Pallet gỗ 1.2x1m",
    shippingNotes: "Giao tại kho KH TP.HCM",
    otherNotes: "Ghi chú in khác — seed",
    meetingConclusion: "Đồng ý triển khai MVP — đủ field BM03",
    fluteKind: "BC",
    creasing: "Cán lằn 3 đường",
    sheetSize: "1200 x 800 mm",
    fluteOther: "Sóng BC",
    filmLamination: "Cán màng matt",
  };
}

/** Order: 0 QA, 1 minutes, 2 RND, 3 print plates, 4 unit prices, 5 consolidation, 6 accounting */
function fillRoleDataStatements(txn, cycleId, quotationId) {
  return [
    txn.query(
      `UPDATE quotation_line_qa qa SET
         quality_assessment_result = elem->>'qualityAssessmentResult',
         quality_requirements = elem->>'qualityRequirements',
         qa_note = elem->>'qaNote',
         burst_standard = elem->>'burstStandard',
         compression_standard = elem->>'compressionStandard',
         weight_limit_standard = elem->>'weightLimitStandard',
         kcg_standard = elem->>'kcgStandard',
         kcg_qa_sx_proposal_1 = elem->>'kcgQaSxProposal1',
         kcg_qa_sx_proposal_2 = elem->>'kcgQaSxProposal2',
         kcg_qa_sx_proposal_3 = elem->>'kcgQaSxProposal3',
         edge_crush_standard = elem->>'edgeCrushStandard',
         slip_angle_standard = elem->>'slipAngleStandard',
         waterproof_standard = elem->>'waterproofStandard',
         face_paper_type = elem->>'facePaperType',
         face_basis_weight = elem->>'faceBasisWeight',
         flute_paper_type = elem->>'flutePaperType',
         flute_basis_weight = elem->>'fluteBasisWeight',
         middle_paper_type = elem->>'middlePaperType',
         middle_basis_weight = elem->>'middleBasisWeight',
         flute2_paper_type = elem->>'flute2PaperType',
         flute2_basis_weight = elem->>'flute2BasisWeight',
         middle2_paper_type = elem->>'middle2PaperType',
         middle2_basis_weight = elem->>'middle2BasisWeight',
         flute3_paper_type = elem->>'flute3PaperType',
         flute3_basis_weight = elem->>'flute3BasisWeight',
         bottom_paper_type = elem->>'bottomPaperType',
         bottom_basis_weight = elem->>'bottomBasisWeight',
         run_quality_assessment_result = elem->>'runQualityAssessmentResult',
         run_qa_note = elem->>'runQaNote',
         run_burst_standard = elem->>'runBurstStandard',
         run_compression_standard = elem->>'runCompressionStandard',
         run_weight_limit_standard = elem->>'runWeightLimitStandard',
         run_kcg_standard = elem->>'runKcgStandard',
         run_edge_crush_standard = elem->>'runEdgeCrushStandard',
         run_slip_angle_standard = elem->>'runSlipAngleStandard',
         run_waterproof_standard = elem->>'runWaterproofStandard',
         run_kcg_qa_sx_proposal_1 = elem->>'runKcgQaSxProposal1',
         run_face_paper_type = elem->>'runFacePaperType',
         run_face_basis_weight = elem->>'runFaceBasisWeight',
         run_flute_paper_type = elem->>'runFlutePaperType',
         run_flute_basis_weight = elem->>'runFluteBasisWeight',
         run_middle_paper_type = elem->>'runMiddlePaperType',
         run_middle_basis_weight = elem->>'runMiddleBasisWeight',
         run_flute2_paper_type = elem->>'runFlute2PaperType',
         run_flute2_basis_weight = elem->>'runFlute2BasisWeight',
         run_middle2_paper_type = elem->>'runMiddle2PaperType',
         run_middle2_basis_weight = elem->>'runMiddle2BasisWeight',
         run_flute3_paper_type = elem->>'runFlute3PaperType',
         run_flute3_basis_weight = elem->>'runFlute3BasisWeight',
         run_bottom_paper_type = elem->>'runBottomPaperType',
         run_bottom_basis_weight = elem->>'runBottomBasisWeight',
         run_paper_structures = CASE
           WHEN elem->'runPaperStructures' IS NOT NULL AND jsonb_typeof(elem->'runPaperStructures') = 'array'
           THEN elem->'runPaperStructures'
           ELSE NULL
         END
       FROM quotation_line_items li
       JOIN jsonb_array_elements($3::jsonb) elem
         ON (elem->>'lineNumber')::int = li.line_number
       WHERE qa.line_item_id = li.id
         AND li.workflow_cycle_id = $1
         AND li.quotation_id = $2`,
      [cycleId, quotationId, SEED_QA_LINE_JSON]
    ),
    txn.query(
      `UPDATE quotation_development_minutes SET meeting_place = $3, meeting_date = $4::date,
         payload = $5::jsonb
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [
        cycleId,
        quotationId,
        "Phòng họp PTDSP (seed)",
        "2026-01-15",
        JSON.stringify(seedDevelopmentMinutesPayload()),
      ]
    ),
    txn.query(
      `UPDATE quotation_line_rnd rnd SET
         printing_plate_cost = COALESCE((elem->>'printingPlateCost')::numeric, 0),
         die_cost = COALESCE((elem->>'dieCost')::numeric, 0),
         production_plan = elem->>'productionPlan',
         rnd_note = elem->>'rndNote',
         layout_code = elem->>'layoutCode',
         die_code = elem->>'dieCode',
         layout_quote_code = elem->>'layoutQuoteCode',
         die_quote_code = elem->>'dieQuoteCode',
         flute_kind = elem->>'fluteKind',
         creasing = elem->>'creasing',
         sheet_size = elem->>'sheetSize',
         flute_other = elem->>'fluteOther',
         print_other_notes = elem->>'printOtherNotes',
         finish_glue = elem->>'finishGlue',
         finish_staple = elem->>'finishStaple',
         finish_die_cut = elem->>'finishDieCut',
         film_lamination = elem->>'filmLamination',
         bundling_method = elem->>'bundlingMethod',
         pallet_notes = elem->>'palletNotes'
       FROM quotation_line_items li
       JOIN jsonb_array_elements($3::jsonb) elem
         ON (elem->>'lineNumber')::int = li.line_number
       WHERE rnd.line_item_id = li.id
         AND li.workflow_cycle_id = $1
         AND li.quotation_id = $2`,
      [cycleId, quotationId, SEED_RND_LINE_JSON]
    ),
    txn.query(
      `UPDATE quotation_line_rnd_print_plates AS p
       SET
         color_system = mapped.color_system,
         formula_composition = mapped.formula_composition,
         quota = mapped.quota,
         trame = mapped.trame,
         anilox = mapped.anilox
       FROM (
         SELECT
           p2.id AS plate_id,
           seed.elem->>'colorSystem' AS color_system,
           seed.elem->>'formulaComposition' AS formula_composition,
           seed.elem->>'quota' AS quota,
           seed.elem->>'trame' AS trame,
           seed.elem->>'anilox' AS anilox
         FROM quotation_line_rnd_print_plates p2
         INNER JOIN quotation_line_items li ON li.id = p2.line_item_id
         CROSS JOIN jsonb_array_elements($3::jsonb) AS seed(elem)
         WHERE li.workflow_cycle_id = $1
           AND li.quotation_id = $2
           AND (seed.elem->>'lineNumber')::int = li.line_number
           AND (seed.elem->>'plateNo')::int = p2.plate_no
       ) AS mapped
       WHERE p.id = mapped.plate_id`,
      [cycleId, quotationId, SEED_PRINT_PLATES_JSON]
    ),
    txn.query(
      `UPDATE quotation_line_items SET unit_price = CASE line_number
         WHEN 1 THEN 5200
         WHEN 2 THEN 5100
         WHEN 3 THEN 5000
         ELSE unit_price
       END
       WHERE workflow_cycle_id = $1 AND quotation_id = $2 AND line_number IN (1, 2, 3)`,
      [cycleId, quotationId]
    ),
    txn.query(
      `UPDATE quotation_executor_consolidation SET
         delivery_terms = 'Giao tại kho KH',
         consolidation_note = 'Seed dev — tổng hợp Executor hoàn tất'
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [cycleId, quotationId]
    ),
    txn.query(
      `UPDATE quotation_accounting_data SET payment_terms = 'Net 30', vat_rate = 10,
         final_quotation_value = 98500000, financial_adjustment = 'Điều chỉnh demo 0',
         accounting_note = 'Seed kế toán — đã duyệt giá trị BG'
       WHERE workflow_cycle_id = $1 AND quotation_id = $2`,
      [cycleId, quotationId]
    ),
  ];
}

function advanceToTarget(txn, ids, row) {
  const { quotationId, cycleId } = ids;
  const target = row.workflowStatus;
  const stmts = [];

  if (target === "draft" || target === "executor_intake") return stmts;

  stmts.push(setTaskStatus(txn, cycleId, "executor_intake", "completed"));
  stmts.push(...setWorkflow(txn, quotationId, cycleId, "executor_intake", "qa_rnd_review"));

  if (target === "qa_rnd_review") {
    if (row.seedFlags === "both_active") {
      stmts.push(setTaskStatus(txn, cycleId, "qa_review", "in_progress"));
      stmts.push(setTaskStatus(txn, cycleId, "rnd_review", "in_progress"));
    } else if (row.seedFlags === "qa_done") {
      stmts.push(...fillRoleDataStatements(txn, cycleId, quotationId).slice(0, 1));
      stmts.push(setTaskStatus(txn, cycleId, "qa_review", "completed"));
      stmts.push(setTaskStatus(txn, cycleId, "rnd_review", "pending"));
    }
    return stmts;
  }

  stmts.push(...fillRoleDataStatements(txn, cycleId, quotationId).slice(0, 2));
  stmts.push(setTaskStatus(txn, cycleId, "qa_review", "completed"));
  stmts.push(setTaskStatus(txn, cycleId, "rnd_review", "completed"));
  stmts.push(...setWorkflow(txn, quotationId, cycleId, "qa_rnd_review", "executor_consolidation"));

  if (target === "executor_consolidation") {
    stmts.push(setTaskStatus(txn, cycleId, "executor_consolidation", "in_progress"));
    return stmts;
  }

  stmts.push(...fillRoleDataStatements(txn, cycleId, quotationId).slice(2, 4));

  if (target === "executor_consolidation") {
    stmts.push(setTaskStatus(txn, cycleId, "executor_consolidation", "in_progress"));
    return stmts;
  }

  stmts.push(...fillRoleDataStatements(txn, cycleId, quotationId).slice(4, 6));
  stmts.push(setTaskStatus(txn, cycleId, "executor_consolidation", "completed"));
  stmts.push(...setWorkflow(txn, quotationId, cycleId, "executor_consolidation", "accounting_review"));

  if (target === "accounting_review") {
    stmts.push(setTaskStatus(txn, cycleId, "accounting_review", "in_progress"));
    return stmts;
  }

  stmts.push(...fillRoleDataStatements(txn, cycleId, quotationId).slice(6, 7));
  stmts.push(setTaskStatus(txn, cycleId, "accounting_review", "completed"));
  stmts.push(...setWorkflow(txn, quotationId, cycleId, "accounting_review", "director_review"));

  if (target === "director_review") {
    stmts.push(setTaskStatus(txn, cycleId, "director_review", "pending"));
    return stmts;
  }

  if (target === "approved") {
    stmts.push(
      txn.query(
        `UPDATE quotation_line_director ldir SET director_decision = 'approved'::director_decision_enum,
           approval_note = 'Phê duyệt seed dev', rejection_reason = NULL, decision_at = now()
         FROM quotation_line_items li
         WHERE ldir.line_item_id = li.id AND li.workflow_cycle_id = $1 AND li.quotation_id = $2`,
        [cycleId, quotationId]
      )
    );
    stmts.push(setTaskStatus(txn, cycleId, "director_review", "completed"));
    stmts.push(
      txn.query(
        `UPDATE quotations SET workflow_status = 'approved'::workflow_status_enum,
           business_outcome = $2::business_outcome_enum, updated_by = $3, version = version + 1
         WHERE id = $1`,
        [quotationId, row.businessOutcome, CREATED_BY]
      ),
      txn.query(
        `INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role
         ) VALUES ($1, $2, 'director_review'::workflow_status_enum, 'approved'::workflow_status_enum,
           'approve'::workflow_action_type_enum, $3, 'SYSTEM')`,
        [quotationId, cycleId, CREATED_BY]
      )
    );
    return stmts;
  }

  if (target === "rejected") {
    stmts.push(
      txn.query(
        `UPDATE quotation_line_director ldir SET director_decision = 'rejected'::director_decision_enum,
           rejection_reason = $3, approval_note = NULL, decision_at = now()
         FROM quotation_line_items li
         WHERE ldir.line_item_id = li.id AND li.workflow_cycle_id = $1 AND li.quotation_id = $2`,
        [cycleId, quotationId, "Từ chối seed dev — giá/vật tư chưa phù hợp"]
      )
    );
    stmts.push(setTaskStatus(txn, cycleId, "director_review", "completed"));
    stmts.push(
      txn.query(
        `UPDATE quotations SET workflow_status = 'rejected'::workflow_status_enum,
           updated_by = $2, version = version + 1
         WHERE id = $1`,
        [quotationId, CREATED_BY]
      ),
      txn.query(
        `INSERT INTO quotation_workflow_events (
           quotation_id, cycle_id, from_status, to_status, action_type, actor_username, actor_role, action_note
         ) VALUES ($1, $2, 'director_review'::workflow_status_enum, 'rejected'::workflow_status_enum,
           'reject'::workflow_action_type_enum, $3, 'SYSTEM', $4)`,
        [quotationId, cycleId, CREATED_BY, "Từ chối seed dev — giá/vật tư chưa phù hợp"]
      )
    );
  }

  return stmts;
}

async function seedRow(row, customer) {
  const sales = defaultSales(row);

  const insertHeader = await runWithRequestContext(ACTOR, (txn) => [
    txn.query(
      `INSERT INTO quotations (
         sales_owner_username, customer_id, contact_id, created_by, updated_by
       ) VALUES ($1, $2, $3, $4, $4)
       RETURNING id`,
      [row.salesUsername, customer.id, customer.contact_id, CREATED_BY]
    ),
  ]);
  const quotationId = insertHeader[0].rows[0].id;

  const insertCycle = await runWithRequestContext(ACTOR, (txn) => [
    txn.query(
      `INSERT INTO workflow_cycles (quotation_id, cycle_number, cycle_type)
       VALUES ($1, 1, 'new'::cycle_type_enum)
       RETURNING id`,
      [quotationId]
    ),
  ]);
  const cycleId = insertCycle[0].rows[0].id;

  await runWithRequestContext(ACTOR, (txn) => [
    txn.query(`UPDATE quotations SET current_cycle_id = $1 WHERE id = $2`, [cycleId, quotationId]),
  ]);

  await runWithRequestContext(ACTOR, (txn) => [
    salesHeaderInsert(txn, cycleId, quotationId, sales),
    lineItemInsert(txn, cycleId, quotationId, row, sales, 1),
    lineItemInsert(
      txn,
      cycleId,
      quotationId,
      row,
      { ...sales, boxType: `${sales.boxType} (L2)`, quantityPieces: sales.quantityPieces + 1 },
      2
    ),
    lineItemInsert(
      txn,
      cycleId,
      quotationId,
      row,
      { ...sales, boxType: `${sales.boxType} (L3)`, quantityPieces: sales.quantityPieces + 2 },
      3
    ),
    ...emptyPayloadStatements(txn, cycleId, quotationId),
  ]);

  if (row.workflowStatus === "cancelled") {
    await runWithRequestContext(ACTOR, (txn) => cancelDraftStatements(txn, quotationId, cycleId));
    return;
  }

  if (row.workflowStatus !== "draft") {
    await runWithRequestContext(ACTOR, (txn) => submitStatements(txn, { quotationId, cycleId }, customer));
    await runWithRequestContext(ACTOR, (txn) => advanceToTarget(txn, { quotationId, cycleId }, row));
  }
}

async function seedAll(rows) {
  const existing = await query(`SELECT count(*)::int AS n FROM quotations WHERE created_by = $1`, [CREATED_BY]);
  if (Number(existing.rows[0].n) > 0) {
    throw new Error("Quotation dev seed already exists. Run npm run seed:quotations:dev:down first.");
  }

  for (const row of rows) {
    const customer = await resolveCustomer(row.customerName, row.salesUsername);
    await seedRow(row, customer);
    console.log(`Seeded ${row.scenarioId} → target ${row.workflowStatus}`);
  }

  await runWithRequestContext(ACTOR, (txn) => [txn.query(SYNC_QUOTATION_CODE_SEQ)]);
  console.log(`Seeded ${rows.length} dev quotations (${CREATED_BY}).`);
}

async function removeSeed() {
  const ids = await query(`SELECT id FROM quotations WHERE created_by = $1`, [CREATED_BY]);
  if (ids.rows.length === 0) {
    console.log("No quotation dev seed rows to remove.");
    return;
  }

  await runWithRequestContext(ACTOR, (txn) => [
    txn.query(
      `ALTER TABLE public.quotation_workflow_events DISABLE TRIGGER quotation_workflow_events_reject_mutation`
    ),
    txn.query(
      `ALTER TABLE public.quotation_revisions DISABLE TRIGGER quotation_revisions_reject_mutation`
    ),
    txn.query(`DELETE FROM quotation_workflow_events WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(`DELETE FROM quotation_revisions WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(`DELETE FROM quotation_attachments WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(`DELETE FROM quotation_tasks WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(
      `DELETE FROM quotation_customer_snapshots WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(`DELETE FROM quotation_line_qa WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(
      `DELETE FROM quotation_line_rnd_print_plates WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(`DELETE FROM quotation_line_rnd WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(
      `DELETE FROM quotation_line_director WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(`DELETE FROM quotation_line_items WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(`DELETE FROM quotation_sales_data WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(
      `DELETE FROM quotation_development_minutes WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(
      `DELETE FROM quotation_executor_intake WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(
      `DELETE FROM quotation_executor_consolidation WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(
      `DELETE FROM quotation_accounting_data WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`,
      [CREATED_BY]
    ),
    txn.query(`UPDATE quotations SET current_cycle_id = NULL WHERE created_by = $1`, [CREATED_BY]),
    txn.query(`DELETE FROM workflow_cycles WHERE quotation_id IN (SELECT id FROM quotations WHERE created_by = $1)`, [
      CREATED_BY,
    ]),
    txn.query(`DELETE FROM quotations WHERE created_by = $1`, [CREATED_BY]),
    txn.query(
      `ALTER TABLE public.quotation_workflow_events ENABLE TRIGGER quotation_workflow_events_reject_mutation`
    ),
    txn.query(
      `ALTER TABLE public.quotation_revisions ENABLE TRIGGER quotation_revisions_reject_mutation`
    ),
    txn.query(SYNC_QUOTATION_CODE_SEQ),
  ]);
  console.log(`Removed quotation dev seed (${CREATED_BY}).`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    fail("seed:quotations:dev must not run when NODE_ENV=production.");
  }
  const checkOnly = process.argv.includes("--check");
  const down = process.argv.includes("--down");
  try {
    const rows = down ? null : loadRows();
    if (checkOnly) {
      console.log(`Validated ${rows.length} quotations from quotations.tsv.`);
      return;
    }
    if (!process.env.DATABASE_URL?.trim()) {
      fail("DATABASE_URL is not configured. Run migrate + seed:dev, then seed:quotations:dev.");
    }
    if (down) await removeSeed();
    else await seedAll(rows);
  } catch (error) {
    const message = error?.message ? error.message : String(error);
    fail(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadRows };
