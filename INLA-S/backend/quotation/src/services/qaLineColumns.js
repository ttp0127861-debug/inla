/** camelCase API field → snake_case DB column on `quotation_line_qa`. */

const QA_LINE_COLUMN_MAP = [
  ["qualityAssessmentResult", "quality_assessment_result"],
  ["qualityRequirements", "quality_requirements"],
  ["qaNote", "qa_note"],
  ["burstStandard", "burst_standard"],
  ["compressionStandard", "compression_standard"],
  ["weightLimitStandard", "weight_limit_standard"],
  ["kcgStandard", "kcg_standard"],
  ["kcgQaSxProposal1", "kcg_qa_sx_proposal_1"],
  ["kcgQaSxProposal2", "kcg_qa_sx_proposal_2"],
  ["kcgQaSxProposal3", "kcg_qa_sx_proposal_3"],
  ["edgeCrushStandard", "edge_crush_standard"],
  ["slipAngleStandard", "slip_angle_standard"],
  ["waterproofStandard", "waterproof_standard"],
  ["facePaperType", "face_paper_type"],
  ["faceBasisWeight", "face_basis_weight"],
  ["flutePaperType", "flute_paper_type"],
  ["fluteBasisWeight", "flute_basis_weight"],
  ["middlePaperType", "middle_paper_type"],
  ["middleBasisWeight", "middle_basis_weight"],
  ["flute2PaperType", "flute2_paper_type"],
  ["flute2BasisWeight", "flute2_basis_weight"],
  ["middle2PaperType", "middle2_paper_type"],
  ["middle2BasisWeight", "middle2_basis_weight"],
  ["flute3PaperType", "flute3_paper_type"],
  ["flute3BasisWeight", "flute3_basis_weight"],
  ["bottomPaperType", "bottom_paper_type"],
  ["bottomBasisWeight", "bottom_basis_weight"],
  ["runQualityAssessmentResult", "run_quality_assessment_result"],
  ["runQaNote", "run_qa_note"],
  ["runBurstStandard", "run_burst_standard"],
  ["runCompressionStandard", "run_compression_standard"],
  ["runWeightLimitStandard", "run_weight_limit_standard"],
  ["runKcgStandard", "run_kcg_standard"],
  ["runEdgeCrushStandard", "run_edge_crush_standard"],
  ["runSlipAngleStandard", "run_slip_angle_standard"],
  ["runWaterproofStandard", "run_waterproof_standard"],
  ["runKcgQaSxProposal1", "run_kcg_qa_sx_proposal_1"],
  ["runFacePaperType", "run_face_paper_type"],
  ["runFaceBasisWeight", "run_face_basis_weight"],
  ["runFlutePaperType", "run_flute_paper_type"],
  ["runFluteBasisWeight", "run_flute_basis_weight"],
  ["runMiddlePaperType", "run_middle_paper_type"],
  ["runMiddleBasisWeight", "run_middle_basis_weight"],
  ["runFlute2PaperType", "run_flute2_paper_type"],
  ["runFlute2BasisWeight", "run_flute2_basis_weight"],
  ["runMiddle2PaperType", "run_middle2_paper_type"],
  ["runMiddle2BasisWeight", "run_middle2_basis_weight"],
  ["runFlute3PaperType", "run_flute3_paper_type"],
  ["runFlute3BasisWeight", "run_flute3_basis_weight"],
  ["runBottomPaperType", "run_bottom_paper_type"],
  ["runBottomBasisWeight", "run_bottom_basis_weight"],
  ["runPaperStructures", "run_paper_structures"],
];

const QA_LINE_SQL_SELECT = QA_LINE_COLUMN_MAP.map(([, col]) => `qa.${col}`).join(",\n       ");

function parseRunPaperStructuresJson(value) {
  if (value == null) return null;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed)) return null;
  return parsed;
}

function mapQaLineRowFromDb(row) {
  const out = { lineNumber: row.line_number };
  for (const [apiKey, dbCol] of QA_LINE_COLUMN_MAP) {
    if (apiKey === "runPaperStructures") {
      out.runPaperStructures = parseRunPaperStructuresJson(row[dbCol]);
    } else {
      out[apiKey] = row[dbCol] ?? null;
    }
  }
  return out;
}

function qaLineUpdateAssignments(startParamIndex) {
  const sets = [];
  let i = startParamIndex;
  for (const [, dbCol] of QA_LINE_COLUMN_MAP) {
    sets.push(
      dbCol === "run_paper_structures"
        ? `${dbCol} = $${i}::jsonb`
        : `${dbCol} = $${i}`
    );
    i += 1;
  }
  return { setSql: sets.join(",\n           "), paramCount: QA_LINE_COLUMN_MAP.length };
}

function qaLineUpdateParams(line) {
  return QA_LINE_COLUMN_MAP.map(([apiKey]) => {
    if (apiKey === "runPaperStructures") {
      if (line.runPaperStructures === undefined) return null;
      if (line.runPaperStructures === null) return null;
      return JSON.stringify(line.runPaperStructures);
    }
    const val = line[apiKey];
    if (val === undefined) return null;
    return val;
  });
}

module.exports = {
  QA_LINE_COLUMN_MAP,
  QA_LINE_SQL_SELECT,
  mapQaLineRowFromDb,
  qaLineUpdateAssignments,
  qaLineUpdateParams,
};
