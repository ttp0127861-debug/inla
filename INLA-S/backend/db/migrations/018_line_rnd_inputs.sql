-- Up Migration
-- Per-line R&D technical fields on quotation_line_rnd; print plates P1–P7 child table;
-- backfill from quotation_development_minutes.payload; audit print plates.

-- ---------------------------------------------------------------------------
-- quotation_line_rnd — technical / layout fields (per SKU)
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotation_line_rnd
  ADD COLUMN layout_code text,
  ADD COLUMN die_code text,
  ADD COLUMN layout_quote_code text,
  ADD COLUMN die_quote_code text,
  ADD COLUMN flute_kind text,
  ADD COLUMN creasing text,
  ADD COLUMN sheet_size text,
  ADD COLUMN flute_other text,
  ADD COLUMN print_other_notes text,
  ADD COLUMN finish_glue text,
  ADD COLUMN finish_staple text,
  ADD COLUMN finish_die_cut text,
  ADD COLUMN film_lamination text,
  ADD COLUMN bundling_method text,
  ADD COLUMN pallet_notes text;

-- ---------------------------------------------------------------------------
-- quotation_line_rnd_print_plates — P1…P7 per line
-- ---------------------------------------------------------------------------
CREATE TABLE public.quotation_line_rnd_print_plates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id uuid NOT NULL,
  workflow_cycle_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  plate_no integer NOT NULL,
  color_system text,
  formula_composition text,
  quota text,
  trame text,
  anilox text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotation_line_rnd_print_plates_plate_no_chk
    CHECK (plate_no >= 1 AND plate_no <= 7),
  CONSTRAINT quotation_line_rnd_print_plates_line_plate_uniq
    UNIQUE (line_item_id, plate_no),
  CONSTRAINT quotation_line_rnd_print_plates_li_cycle_quotation_fk
    FOREIGN KEY (line_item_id, workflow_cycle_id, quotation_id)
    REFERENCES public.quotation_line_items (id, workflow_cycle_id, quotation_id)
    ON DELETE RESTRICT
);

CREATE INDEX quotation_line_rnd_print_plates_quotation_id_idx
  ON public.quotation_line_rnd_print_plates (quotation_id);

CREATE TRIGGER quotation_line_rnd_print_plates_touch_updated_at
  BEFORE UPDATE ON public.quotation_line_rnd_print_plates
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Backfill: seven plate rows per existing line; copy cycle payload onto each line
-- ---------------------------------------------------------------------------
INSERT INTO public.quotation_line_rnd_print_plates (
  line_item_id,
  workflow_cycle_id,
  quotation_id,
  plate_no
)
SELECT
  li.id,
  li.workflow_cycle_id,
  li.quotation_id,
  gs.plate_no
FROM public.quotation_line_items li
CROSS JOIN generate_series(1, 7) AS gs(plate_no)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quotation_line_rnd_print_plates p
  WHERE p.line_item_id = li.id
    AND p.plate_no = gs.plate_no
);

UPDATE public.quotation_line_rnd rnd
SET
  flute_kind = src.payload->>'fluteKind',
  creasing = src.payload->>'creasing',
  sheet_size = src.payload->>'sheetSize',
  flute_other = src.payload->>'fluteOther',
  print_other_notes = src.payload->>'otherNotes',
  finish_glue = src.payload->>'finishGlue',
  finish_staple = src.payload->>'finishStaple',
  finish_die_cut = src.payload->>'finishDieCut',
  film_lamination = src.payload->>'filmLamination',
  bundling_method = src.payload->>'bundlingMethod',
  pallet_notes = src.payload->>'palletNotes'
FROM public.quotation_line_items li
JOIN public.quotation_development_minutes src
  ON src.workflow_cycle_id = li.workflow_cycle_id
WHERE rnd.line_item_id = li.id
  AND src.payload IS NOT NULL
  AND src.payload <> '{}'::jsonb;

UPDATE public.quotation_line_rnd_print_plates AS p
SET
  color_system = mapped.color_system,
  formula_composition = mapped.formula_composition,
  quota = mapped.quota,
  trame = mapped.trame,
  anilox = mapped.anilox
FROM (
  SELECT
    p2.id AS plate_id,
    arr.elem->>'colorSystem' AS color_system,
    arr.elem->>'formulaComposition' AS formula_composition,
    arr.elem->>'quota' AS quota,
    arr.elem->>'trame' AS trame,
    arr.elem->>'anilox' AS anilox
  FROM public.quotation_line_rnd_print_plates p2
  INNER JOIN public.quotation_line_items li ON li.id = p2.line_item_id
  INNER JOIN public.quotation_development_minutes dm ON dm.workflow_cycle_id = li.workflow_cycle_id
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN dm.payload ? 'printPlates'
        AND jsonb_typeof(dm.payload->'printPlates') = 'array'
      THEN dm.payload->'printPlates'
      ELSE '[]'::jsonb
    END
  ) AS arr(elem)
  WHERE (arr.elem->>'plateNo') ~ '^[0-9]+$'
    AND (arr.elem->>'plateNo')::int = p2.plate_no
) AS mapped
WHERE p.id = mapped.plate_id;

UPDATE public.quotation_development_minutes
SET payload = payload
  - 'fluteKind'
  - 'creasing'
  - 'sheetSize'
  - 'fluteOther'
  - 'otherNotes'
  - 'finishGlue'
  - 'finishStaple'
  - 'finishDieCut'
  - 'filmLamination'
  - 'bundlingMethod'
  - 'palletNotes'
  - 'printPlates';

DO $$
DECLARE
  line_count bigint;
  plate_count bigint;
BEGIN
  SELECT count(*) INTO line_count FROM public.quotation_line_items;
  SELECT count(*) INTO plate_count FROM public.quotation_line_rnd_print_plates;
  IF line_count > 0 AND plate_count <> line_count * 7 THEN
    RAISE EXCEPTION
      '018 backfill expected 7 print-plate rows per line (lines %, plates %)',
      line_count, plate_count;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Audit: replace capture_row_change (from 017); attach print-plate trigger
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
    'quotation_line_rnd_print_plates',
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
      WHEN 'quotation_line_rnd_print_plates' THEN 'quotation.line_rnd_print_plate.created'
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
      WHEN 'quotation_line_rnd_print_plates' THEN 'quotation.line_rnd_print_plate.deleted'
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
  ELSIF TG_TABLE_NAME = 'quotation_line_rnd_print_plates' THEN
    semantic := 'quotation.line_rnd_print_plate.updated';
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

CREATE TRIGGER quotation_line_rnd_print_plates_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_line_rnd_print_plates
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '018_line_rnd_inputs is forward-only';
END
$$;
