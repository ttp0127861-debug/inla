-- Up Migration
-- Per-line QA and R&D payload arrays (1:1 cycle row); legacy scalar columns deprecated for writes.

ALTER TABLE public.quotation_qa_data
  ADD COLUMN qa_line_data jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.quotation_rnd_data
  ADD COLUMN rnd_line_data jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quotation_qa_data.qa_line_data IS
  'Per-line QA payload (lineNumber + standards). Legacy scalar columns kept for read merge only.';
COMMENT ON COLUMN public.quotation_rnd_data.rnd_line_data IS
  'Per-line R&D costs and plan. Legacy scalar columns kept for read merge only.';

-- Backfill: when exactly one line item exists and qa_line_data is empty,
-- copy legacy scalar fields into lineNumber 1 once. Otherwise leave [] (support may fix manually).
UPDATE public.quotation_qa_data q
SET qa_line_data = jsonb_build_array(
  jsonb_build_object(
    'lineNumber', 1,
    'qualityAssessmentResult', to_jsonb(q.quality_assessment_result),
    'qualityRequirements', to_jsonb(q.quality_requirements),
    'qaNote', to_jsonb(q.qa_note),
    'burstStandard', to_jsonb(q.burst_standard),
    'compressionStandard', to_jsonb(q.compression_standard),
    'weightLimitStandard', to_jsonb(q.weight_limit_standard),
    'kcgStandard', to_jsonb(q.kcg_standard),
    'kcgQaSxProposal1', to_jsonb(q.kcg_qa_sx_proposal_1),
    'kcgQaSxProposal2', to_jsonb(q.kcg_qa_sx_proposal_2),
    'kcgQaSxProposal3', to_jsonb(q.kcg_qa_sx_proposal_3)
  )
)
WHERE q.qa_line_data = '[]'::jsonb
  AND (
    SELECT count(*)::int
    FROM public.quotation_line_items li
    WHERE li.workflow_cycle_id = q.workflow_cycle_id
  ) = 1
  AND (
    q.quality_assessment_result IS NOT NULL
    OR q.quality_requirements IS NOT NULL
    OR q.qa_note IS NOT NULL
    OR q.burst_standard IS NOT NULL
    OR q.compression_standard IS NOT NULL
    OR q.weight_limit_standard IS NOT NULL
    OR q.kcg_standard IS NOT NULL
    OR q.kcg_qa_sx_proposal_1 IS NOT NULL
    OR q.kcg_qa_sx_proposal_2 IS NOT NULL
    OR q.kcg_qa_sx_proposal_3 IS NOT NULL
  );

UPDATE public.quotation_rnd_data r
SET rnd_line_data = jsonb_build_array(
  jsonb_build_object(
    'lineNumber', 1,
    'printingPlateCost', to_jsonb(r.printing_plate_cost),
    'dieCost', to_jsonb(r.die_cost),
    'productionPlan', to_jsonb(r.production_plan),
    'rndNote', to_jsonb(r.rnd_note)
  )
)
WHERE r.rnd_line_data = '[]'::jsonb
  AND (
    SELECT count(*)::int
    FROM public.quotation_line_items li
    WHERE li.workflow_cycle_id = r.workflow_cycle_id
  ) = 1
  AND (
    r.printing_plate_cost IS DISTINCT FROM 0
    OR r.die_cost IS DISTINCT FROM 0
    OR r.production_plan IS NOT NULL
    OR r.rnd_note IS NOT NULL
  );

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '016_qa_rnd_line_jsonb is forward-only';
END
$$;
