-- Up Migration
-- Full per-line QA UI (`QaLineDataRow`) — technical run + paper layers + run_paper_structures.

ALTER TABLE public.quotation_line_qa
  ADD COLUMN IF NOT EXISTS edge_crush_standard text,
  ADD COLUMN IF NOT EXISTS slip_angle_standard text,
  ADD COLUMN IF NOT EXISTS waterproof_standard text,
  ADD COLUMN IF NOT EXISTS face_paper_type text,
  ADD COLUMN IF NOT EXISTS face_basis_weight text,
  ADD COLUMN IF NOT EXISTS flute_paper_type text,
  ADD COLUMN IF NOT EXISTS flute_basis_weight text,
  ADD COLUMN IF NOT EXISTS middle_paper_type text,
  ADD COLUMN IF NOT EXISTS middle_basis_weight text,
  ADD COLUMN IF NOT EXISTS flute2_paper_type text,
  ADD COLUMN IF NOT EXISTS flute2_basis_weight text,
  ADD COLUMN IF NOT EXISTS middle2_paper_type text,
  ADD COLUMN IF NOT EXISTS middle2_basis_weight text,
  ADD COLUMN IF NOT EXISTS flute3_paper_type text,
  ADD COLUMN IF NOT EXISTS flute3_basis_weight text,
  ADD COLUMN IF NOT EXISTS bottom_paper_type text,
  ADD COLUMN IF NOT EXISTS bottom_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_quality_assessment_result text,
  ADD COLUMN IF NOT EXISTS run_qa_note text,
  ADD COLUMN IF NOT EXISTS run_burst_standard text,
  ADD COLUMN IF NOT EXISTS run_compression_standard text,
  ADD COLUMN IF NOT EXISTS run_weight_limit_standard text,
  ADD COLUMN IF NOT EXISTS run_kcg_standard text,
  ADD COLUMN IF NOT EXISTS run_edge_crush_standard text,
  ADD COLUMN IF NOT EXISTS run_slip_angle_standard text,
  ADD COLUMN IF NOT EXISTS run_waterproof_standard text,
  ADD COLUMN IF NOT EXISTS run_kcg_qa_sx_proposal_1 text,
  ADD COLUMN IF NOT EXISTS run_face_paper_type text,
  ADD COLUMN IF NOT EXISTS run_face_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_flute_paper_type text,
  ADD COLUMN IF NOT EXISTS run_flute_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_middle_paper_type text,
  ADD COLUMN IF NOT EXISTS run_middle_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_flute2_paper_type text,
  ADD COLUMN IF NOT EXISTS run_flute2_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_middle2_paper_type text,
  ADD COLUMN IF NOT EXISTS run_middle2_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_flute3_paper_type text,
  ADD COLUMN IF NOT EXISTS run_flute3_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_bottom_paper_type text,
  ADD COLUMN IF NOT EXISTS run_bottom_basis_weight text,
  ADD COLUMN IF NOT EXISTS run_paper_structures jsonb;

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '021_quotation_line_qa_ui_fields is forward-only';
END
$$;
