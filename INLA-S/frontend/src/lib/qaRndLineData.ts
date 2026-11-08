import type { QaData, QaRunPaperStructure, QuotationDetailResponse, RndData, QaLineDataRow, RndLineDataRow } from "../api/quotations";
import { resolvedLineItems } from "./lineItems";

export type QaLinePayload = {
  lineNumber: number;
  qualityAssessmentResult: string;
  qaNote: string;
  burstStandard: string;
  compressionStandard: string;
  weightLimitStandard: string;
  kcgStandard: string;
  kcgQaSxProposal1: string;
  kcgQaSxProposal2: string;
  kcgQaSxProposal3: string;
  edgeCrushStandard: string;
  slipAngleStandard: string;
  waterproofStandard: string;
  facePaperType: string;
  faceBasisWeight: string;
  flutePaperType: string;
  fluteBasisWeight: string;
  middlePaperType: string;
  middleBasisWeight: string;
  flute2PaperType: string;
  flute2BasisWeight: string;
  middle2PaperType: string;
  middle2BasisWeight: string;
  flute3PaperType: string;
  flute3BasisWeight: string;
  bottomPaperType: string;
  bottomBasisWeight: string;
  runQualityAssessmentResult: string;
  runQaNote: string;
  runBurstStandard: string;
  runCompressionStandard: string;
  runWeightLimitStandard: string;
  runKcgStandard: string;
  runEdgeCrushStandard: string;
  runSlipAngleStandard: string;
  runWaterproofStandard: string;
  runKcgQaSxProposal1: string;
  runFacePaperType: string;
  runFaceBasisWeight: string;
  runFlutePaperType: string;
  runFluteBasisWeight: string;
  runMiddlePaperType: string;
  runMiddleBasisWeight: string;
  runFlute2PaperType: string;
  runFlute2BasisWeight: string;
  runMiddle2PaperType: string;
  runMiddle2BasisWeight: string;
  runFlute3PaperType: string;
  runFlute3BasisWeight: string;
  runBottomPaperType: string;
  runBottomBasisWeight: string;
  runPaperStructures: QaRunPaperStructure[];
};

const PAPER_LAYER_COUNT = 7;

export function emptyRunPaperStructure(): QaRunPaperStructure {
  return {
    paperTypes: Array.from({ length: PAPER_LAYER_COUNT }, () => ""),
    basisWeights: Array.from({ length: PAPER_LAYER_COUNT }, () => ""),
  };
}

function sevenLayers(values: Array<string | null | undefined> | undefined): string[] {
  return Array.from({ length: PAPER_LAYER_COUNT }, (_, index) => values?.[index] ?? "");
}

function normalizeRunPaperStructure(raw: QaRunPaperStructure | null | undefined): QaRunPaperStructure {
  return {
    paperTypes: sevenLayers(raw?.paperTypes),
    basisWeights: sevenLayers(raw?.basisWeights),
  };
}

function structureFromFlatRun(row: Pick<QaLinePayload, "runFacePaperType" | "runFlutePaperType" | "runMiddlePaperType" | "runFlute2PaperType" | "runMiddle2PaperType" | "runFlute3PaperType" | "runBottomPaperType" | "runFaceBasisWeight" | "runFluteBasisWeight" | "runMiddleBasisWeight" | "runFlute2BasisWeight" | "runMiddle2BasisWeight" | "runFlute3BasisWeight" | "runBottomBasisWeight">): QaRunPaperStructure {
  return {
    paperTypes: [row.runFacePaperType, row.runFlutePaperType, row.runMiddlePaperType, row.runFlute2PaperType, row.runMiddle2PaperType, row.runFlute3PaperType, row.runBottomPaperType],
    basisWeights: [row.runFaceBasisWeight, row.runFluteBasisWeight, row.runMiddleBasisWeight, row.runFlute2BasisWeight, row.runMiddle2BasisWeight, row.runFlute3BasisWeight, row.runBottomBasisWeight],
  };
}

function resolveRunPaperStructures(row: QaLinePayload): QaRunPaperStructure[] {
  if (row.runPaperStructures.length > 0) return row.runPaperStructures.map((item) => normalizeRunPaperStructure(item));
  const flat = structureFromFlatRun(row);
  const hasFlat = [...flat.paperTypes, ...flat.basisWeights].some((value) => value.trim());
  return hasFlat ? [flat] : [emptyRunPaperStructure()];
}

export type RndLinePayload = {
  lineNumber: number;
  printingPlateCost: string;
  dieCost: string;
  layoutCode: string;
  layoutQuoteCode: string;
  dieCode: string;
  dieQuoteCode: string;
  productionPlan: string;
  rndNote: string;
};

export function emptyQaLinePayload(lineNumber: number): QaLinePayload {
  return {
    lineNumber,
    qualityAssessmentResult: "",
    qaNote: "",
    burstStandard: "",
    compressionStandard: "",
    weightLimitStandard: "",
    kcgStandard: "",
    kcgQaSxProposal1: "",
    kcgQaSxProposal2: "",
    kcgQaSxProposal3: "",
    edgeCrushStandard: "",
    slipAngleStandard: "",
    waterproofStandard: "",
    facePaperType: "",
    faceBasisWeight: "",
    flutePaperType: "",
    fluteBasisWeight: "",
    middlePaperType: "",
    middleBasisWeight: "",
    flute2PaperType: "",
    flute2BasisWeight: "",
    middle2PaperType: "",
    middle2BasisWeight: "",
    flute3PaperType: "",
    flute3BasisWeight: "",
    bottomPaperType: "",
    bottomBasisWeight: "",
    runQualityAssessmentResult: "",
    runQaNote: "",
    runBurstStandard: "",
    runCompressionStandard: "",
    runWeightLimitStandard: "",
    runKcgStandard: "",
    runEdgeCrushStandard: "",
    runSlipAngleStandard: "",
    runWaterproofStandard: "",
    runKcgQaSxProposal1: "",
    runFacePaperType: "",
    runFaceBasisWeight: "",
    runFlutePaperType: "",
    runFluteBasisWeight: "",
    runMiddlePaperType: "",
    runMiddleBasisWeight: "",
    runFlute2PaperType: "",
    runFlute2BasisWeight: "",
    runMiddle2PaperType: "",
    runMiddle2BasisWeight: "",
    runFlute3PaperType: "",
    runFlute3BasisWeight: "",
    runBottomPaperType: "",
    runBottomBasisWeight: "",
    runPaperStructures: [],
  };
}

export function emptyRndLinePayload(lineNumber: number): RndLinePayload {
  return {
    lineNumber,
    printingPlateCost: "",
    dieCost: "",
    layoutCode: "",
    layoutQuoteCode: "",
    dieCode: "",
    dieQuoteCode: "",
    productionPlan: "",
    rndNote: "",
  };
}

function legacyQaFields(qa: QaData | null | undefined): Omit<QaLinePayload, "lineNumber"> {
  return {
    qualityAssessmentResult: qa?.qualityAssessmentResult ?? "",
    qaNote: qa?.qaNote ?? "",
    burstStandard: qa?.burstStandard ?? "",
    compressionStandard: qa?.compressionStandard ?? "",
    weightLimitStandard: qa?.weightLimitStandard ?? "",
    kcgStandard: qa?.kcgStandard ?? "",
    kcgQaSxProposal1: qa?.kcgQaSxProposal1 ?? "",
    kcgQaSxProposal2: qa?.kcgQaSxProposal2 ?? "",
    kcgQaSxProposal3: qa?.kcgQaSxProposal3 ?? "",
    edgeCrushStandard: qa?.edgeCrushStandard ?? "",
    slipAngleStandard: qa?.slipAngleStandard ?? "",
    waterproofStandard: qa?.waterproofStandard ?? "",
    facePaperType: qa?.facePaperType ?? "",
    faceBasisWeight: qa?.faceBasisWeight ?? "",
    flutePaperType: qa?.flutePaperType ?? "",
    fluteBasisWeight: qa?.fluteBasisWeight ?? "",
    middlePaperType: qa?.middlePaperType ?? "",
    middleBasisWeight: qa?.middleBasisWeight ?? "",
    flute2PaperType: qa?.flute2PaperType ?? "",
    flute2BasisWeight: qa?.flute2BasisWeight ?? "",
    middle2PaperType: qa?.middle2PaperType ?? "",
    middle2BasisWeight: qa?.middle2BasisWeight ?? "",
    flute3PaperType: qa?.flute3PaperType ?? "",
    flute3BasisWeight: qa?.flute3BasisWeight ?? "",
    bottomPaperType: qa?.bottomPaperType ?? "",
    bottomBasisWeight: qa?.bottomBasisWeight ?? "",
    runQualityAssessmentResult: qa?.runQualityAssessmentResult ?? "",
    runQaNote: qa?.runQaNote ?? "",
    runBurstStandard: qa?.runBurstStandard ?? "",
    runCompressionStandard: qa?.runCompressionStandard ?? "",
    runWeightLimitStandard: qa?.runWeightLimitStandard ?? "",
    runKcgStandard: qa?.runKcgStandard ?? "",
    runEdgeCrushStandard: qa?.runEdgeCrushStandard ?? "",
    runSlipAngleStandard: qa?.runSlipAngleStandard ?? "",
    runWaterproofStandard: qa?.runWaterproofStandard ?? "",
    runKcgQaSxProposal1: qa?.runKcgQaSxProposal1 ?? "",
    runFacePaperType: qa?.runFacePaperType ?? "",
    runFaceBasisWeight: qa?.runFaceBasisWeight ?? "",
    runFlutePaperType: qa?.runFlutePaperType ?? "",
    runFluteBasisWeight: qa?.runFluteBasisWeight ?? "",
    runMiddlePaperType: qa?.runMiddlePaperType ?? "",
    runMiddleBasisWeight: qa?.runMiddleBasisWeight ?? "",
    runFlute2PaperType: qa?.runFlute2PaperType ?? "",
    runFlute2BasisWeight: qa?.runFlute2BasisWeight ?? "",
    runMiddle2PaperType: qa?.runMiddle2PaperType ?? "",
    runMiddle2BasisWeight: qa?.runMiddle2BasisWeight ?? "",
    runFlute3PaperType: qa?.runFlute3PaperType ?? "",
    runFlute3BasisWeight: qa?.runFlute3BasisWeight ?? "",
    runBottomPaperType: qa?.runBottomPaperType ?? "",
    runBottomBasisWeight: qa?.runBottomBasisWeight ?? "",
    runPaperStructures: (qa?.runPaperStructures ?? []).map((item) => normalizeRunPaperStructure(item)),
  };
}

function qaRowFromApi(row: QaLineDataRow): Partial<QaLinePayload> {
  return {
    qualityAssessmentResult: row.qualityAssessmentResult ?? "",
    qaNote: row.qaNote ?? "",
    burstStandard: row.burstStandard ?? "",
    compressionStandard: row.compressionStandard ?? "",
    weightLimitStandard: row.weightLimitStandard ?? "",
    kcgStandard: row.kcgStandard ?? "",
    kcgQaSxProposal1: row.kcgQaSxProposal1 ?? "",
    kcgQaSxProposal2: row.kcgQaSxProposal2 ?? "",
    kcgQaSxProposal3: row.kcgQaSxProposal3 ?? "",
    edgeCrushStandard: row.edgeCrushStandard ?? "",
    slipAngleStandard: row.slipAngleStandard ?? "",
    waterproofStandard: row.waterproofStandard ?? "",
    facePaperType: row.facePaperType ?? "",
    faceBasisWeight: row.faceBasisWeight ?? "",
    flutePaperType: row.flutePaperType ?? "",
    fluteBasisWeight: row.fluteBasisWeight ?? "",
    middlePaperType: row.middlePaperType ?? "",
    middleBasisWeight: row.middleBasisWeight ?? "",
    flute2PaperType: row.flute2PaperType ?? "",
    flute2BasisWeight: row.flute2BasisWeight ?? "",
    middle2PaperType: row.middle2PaperType ?? "",
    middle2BasisWeight: row.middle2BasisWeight ?? "",
    flute3PaperType: row.flute3PaperType ?? "",
    flute3BasisWeight: row.flute3BasisWeight ?? "",
    bottomPaperType: row.bottomPaperType ?? "",
    bottomBasisWeight: row.bottomBasisWeight ?? "",
    runQualityAssessmentResult: row.runQualityAssessmentResult ?? "",
    runQaNote: row.runQaNote ?? "",
    runBurstStandard: row.runBurstStandard ?? "",
    runCompressionStandard: row.runCompressionStandard ?? "",
    runWeightLimitStandard: row.runWeightLimitStandard ?? "",
    runKcgStandard: row.runKcgStandard ?? "",
    runEdgeCrushStandard: row.runEdgeCrushStandard ?? "",
    runSlipAngleStandard: row.runSlipAngleStandard ?? "",
    runWaterproofStandard: row.runWaterproofStandard ?? "",
    runKcgQaSxProposal1: row.runKcgQaSxProposal1 ?? "",
    runFacePaperType: row.runFacePaperType ?? "",
    runFaceBasisWeight: row.runFaceBasisWeight ?? "",
    runFlutePaperType: row.runFlutePaperType ?? "",
    runFluteBasisWeight: row.runFluteBasisWeight ?? "",
    runMiddlePaperType: row.runMiddlePaperType ?? "",
    runMiddleBasisWeight: row.runMiddleBasisWeight ?? "",
    runFlute2PaperType: row.runFlute2PaperType ?? "",
    runFlute2BasisWeight: row.runFlute2BasisWeight ?? "",
    runMiddle2PaperType: row.runMiddle2PaperType ?? "",
    runMiddle2BasisWeight: row.runMiddle2BasisWeight ?? "",
    runFlute3PaperType: row.runFlute3PaperType ?? "",
    runFlute3BasisWeight: row.runFlute3BasisWeight ?? "",
    runBottomPaperType: row.runBottomPaperType ?? "",
    runBottomBasisWeight: row.runBottomBasisWeight ?? "",
    runPaperStructures: (row.runPaperStructures ?? []).map((item) => normalizeRunPaperStructure(item)),
  };
}

/** One QA editor row per line; legacy cycle `qaData` fills defaults until `qaLineData` exists per line. */
export function buildQaLineState(detail: QuotationDetailResponse): QaLinePayload[] {
  const lines = resolvedLineItems(detail);
  const qa = detail.qaData;
  const legacy = qa ? legacyQaFields(qa) : ({} as Omit<QaLinePayload, "lineNumber">);
  const perLine = new Map((qa?.qaLineData ?? []).map((row) => [row.lineNumber, row]));

  return lines.map((li) => {
    const n = li.lineNumber;
    const fromApi = perLine.get(n);
    const merged: QaLinePayload = {
      ...emptyQaLinePayload(n),
      ...legacy,
      ...(fromApi ? qaRowFromApi(fromApi) : {}),
      lineNumber: n,
    };
    return { ...merged, runPaperStructures: resolveRunPaperStructures(merged) };
  });
}

function legacyRndFields(rnd: RndData | null | undefined): Omit<RndLinePayload, "lineNumber"> {
  return {
    printingPlateCost: rnd?.printingPlateCost != null ? String(rnd.printingPlateCost) : "",
    dieCost: rnd?.dieCost != null ? String(rnd.dieCost) : "",
    layoutCode: rnd?.layoutCode ?? "",
    layoutQuoteCode: rnd?.layoutQuoteCode ?? "",
    dieCode: rnd?.dieCode ?? "",
    dieQuoteCode: rnd?.dieQuoteCode ?? "",
    productionPlan: rnd?.productionPlan ?? "",
    rndNote: rnd?.rndNote ?? "",
  };
}

function rndRowFromApi(row: RndLineDataRow): Partial<RndLinePayload> {
  return {
    printingPlateCost: row.printingPlateCost != null ? String(row.printingPlateCost) : "",
    dieCost: row.dieCost != null ? String(row.dieCost) : "",
    layoutCode: row.layoutCode ?? "",
    layoutQuoteCode: row.layoutQuoteCode ?? "",
    dieCode: row.dieCode ?? "",
    dieQuoteCode: row.dieQuoteCode ?? "",
    productionPlan: row.productionPlan ?? "",
    rndNote: row.rndNote ?? "",
  };
}

export function buildRndLineState(detail: QuotationDetailResponse): RndLinePayload[] {
  const lines = resolvedLineItems(detail);
  const rnd = detail.rndData;
  const legacy = rnd ? legacyRndFields(rnd) : ({} as Omit<RndLinePayload, "lineNumber">);
  const perLine = new Map((rnd?.rndLineData ?? []).map((row) => [row.lineNumber, row]));

  return lines.map((li) => {
    const n = li.lineNumber;
    const fromApi = perLine.get(n);
    return {
      ...emptyRndLinePayload(n),
      ...legacy,
      ...(fromApi ? rndRowFromApi(fromApi) : {}),
      lineNumber: n,
    };
  });
}

function runPaperStructureFilled(row: QaLinePayload): boolean {
  return row.runPaperStructures.some((set) => [...set.paperTypes, ...set.basisWeights].some((value) => value.trim()));
}

export function validateQaLines(rows: QaLinePayload[]): string[] {
  const errors: string[] = [];
  for (const row of rows) {
    const n = row.lineNumber;
    if (!row.runBurstStandard.trim()) errors.push(`Dòng ${n} — Nhập Bục`);
    if (!row.runCompressionStandard.trim()) errors.push(`Dòng ${n} — Nhập Nén`);
    if (!runPaperStructureFilled(row)) errors.push(`Dòng ${n} — Nhập ít nhất 1 kết cấu giấy`);
  }
  return errors;
}

export function validateRndLines(rows: RndLinePayload[]): string[] {
  const errors: string[] = [];
  for (const row of rows) {
    const n = row.lineNumber;
    if (!row.productionPlan.trim()) errors.push(`Dòng ${n} — Phương án sản xuất (RND-11)`);
  }
  return errors;
}

/** GET detail exposes `qaLineData` key — required before PUT line-array matches backend. */
export function serverSupportsQaLinePersist(detail: QuotationDetailResponse): boolean {
  const q = detail.qaData;
  return q != null && "qaLineData" in q;
}

export function serverSupportsRndLinePersist(detail: QuotationDetailResponse): boolean {
  const r = detail.rndData;
  return r != null && "rndLineData" in r;
}

export function qaLinePayloadToApiRow(row: QaLinePayload): QaLineDataRow {
  return {
    lineNumber: row.lineNumber,
    qualityAssessmentResult: row.qualityAssessmentResult.trim() || undefined,
    qaNote: row.qaNote.trim() || undefined,
    burstStandard: row.burstStandard.trim() || undefined,
    compressionStandard: row.compressionStandard.trim() || undefined,
    weightLimitStandard: row.weightLimitStandard.trim() || undefined,
    kcgStandard: row.kcgStandard.trim() || undefined,
    kcgQaSxProposal1: row.kcgQaSxProposal1.trim() || undefined,
    kcgQaSxProposal2: row.kcgQaSxProposal2.trim() || undefined,
    kcgQaSxProposal3: row.kcgQaSxProposal3.trim() || undefined,
    edgeCrushStandard: row.edgeCrushStandard.trim() || undefined,
    slipAngleStandard: row.slipAngleStandard.trim() || undefined,
    waterproofStandard: row.waterproofStandard.trim() || undefined,
    facePaperType: row.facePaperType.trim() || undefined,
    faceBasisWeight: row.faceBasisWeight.trim() || undefined,
    flutePaperType: row.flutePaperType.trim() || undefined,
    fluteBasisWeight: row.fluteBasisWeight.trim() || undefined,
    middlePaperType: row.middlePaperType.trim() || undefined,
    middleBasisWeight: row.middleBasisWeight.trim() || undefined,
    flute2PaperType: row.flute2PaperType.trim() || undefined,
    flute2BasisWeight: row.flute2BasisWeight.trim() || undefined,
    middle2PaperType: row.middle2PaperType.trim() || undefined,
    middle2BasisWeight: row.middle2BasisWeight.trim() || undefined,
    flute3PaperType: row.flute3PaperType.trim() || undefined,
    flute3BasisWeight: row.flute3BasisWeight.trim() || undefined,
    bottomPaperType: row.bottomPaperType.trim() || undefined,
    bottomBasisWeight: row.bottomBasisWeight.trim() || undefined,
    runQualityAssessmentResult: row.runQualityAssessmentResult.trim() || undefined,
    runQaNote: row.runQaNote.trim() || undefined,
    runBurstStandard: row.runBurstStandard.trim() || undefined,
    runCompressionStandard: row.runCompressionStandard.trim() || undefined,
    runWeightLimitStandard: row.runWeightLimitStandard.trim() || undefined,
    runKcgStandard: row.runKcgStandard.trim() || undefined,
    runEdgeCrushStandard: row.runEdgeCrushStandard.trim() || undefined,
    runSlipAngleStandard: row.runSlipAngleStandard.trim() || undefined,
    runWaterproofStandard: row.runWaterproofStandard.trim() || undefined,
    runKcgQaSxProposal1: row.runKcgQaSxProposal1.trim() || undefined,
    runFacePaperType: row.runPaperStructures[0]?.paperTypes[0]?.trim() || undefined,
    runFaceBasisWeight: row.runPaperStructures[0]?.basisWeights[0]?.trim() || undefined,
    runFlutePaperType: row.runPaperStructures[0]?.paperTypes[1]?.trim() || undefined,
    runFluteBasisWeight: row.runPaperStructures[0]?.basisWeights[1]?.trim() || undefined,
    runMiddlePaperType: row.runPaperStructures[0]?.paperTypes[2]?.trim() || undefined,
    runMiddleBasisWeight: row.runPaperStructures[0]?.basisWeights[2]?.trim() || undefined,
    runFlute2PaperType: row.runPaperStructures[0]?.paperTypes[3]?.trim() || undefined,
    runFlute2BasisWeight: row.runPaperStructures[0]?.basisWeights[3]?.trim() || undefined,
    runMiddle2PaperType: row.runPaperStructures[0]?.paperTypes[4]?.trim() || undefined,
    runMiddle2BasisWeight: row.runPaperStructures[0]?.basisWeights[4]?.trim() || undefined,
    runFlute3PaperType: row.runPaperStructures[0]?.paperTypes[5]?.trim() || undefined,
    runFlute3BasisWeight: row.runPaperStructures[0]?.basisWeights[5]?.trim() || undefined,
    runBottomPaperType: row.runPaperStructures[0]?.paperTypes[6]?.trim() || undefined,
    runBottomBasisWeight: row.runPaperStructures[0]?.basisWeights[6]?.trim() || undefined,
    runPaperStructures: row.runPaperStructures.map((item) => ({
      paperTypes: sevenLayers(item.paperTypes).map((value) => value.trim()),
      basisWeights: sevenLayers(item.basisWeights).map((value) => value.trim()),
    })),
  };
}

export function qaDataFromLinePayloads(lines: QaLinePayload[]): QaData {
  return { qaLineData: lines.map(qaLinePayloadToApiRow) };
}

export function rndLinePayloadToApiRow(row: RndLinePayload): RndLineDataRow {
  return {
    lineNumber: row.lineNumber,
    printingPlateCost: row.printingPlateCost === "" ? 0 : Number(row.printingPlateCost),
    dieCost: row.dieCost === "" ? 0 : Number(row.dieCost),
    layoutCode: row.layoutCode.trim() || undefined,
    layoutQuoteCode: row.layoutQuoteCode.trim() || undefined,
    dieCode: row.dieCode.trim() || undefined,
    dieQuoteCode: row.dieQuoteCode.trim() || undefined,
    productionPlan: row.productionPlan.trim() || undefined,
    rndNote: row.rndNote.trim() || undefined,
  };
}

export function rndDataFromLinePayloads(lines: RndLinePayload[]): RndData {
  return { rndLineData: lines.map(rndLinePayloadToApiRow) };
}
