const { query } = require("inla-s-db");
const { fail } = require("../lib/http");
const { mapQaLineRow, mapRndLineRow } = require("./mappers");
const { QA_LINE_SQL_SELECT, QA_LINE_COLUMN_MAP } = require("./qaLineColumns");

function nonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function fetchLineNumbersOrdered(cycleId) {
  const result = await query(
    `SELECT line_number FROM quotation_line_items WHERE workflow_cycle_id = $1 ORDER BY line_number`,
    [cycleId]
  );
  return result.rows.map((r) => r.line_number);
}

async function fetchQaLinesForCycle(cycleId) {
  const result = await query(
    `SELECT li.line_number,
       ${QA_LINE_SQL_SELECT}
     FROM quotation_line_qa qa
     JOIN quotation_line_items li ON li.id = qa.line_item_id
     WHERE qa.workflow_cycle_id = $1
     ORDER BY li.line_number`,
    [cycleId]
  );
  return result.rows.map(mapQaLineRow);
}

async function fetchRndLinesForCycle(cycleId) {
  const result = await query(
    `SELECT li.line_number,
       rnd.printing_plate_cost, rnd.die_cost,
       rnd.layout_code, rnd.die_code, rnd.layout_quote_code, rnd.die_quote_code,
       rnd.production_plan, rnd.rnd_note
     FROM quotation_line_rnd rnd
     JOIN quotation_line_items li ON li.id = rnd.line_item_id
     WHERE rnd.workflow_cycle_id = $1
     ORDER BY li.line_number`,
    [cycleId]
  );
  return result.rows.map(mapRndLineRow);
}

function optionalQaText(item, key) {
  if (item[key] === undefined) return undefined;
  if (item[key] === null) return null;
  const text = String(item[key]).trim();
  return text || null;
}

function parseRunPaperStructures(value, index) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) throw new Error(`INVALID:qaLineData[${index}].runPaperStructures`);
  return value.map((entry, si) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`INVALID:qaLineData[${index}].runPaperStructures[${si}]`);
    }
    const paperTypes = Array.isArray(entry.paperTypes)
      ? entry.paperTypes.map((v) => String(v ?? "").trim())
      : [];
    const basisWeights = Array.isArray(entry.basisWeights)
      ? entry.basisWeights.map((v) => String(v ?? "").trim())
      : [];
    return { paperTypes, basisWeights };
  });
}

const QA_TEXT_API_KEYS = QA_LINE_COLUMN_MAP.filter(([k]) => k !== "runPaperStructures").map(([k]) => k);

function parseQaLineItemRaw(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`INVALID:qaLineData[${index}]`);
  }
  const lineNumber = Number(item.lineNumber);
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    throw new Error(`INVALID:qaLineData[${index}].lineNumber`);
  }
  const row = { lineNumber, runPaperStructures: parseRunPaperStructures(item.runPaperStructures, index) };
  for (const key of QA_TEXT_API_KEYS) {
    const val = optionalQaText(item, key);
    row[key] = val === undefined ? null : val;
  }
  return row;
}

function runPaperStructureFilled(line) {
  const structures = line.runPaperStructures;
  if (!Array.isArray(structures)) return false;
  return structures.some((set) => {
    if (!set || typeof set !== "object") return false;
    const types = Array.isArray(set.paperTypes) ? set.paperTypes : [];
    const weights = Array.isArray(set.basisWeights) ? set.basisWeights : [];
    return [...types, ...weights].some((v) => nonEmptyText(v));
  });
}

function validateQaLineShape(line, { forComplete = false } = {}) {
  if (forComplete) {
    const n = line.lineNumber;
    if (!nonEmptyText(line.qualityAssessmentResult)) {
      return fail(400, "VALIDATION_ERROR", `Dòng ${n} — Kết quả đánh giá chất lượng.`);
    }
    if (!nonEmptyText(line.runBurstStandard)) {
      return fail(400, "VALIDATION_ERROR", `Dòng ${n} — Nhập Bục`);
    }
    if (!nonEmptyText(line.runCompressionStandard)) {
      return fail(400, "VALIDATION_ERROR", `Dòng ${n} — Nhập Nén`);
    }
    if (!runPaperStructureFilled(line)) {
      return fail(400, "VALIDATION_ERROR", `Dòng ${n} — Nhập ít nhất 1 kết cấu giấy`);
    }
  }
  return null;
}

function assertQaLineDataForPut(qaLineData, lineNumbers) {
  if (!Array.isArray(qaLineData)) {
    return fail(400, "VALIDATION_ERROR", "qaLineData must be an array.");
  }
  if (lineNumbers.length === 0) {
    if (qaLineData.length !== 0) {
      return fail(400, "VALIDATION_ERROR", "qaLineData must be empty when the cycle has no line items.");
    }
    return { normalized: [] };
  }
  if (qaLineData.length !== lineNumbers.length) {
    return fail(
      400,
      "VALIDATION_ERROR",
      "qaLineData length must match quotation line items for this cycle."
    );
  }
  const need = new Set(lineNumbers);
  const parsed = [];
  const seen = new Set();
  try {
    for (let i = 0; i < qaLineData.length; i++) {
      const raw = parseQaLineItemRaw(qaLineData[i], i);
      if (!need.has(raw.lineNumber)) {
        return fail(400, "VALIDATION_ERROR", `qaLineData references unknown lineNumber ${raw.lineNumber}.`);
      }
      if (seen.has(raw.lineNumber)) {
        return fail(400, "VALIDATION_ERROR", `Duplicate lineNumber ${raw.lineNumber} in qaLineData.`);
      }
      seen.add(raw.lineNumber);
      parsed.push(raw);
    }
  } catch (e) {
    if (e.message.startsWith("INVALID:")) {
      return fail(400, "VALIDATION_ERROR", `Invalid ${e.message.slice(8).replace(/:/g, ".")}.`);
    }
    throw e;
  }
  for (const n of need) {
    if (!seen.has(n)) {
      return fail(400, "VALIDATION_ERROR", `qaLineData is missing lineNumber ${n}.`);
    }
  }
  parsed.sort((a, b) => a.lineNumber - b.lineNumber);
  return { normalized: parsed };
}

function parseRndLineItemRaw(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`INVALID:rndLineData[${index}]`);
  }
  const lineNumber = Number(item.lineNumber);
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    throw new Error(`INVALID:rndLineData[${index}].lineNumber`);
  }
  let printingPlateCost = item.printingPlateCost;
  let dieCost = item.dieCost;
  if (printingPlateCost !== undefined && printingPlateCost !== null) {
    printingPlateCost = Number(printingPlateCost);
    if (!Number.isFinite(printingPlateCost) || printingPlateCost < 0) {
      throw new Error(`INVALID:rndLineData[${index}].printingPlateCost`);
    }
  } else {
    printingPlateCost = undefined;
  }
  if (dieCost !== undefined && dieCost !== null) {
    dieCost = Number(dieCost);
    if (!Number.isFinite(dieCost) || dieCost < 0) {
      throw new Error(`INVALID:rndLineData[${index}].dieCost`);
    }
  } else {
    dieCost = undefined;
  }
  const layoutCode =
    item.layoutCode === undefined || item.layoutCode === null
      ? undefined
      : String(item.layoutCode).trim() || null;
  const layoutQuoteCode =
    item.layoutQuoteCode === undefined || item.layoutQuoteCode === null
      ? undefined
      : String(item.layoutQuoteCode).trim() || null;
  const dieCode =
    item.dieCode === undefined || item.dieCode === null ? undefined : String(item.dieCode).trim() || null;
  const dieQuoteCode =
    item.dieQuoteCode === undefined || item.dieQuoteCode === null
      ? undefined
      : String(item.dieQuoteCode).trim() || null;
  return {
    lineNumber,
    printingPlateCost,
    dieCost,
    layoutCode,
    layoutQuoteCode,
    dieCode,
    dieQuoteCode,
    productionPlan:
      item.productionPlan === undefined || item.productionPlan === null
        ? null
        : String(item.productionPlan).trim() || null,
    rndNote:
      item.rndNote === undefined || item.rndNote === null
        ? null
        : String(item.rndNote).trim() || null,
  };
}

function validateRndLineShape(line, { forComplete = false } = {}) {
  if (forComplete) {
    if (line.printingPlateCost == null || Number(line.printingPlateCost) < 0) {
      return fail(400, "VALIDATION_ERROR", `printingPlateCost is required for line ${line.lineNumber}.`);
    }
    if (line.dieCost == null || Number(line.dieCost) < 0) {
      return fail(400, "VALIDATION_ERROR", `dieCost is required for line ${line.lineNumber}.`);
    }
    if (!nonEmptyText(line.productionPlan)) {
      return fail(400, "VALIDATION_ERROR", `productionPlan is required for line ${line.lineNumber}.`);
    }
  }
  return null;
}

function assertRndLineDataForPut(rndLineData, lineNumbers) {
  if (!Array.isArray(rndLineData)) {
    return fail(400, "VALIDATION_ERROR", "rndLineData must be an array.");
  }
  if (lineNumbers.length === 0) {
    if (rndLineData.length !== 0) {
      return fail(400, "VALIDATION_ERROR", "rndLineData must be empty when the cycle has no line items.");
    }
    return { normalized: [] };
  }
  if (rndLineData.length !== lineNumbers.length) {
    return fail(
      400,
      "VALIDATION_ERROR",
      "rndLineData length must match quotation line items for this cycle."
    );
  }
  const need = new Set(lineNumbers);
  const parsed = [];
  const seen = new Set();
  try {
    for (let i = 0; i < rndLineData.length; i++) {
      const raw = parseRndLineItemRaw(rndLineData[i], i);
      if (!need.has(raw.lineNumber)) {
        return fail(400, "VALIDATION_ERROR", `rndLineData references unknown lineNumber ${raw.lineNumber}.`);
      }
      if (seen.has(raw.lineNumber)) {
        return fail(400, "VALIDATION_ERROR", `Duplicate lineNumber ${raw.lineNumber} in rndLineData.`);
      }
      seen.add(raw.lineNumber);
      parsed.push(raw);
    }
  } catch (e) {
    if (e.message.startsWith("INVALID:")) {
      return fail(400, "VALIDATION_ERROR", `Invalid ${e.message.slice(8).replace(/:/g, ".")}.`);
    }
    throw e;
  }
  for (const n of need) {
    if (!seen.has(n)) {
      return fail(400, "VALIDATION_ERROR", `rndLineData is missing lineNumber ${n}.`);
    }
  }
  parsed.sort((a, b) => a.lineNumber - b.lineNumber);
  return { normalized: parsed };
}

async function validateQaCompleteForCycle(cycleId) {
  const lineNumbers = await fetchLineNumbersOrdered(cycleId);
  const lines = await fetchQaLinesForCycle(cycleId);
  if (lineNumbers.length === 0) return null;
  if (lines.length !== lineNumbers.length) {
    return fail(400, "VALIDATION_ERROR", "QA line data must cover every line item before complete.");
  }
  const byLine = new Map(lines.map((l) => [l.lineNumber, l]));
  for (const n of lineNumbers) {
    const line = byLine.get(n);
    if (!line) {
      return fail(400, "VALIDATION_ERROR", `QA data missing for line ${n}.`);
    }
    const err = validateQaLineShape(line, { forComplete: true });
    if (err) return err;
  }
  return null;
}

async function validateRndCompleteForCycle(cycleId) {
  const lineNumbers = await fetchLineNumbersOrdered(cycleId);
  const lines = await fetchRndLinesForCycle(cycleId);
  if (lineNumbers.length === 0) return null;
  if (lines.length !== lineNumbers.length) {
    return fail(400, "VALIDATION_ERROR", "R&D line data must cover every line item before complete.");
  }
  const byLine = new Map(lines.map((l) => [l.lineNumber, l]));
  for (const n of lineNumbers) {
    const line = byLine.get(n);
    if (!line) {
      return fail(400, "VALIDATION_ERROR", `R&D data missing for line ${n}.`);
    }
    const err = validateRndLineShape(line, { forComplete: true });
    if (err) return err;
  }
  return null;
}

module.exports = {
  fetchLineNumbersOrdered,
  fetchQaLinesForCycle,
  fetchRndLinesForCycle,
  assertQaLineDataForPut,
  assertRndLineDataForPut,
  validateQaCompleteForCycle,
  validateRndCompleteForCycle,
};
