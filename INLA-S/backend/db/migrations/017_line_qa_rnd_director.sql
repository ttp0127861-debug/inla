-- Up Migration
-- Per-line QA, R&D, and director rows (1:1 with quotation_line_items). Drop cycle-level qa/rnd/director tables.

-- Enforce composite parent key for line-scoped child FKs.
ALTER TABLE public.quotation_line_items
  ADD CONSTRAINT quotation_line_items_id_cycle_quotation_uniq UNIQUE (id, workflow_cycle_id, quotation_id);

-- ---------------------------------------------------------------------------
-- quotation_line_qa
-- ---------------------------------------------------------------------------
CREATE TABLE public.quotation_line_qa (
  line_item_id uuid PRIMARY KEY REFERENCES public.quotation_line_items (id) ON DELETE RESTRICT,
  workflow_cycle_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  quality_assessment_result text,
  quality_requirements text,
  qa_note text,
  burst_standard text,
  compression_standard text,
  weight_limit_standard text,
  kcg_standard text,
  kcg_qa_sx_proposal_1 text,
  kcg_qa_sx_proposal_2 text,
  kcg_qa_sx_proposal_3 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotation_line_qa_li_cycle_quotation_fk
    FOREIGN KEY (line_item_id, workflow_cycle_id, quotation_id)
    REFERENCES public.quotation_line_items (id, workflow_cycle_id, quotation_id)
    ON DELETE RESTRICT
);

CREATE INDEX quotation_line_qa_quotation_id_idx
  ON public.quotation_line_qa (quotation_id);

CREATE TRIGGER quotation_line_qa_touch_updated_at
  BEFORE UPDATE ON public.quotation_line_qa
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- quotation_line_rnd
-- ---------------------------------------------------------------------------
CREATE TABLE public.quotation_line_rnd (
  line_item_id uuid PRIMARY KEY REFERENCES public.quotation_line_items (id) ON DELETE RESTRICT,
  workflow_cycle_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  printing_plate_cost numeric(18, 2) NOT NULL DEFAULT 0,
  die_cost numeric(18, 2) NOT NULL DEFAULT 0,
  production_plan text,
  rnd_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotation_line_rnd_li_cycle_quotation_fk
    FOREIGN KEY (line_item_id, workflow_cycle_id, quotation_id)
    REFERENCES public.quotation_line_items (id, workflow_cycle_id, quotation_id)
    ON DELETE RESTRICT
);

CREATE INDEX quotation_line_rnd_quotation_id_idx
  ON public.quotation_line_rnd (quotation_id);

CREATE TRIGGER quotation_line_rnd_touch_updated_at
  BEFORE UPDATE ON public.quotation_line_rnd
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- quotation_line_director
-- ---------------------------------------------------------------------------
CREATE TABLE public.quotation_line_director (
  line_item_id uuid PRIMARY KEY REFERENCES public.quotation_line_items (id) ON DELETE RESTRICT,
  workflow_cycle_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  director_decision public.director_decision_enum,
  approval_note text,
  rejection_reason text,
  decision_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotation_line_director_li_cycle_quotation_fk
    FOREIGN KEY (line_item_id, workflow_cycle_id, quotation_id)
    REFERENCES public.quotation_line_items (id, workflow_cycle_id, quotation_id)
    ON DELETE RESTRICT
);

CREATE INDEX quotation_line_director_quotation_id_idx
  ON public.quotation_line_director (quotation_id);

CREATE TRIGGER quotation_line_director_touch_updated_at
  BEFORE UPDATE ON public.quotation_line_director
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Backfill. A matching qa_line_data / rnd_line_data element wins even when a
-- field is null. Scalars apply only when that line number is absent and the
-- cycle has exactly one line item.
-- ---------------------------------------------------------------------------
INSERT INTO public.quotation_line_qa (
  line_item_id,
  workflow_cycle_id,
  quotation_id,
  quality_assessment_result,
  quality_requirements,
  qa_note,
  burst_standard,
  compression_standard,
  weight_limit_standard,
  kcg_standard,
  kcg_qa_sx_proposal_1,
  kcg_qa_sx_proposal_2,
  kcg_qa_sx_proposal_3
)
SELECT
  li.id,
  li.workflow_cycle_id,
  li.quotation_id,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'qualityAssessmentResult'
    WHEN line_counts.line_count = 1 THEN q.quality_assessment_result
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'qualityRequirements'
    WHEN line_counts.line_count = 1 THEN q.quality_requirements
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'qaNote'
    WHEN line_counts.line_count = 1 THEN q.qa_note
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'burstStandard'
    WHEN line_counts.line_count = 1 THEN q.burst_standard
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'compressionStandard'
    WHEN line_counts.line_count = 1 THEN q.compression_standard
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'weightLimitStandard'
    WHEN line_counts.line_count = 1 THEN q.weight_limit_standard
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'kcgStandard'
    WHEN line_counts.line_count = 1 THEN q.kcg_standard
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'kcgQaSxProposal1'
    WHEN line_counts.line_count = 1 THEN q.kcg_qa_sx_proposal_1
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'kcgQaSxProposal2'
    WHEN line_counts.line_count = 1 THEN q.kcg_qa_sx_proposal_2
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'kcgQaSxProposal3'
    WHEN line_counts.line_count = 1 THEN q.kcg_qa_sx_proposal_3
    ELSE NULL
  END
FROM public.quotation_line_items li
JOIN (
  SELECT workflow_cycle_id, count(*)::int AS line_count
  FROM public.quotation_line_items
  GROUP BY workflow_cycle_id
) line_counts ON line_counts.workflow_cycle_id = li.workflow_cycle_id
LEFT JOIN public.quotation_qa_data q
  ON q.workflow_cycle_id = li.workflow_cycle_id
LEFT JOIN LATERAL (
  SELECT src.elem
  FROM jsonb_array_elements(
    CASE
      WHEN q.qa_line_data IS NOT NULL AND jsonb_typeof(q.qa_line_data) = 'array'
      THEN q.qa_line_data
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS src(elem, ord)
  WHERE (src.elem->>'lineNumber') ~ '^[0-9]+$'
    AND (src.elem->>'lineNumber')::int = li.line_number
  ORDER BY src.ord
  LIMIT 1
) matched ON true;

INSERT INTO public.quotation_line_rnd (
  line_item_id,
  workflow_cycle_id,
  quotation_id,
  printing_plate_cost,
  die_cost,
  production_plan,
  rnd_note
)
SELECT
  li.id,
  li.workflow_cycle_id,
  li.quotation_id,
  CASE
    WHEN matched.elem IS NOT NULL THEN COALESCE(NULLIF(trim(matched.elem->>'printingPlateCost'), '')::numeric(18, 2), 0)
    WHEN line_counts.line_count = 1 THEN COALESCE(r.printing_plate_cost, 0)
    ELSE 0
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN COALESCE(NULLIF(trim(matched.elem->>'dieCost'), '')::numeric(18, 2), 0)
    WHEN line_counts.line_count = 1 THEN COALESCE(r.die_cost, 0)
    ELSE 0
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'productionPlan'
    WHEN line_counts.line_count = 1 THEN r.production_plan
    ELSE NULL
  END,
  CASE
    WHEN matched.elem IS NOT NULL THEN matched.elem->>'rndNote'
    WHEN line_counts.line_count = 1 THEN r.rnd_note
    ELSE NULL
  END
FROM public.quotation_line_items li
JOIN (
  SELECT workflow_cycle_id, count(*)::int AS line_count
  FROM public.quotation_line_items
  GROUP BY workflow_cycle_id
) line_counts ON line_counts.workflow_cycle_id = li.workflow_cycle_id
LEFT JOIN public.quotation_rnd_data r
  ON r.workflow_cycle_id = li.workflow_cycle_id
LEFT JOIN LATERAL (
  SELECT src.elem
  FROM jsonb_array_elements(
    CASE
      WHEN r.rnd_line_data IS NOT NULL AND jsonb_typeof(r.rnd_line_data) = 'array'
      THEN r.rnd_line_data
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS src(elem, ord)
  WHERE (src.elem->>'lineNumber') ~ '^[0-9]+$'
    AND (src.elem->>'lineNumber')::int = li.line_number
  ORDER BY src.ord
  LIMIT 1
) matched ON true;

INSERT INTO public.quotation_line_director (
  line_item_id,
  workflow_cycle_id,
  quotation_id,
  director_decision,
  approval_note,
  rejection_reason,
  decision_at
)
SELECT
  li.id,
  li.workflow_cycle_id,
  li.quotation_id,
  d.director_decision,
  d.approval_note,
  d.rejection_reason,
  CASE
    WHEN d.director_decision IS NOT NULL AND d.decision_at IS NULL THEN now()
    ELSE d.decision_at
  END
FROM public.quotation_line_items li
LEFT JOIN public.quotation_director_data d ON d.workflow_cycle_id = li.workflow_cycle_id;

-- Refuse to drop the cycle tables unless every line received one child row.
DO $$
DECLARE
  line_count bigint;
  qa_count bigint;
  rnd_count bigint;
  director_count bigint;
BEGIN
  SELECT count(*) INTO line_count FROM public.quotation_line_items;
  SELECT count(*) INTO qa_count FROM public.quotation_line_qa;
  SELECT count(*) INTO rnd_count FROM public.quotation_line_rnd;
  SELECT count(*) INTO director_count FROM public.quotation_line_director;
  IF qa_count <> line_count OR rnd_count <> line_count OR director_count <> line_count THEN
    RAISE EXCEPTION
      '017 backfill expected one QA, R&D, and director row per line item (lines %, qa %, rnd %, director %)',
      line_count, qa_count, rnd_count, director_count;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Drop legacy cycle-level tables (after backfill)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS quotation_qa_data_audit_row_change ON public.quotation_qa_data;
DROP TABLE public.quotation_qa_data;

DROP TRIGGER IF EXISTS quotation_rnd_data_audit_row_change ON public.quotation_rnd_data;
DROP TABLE public.quotation_rnd_data;

DROP TRIGGER IF EXISTS quotation_director_data_audit_row_change ON public.quotation_director_data;
DROP TABLE public.quotation_director_data;

-- ---------------------------------------------------------------------------
-- Audit: replace capture_row_change (from 015) and attach line-level triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit.capture_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  entity_id_text text;
  scoped_customer_id uuid;
  scoped_quotation_id uuid;
  semantic text;
  payload_role_table text[] := ARRAY[
    'quotation_customer_snapshots',
    'quotation_sales_data',
    'quotation_development_minutes',
    'quotation_executor_intake',
    'quotation_executor_consolidation',
    'quotation_accounting_data'
  ];
BEGIN
  IF TG_TABLE_NAME IN ('quotation_line_qa', 'quotation_line_rnd', 'quotation_line_director') THEN
    IF TG_OP = 'DELETE' THEN
      entity_id_text := OLD.line_item_id::text;
    ELSE
      entity_id_text := NEW.line_item_id::text;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = ANY (payload_role_table) THEN
      entity_id_text := OLD.workflow_cycle_id::text;
    ELSE
      entity_id_text := OLD.id::text;
    END IF;
  ELSE
    IF TG_TABLE_NAME = ANY (payload_role_table) THEN
      entity_id_text := NEW.workflow_cycle_id::text;
    ELSE
      entity_id_text := NEW.id::text;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'customers' THEN
    scoped_customer_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  ELSIF TG_TABLE_NAME IN ('customer_contacts', 'customer_sales_relations') THEN
    scoped_customer_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.customer_id ELSE NEW.customer_id END;
  ELSIF TG_TABLE_NAME = 'quotations' THEN
    scoped_quotation_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
    scoped_customer_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.customer_id ELSE NEW.customer_id END;
  ELSIF TG_TABLE_NAME = 'workflow_cycles' THEN
    scoped_quotation_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.quotation_id ELSE NEW.quotation_id END;
  ELSIF TG_TABLE_NAME IN (
    'quotation_customer_snapshots',
    'quotation_sales_data',
    'quotation_development_minutes',
    'quotation_executor_intake',
    'quotation_executor_consolidation',
    'quotation_accounting_data',
    'quotation_line_qa',
    'quotation_line_rnd',
    'quotation_line_director',
    'quotation_line_items',
    'quotation_tasks',
    'quotation_attachments',
    'quotation_revisions',
    'quotation_workflow_events'
  ) THEN
    scoped_quotation_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.quotation_id ELSE NEW.quotation_id END;
  END IF;

  IF scoped_quotation_id IS NOT NULL AND scoped_customer_id IS NULL THEN
    SELECT q.customer_id INTO scoped_customer_id
    FROM public.quotations q
    WHERE q.id = scoped_quotation_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    semantic := CASE TG_TABLE_NAME
      WHEN 'customers' THEN 'customer.created'
      WHEN 'customer_contacts' THEN 'contact.created'
      WHEN 'customer_sales_relations' THEN 'relation.added'
      WHEN 'quotations' THEN 'quotation.created'
      WHEN 'workflow_cycles' THEN 'quotation.cycle.created'
      WHEN 'quotation_customer_snapshots' THEN 'quotation.snapshot.recorded'
      WHEN 'quotation_sales_data' THEN 'quotation.sales.updated'
      WHEN 'quotation_development_minutes' THEN 'quotation.development_minutes.updated'
      WHEN 'quotation_line_qa' THEN 'quotation.line_qa.created'
      WHEN 'quotation_line_rnd' THEN 'quotation.line_rnd.created'
      WHEN 'quotation_line_director' THEN 'quotation.line_director.created'
      WHEN 'quotation_line_items' THEN 'quotation.line_item.created'
      WHEN 'quotation_executor_intake' THEN 'quotation.executor_intake.updated'
      WHEN 'quotation_executor_consolidation' THEN 'quotation.executor_consolidation.updated'
      WHEN 'quotation_accounting_data' THEN 'quotation.accounting.updated'
      WHEN 'quotation_tasks' THEN 'quotation.task.updated'
      WHEN 'quotation_attachments' THEN 'quotation.attachment.added'
      WHEN 'quotation_revisions' THEN 'quotation.revision.recorded'
      WHEN 'quotation_workflow_events' THEN 'quotation.workflow.event'
      ELSE TG_TABLE_NAME || '.created'
    END;
  ELSIF TG_OP = 'DELETE' THEN
    semantic := CASE TG_TABLE_NAME
      WHEN 'customers' THEN 'customer.deleted'
      WHEN 'customer_contacts' THEN 'contact.deleted'
      WHEN 'customer_sales_relations' THEN 'relation.deleted'
      WHEN 'quotations' THEN 'quotation.deleted'
      WHEN 'quotation_development_minutes' THEN 'quotation.development_minutes.deleted'
      WHEN 'quotation_line_qa' THEN 'quotation.line_qa.deleted'
      WHEN 'quotation_line_rnd' THEN 'quotation.line_rnd.deleted'
      WHEN 'quotation_line_director' THEN 'quotation.line_director.deleted'
      WHEN 'quotation_line_items' THEN 'quotation.line_item.deleted'
      ELSE TG_TABLE_NAME || '.deleted'
    END;
  ELSIF TG_TABLE_NAME = 'customers' THEN
    IF OLD.status::text IS DISTINCT FROM NEW.status::text AND NEW.status::text = 'inactive' THEN
      semantic := 'customer.deactivated';
    ELSIF OLD.status::text IS DISTINCT FROM NEW.status::text AND NEW.status::text = 'active' THEN
      semantic := 'customer.activated';
    ELSE
      semantic := 'customer.updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'customer_contacts' THEN
    IF OLD.status::text IS DISTINCT FROM NEW.status::text AND NEW.status::text = 'inactive' THEN
      semantic := 'contact.deactivated';
    ELSIF OLD.is_primary IS DISTINCT FROM NEW.is_primary AND NEW.is_primary THEN
      semantic := 'contact.primary_changed';
    ELSE
      semantic := 'contact.updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'customer_sales_relations' THEN
    IF OLD.status::text IS DISTINCT FROM NEW.status::text AND NEW.status::text = 'inactive' THEN
      semantic := 'relation.removed';
    ELSE
      semantic := 'relation.updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'quotations' THEN
    IF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status
       AND NEW.workflow_status = 'cancelled' THEN
      semantic := 'quotation.cancelled';
    ELSIF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status THEN
      semantic := 'quotation.status_changed';
    ELSIF OLD.business_outcome IS DISTINCT FROM NEW.business_outcome THEN
      semantic := 'quotation.outcome_changed';
    ELSE
      semantic := 'quotation.updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'workflow_cycles' THEN
    semantic := 'quotation.cycle.updated';
  ELSIF TG_TABLE_NAME = 'quotation_sales_data' THEN
    semantic := 'quotation.sales.updated';
  ELSIF TG_TABLE_NAME = 'quotation_development_minutes' THEN
    semantic := 'quotation.development_minutes.updated';
  ELSIF TG_TABLE_NAME = 'quotation_line_qa' THEN
    semantic := 'quotation.line_qa.updated';
  ELSIF TG_TABLE_NAME = 'quotation_line_rnd' THEN
    semantic := 'quotation.line_rnd.updated';
  ELSIF TG_TABLE_NAME = 'quotation_line_director' THEN
    semantic := 'quotation.line_director.updated';
  ELSIF TG_TABLE_NAME = 'quotation_line_items' THEN
    semantic := 'quotation.line_item.updated';
  ELSIF TG_TABLE_NAME = 'quotation_executor_intake' THEN
    semantic := 'quotation.executor_intake.updated';
  ELSIF TG_TABLE_NAME = 'quotation_executor_consolidation' THEN
    semantic := 'quotation.executor_consolidation.updated';
  ELSIF TG_TABLE_NAME = 'quotation_accounting_data' THEN
    semantic := 'quotation.accounting.updated';
  ELSIF TG_TABLE_NAME = 'quotation_tasks' THEN
    IF OLD.task_status IS DISTINCT FROM NEW.task_status
       AND NEW.task_status = 'completed' THEN
      semantic := 'quotation.task.completed';
    ELSE
      semantic := 'quotation.task.updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'quotation_attachments' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      semantic := 'quotation.attachment.removed';
    ELSE
      semantic := 'quotation.attachment.updated';
    END IF;
  ELSE
    semantic := TG_TABLE_NAME || '.updated';
  END IF;

  INSERT INTO public.audit_events (
    actor_username,
    actor_role,
    request_id,
    schema_name,
    table_name,
    operation,
    entity_id,
    customer_id,
    quotation_id,
    action,
    old_data,
    new_data
  ) VALUES (
    NULLIF(current_setting('audit.actor_username', true), ''),
    NULLIF(current_setting('audit.actor_role', true), ''),
    NULLIF(current_setting('audit.request_id', true), ''),
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    TG_OP,
    entity_id_text,
    scoped_customer_id,
    scoped_quotation_id,
    semantic,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotation_line_qa_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_line_qa
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

CREATE TRIGGER quotation_line_rnd_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_line_rnd
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

CREATE TRIGGER quotation_line_director_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_line_director
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '017_line_qa_rnd_director is forward-only';
END
$$;
