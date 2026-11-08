-- Up Migration

CREATE TABLE public.workflow_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  cycle_number integer NOT NULL,
  cycle_type public.cycle_type_enum NOT NULL,
  resubmit_reason text,
  submitted_at timestamptz,
  submitted_by text,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflow_cycles_quotation_cycle_number_key
    UNIQUE (quotation_id, cycle_number),
  CONSTRAINT workflow_cycles_cycle_number_positive
    CHECK (cycle_number >= 1)
);

CREATE INDEX workflow_cycles_quotation_id_idx
  ON public.workflow_cycles (quotation_id);

ALTER TABLE public.quotations
  ADD COLUMN current_cycle_id uuid REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT;

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '009_workflow_cycles is forward-only';
END
$$;
