-- Up Migration
-- created_by and updated_by are set by the customer Lambda, not by these triggers.

CREATE SEQUENCE public.customer_code_seq AS integer START 1 INCREMENT 1;

CREATE FUNCTION public.next_customer_code() RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, public
AS $$
  SELECT 'KH-' || CASE
    WHEN n <= 999999 THEN lpad(n::text, 6, '0')
    ELSE n::text
  END
  FROM (SELECT nextval('public.customer_code_seq') AS n) AS drawn;
$$;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_customer_code(),
  customer_type public.customer_type_enum NOT NULL,
  name text NOT NULL,
  short_name text,
  tax_id text NOT NULL UNIQUE,
  phone text NOT NULL,
  email text NOT NULL,
  address_line text NOT NULL,
  province text NOT NULL,
  website text,
  notes text,
  status public.entity_status_enum NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  updated_by text
);

CREATE INDEX customers_status_updated_at_idx
  ON public.customers (status, updated_at DESC);

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_touch_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER customers_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '004_customers_core is forward-only';
END
$$;
