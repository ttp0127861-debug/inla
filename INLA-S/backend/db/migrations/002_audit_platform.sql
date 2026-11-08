-- Up Migration
-- Apply from backend/db: DATABASE_URL=... npm run migrate

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE public.audit_events (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_username text,
  actor_role text,
  request_id text,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  entity_id text NOT NULL,
  customer_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb
);

CREATE INDEX audit_events_customer_occurred_at_idx
  ON public.audit_events (customer_id, occurred_at DESC)
  WHERE customer_id IS NOT NULL;

CREATE INDEX audit_events_table_entity_occurred_at_idx
  ON public.audit_events (table_name, entity_id, occurred_at DESC);

CREATE FUNCTION audit.capture_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  row_id uuid;
  scoped_customer_id uuid;
  semantic text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    row_id := OLD.id;
  ELSE
    row_id := NEW.id;
  END IF;

  IF TG_TABLE_NAME = 'customers' THEN
    scoped_customer_id := row_id;
  ELSIF TG_TABLE_NAME IN ('customer_contacts', 'customer_sales_relations') THEN
    IF TG_OP = 'DELETE' THEN
      scoped_customer_id := OLD.customer_id;
    ELSE
      scoped_customer_id := NEW.customer_id;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    semantic := CASE TG_TABLE_NAME
      WHEN 'customers' THEN 'customer.created'
      WHEN 'customer_contacts' THEN 'contact.created'
      WHEN 'customer_sales_relations' THEN 'relation.added'
      ELSE TG_TABLE_NAME || '.created'
    END;
  ELSIF TG_OP = 'DELETE' THEN
    semantic := CASE TG_TABLE_NAME
      WHEN 'customers' THEN 'customer.deleted'
      WHEN 'customer_contacts' THEN 'contact.deleted'
      WHEN 'customer_sales_relations' THEN 'relation.deleted'
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
    row_id::text,
    scoped_customer_id,
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

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '002_audit_platform is forward-only';
END
$$;
