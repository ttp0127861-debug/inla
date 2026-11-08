-- Up Migration
-- BM03 development minutes + QA-09..15 + RND-11; drop RND-03/04 date columns.

ALTER TABLE public.quotation_qa_data
  ADD COLUMN burst_standard text,
  ADD COLUMN compression_standard text,
  ADD COLUMN weight_limit_standard text,
  ADD COLUMN kcg_standard text,
  ADD COLUMN kcg_qa_sx_proposal_1 text,
  ADD COLUMN kcg_qa_sx_proposal_2 text,
  ADD COLUMN kcg_qa_sx_proposal_3 text;

ALTER TABLE public.quotation_rnd_data
  ADD COLUMN production_plan text;

ALTER TABLE public.quotation_rnd_data
  DROP COLUMN expected_plate_order_date,
  DROP COLUMN expected_die_order_date;

CREATE TABLE public.quotation_development_minutes (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  meeting_place text,
  meeting_date date,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quotation_development_minutes_quotation_id_idx
  ON public.quotation_development_minutes (quotation_id);

CREATE TRIGGER quotation_development_minutes_touch_updated_at
  BEFORE UPDATE ON public.quotation_development_minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

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
    'quotation_qa_data',
    'quotation_rnd_data',
    'quotation_development_minutes',
    'quotation_executor_intake',
    'quotation_executor_consolidation',
    'quotation_accounting_data',
    'quotation_director_data'
  ];
BEGIN
  IF TG_OP = 'DELETE' THEN
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
    'quotation_qa_data',
    'quotation_rnd_data',
    'quotation_development_minutes',
    'quotation_executor_intake',
    'quotation_executor_consolidation',
    'quotation_accounting_data',
    'quotation_director_data',
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
      WHEN 'quotation_qa_data' THEN 'quotation.qa.updated'
      WHEN 'quotation_rnd_data' THEN 'quotation.rnd.updated'
      WHEN 'quotation_development_minutes' THEN 'quotation.development_minutes.updated'
      WHEN 'quotation_executor_intake' THEN 'quotation.executor_intake.updated'
      WHEN 'quotation_executor_consolidation' THEN 'quotation.executor_consolidation.updated'
      WHEN 'quotation_accounting_data' THEN 'quotation.accounting.updated'
      WHEN 'quotation_director_data' THEN 'quotation.director.updated'
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
  ELSIF TG_TABLE_NAME = 'quotation_qa_data' THEN
    semantic := 'quotation.qa.updated';
  ELSIF TG_TABLE_NAME = 'quotation_rnd_data' THEN
    semantic := 'quotation.rnd.updated';
  ELSIF TG_TABLE_NAME = 'quotation_development_minutes' THEN
    semantic := 'quotation.development_minutes.updated';
  ELSIF TG_TABLE_NAME = 'quotation_executor_intake' THEN
    semantic := 'quotation.executor_intake.updated';
  ELSIF TG_TABLE_NAME = 'quotation_executor_consolidation' THEN
    semantic := 'quotation.executor_consolidation.updated';
  ELSIF TG_TABLE_NAME = 'quotation_accounting_data' THEN
    semantic := 'quotation.accounting.updated';
  ELSIF TG_TABLE_NAME = 'quotation_director_data' THEN
    semantic := 'quotation.director.updated';
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

CREATE TRIGGER quotation_development_minutes_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_development_minutes
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '014_bm03_qa_rnd_development_minutes is forward-only';
END
$$;
