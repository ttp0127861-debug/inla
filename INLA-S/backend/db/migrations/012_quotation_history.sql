-- Up Migration

CREATE TABLE public.quotation_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  revision_number integer NOT NULL,
  revision_code text NOT NULL,
  snapshot_jsonb jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  CONSTRAINT quotation_revisions_quotation_revision_number_key
    UNIQUE (quotation_id, revision_number),
  CONSTRAINT quotation_revisions_revision_number_positive
    CHECK (revision_number >= 1)
);

CREATE INDEX quotation_revisions_quotation_id_idx
  ON public.quotation_revisions (quotation_id);

CREATE TABLE public.quotation_workflow_events (
  id bigserial PRIMARY KEY,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  from_status public.workflow_status_enum,
  to_status public.workflow_status_enum NOT NULL,
  action_type public.workflow_action_type_enum NOT NULL,
  actor_username text,
  actor_role text,
  action_at timestamptz NOT NULL DEFAULT now(),
  action_note text
);

CREATE INDEX quotation_workflow_events_quotation_action_at_idx
  ON public.quotation_workflow_events (quotation_id, action_at DESC);

CREATE FUNCTION audit.reject_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'append-only table %: % not allowed', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE TRIGGER quotation_revisions_reject_mutation
  BEFORE UPDATE OR DELETE ON public.quotation_revisions
  FOR EACH ROW
  EXECUTE FUNCTION audit.reject_append_only_mutation();

CREATE TRIGGER quotation_workflow_events_reject_mutation
  BEFORE UPDATE OR DELETE ON public.quotation_workflow_events
  FOR EACH ROW
  EXECUTE FUNCTION audit.reject_append_only_mutation();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '012_quotation_history is forward-only';
END
$$;
