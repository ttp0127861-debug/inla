-- Up Migration
-- Audit triggers for quotation tables are added in 013_audit_quotation.sql.

CREATE SEQUENCE public.quotation_code_seq AS integer START 1 INCREMENT 1;

CREATE FUNCTION public.next_quotation_code() RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, public
AS $$
  SELECT 'BG-' || CASE
    WHEN n <= 999999 THEN lpad(n::text, 6, '0')
    ELSE n::text
  END
  FROM (SELECT nextval('public.quotation_code_seq') AS n) AS drawn;
$$;

CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_quotation_code(),
  sales_owner_username text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES public.customer_contacts (id) ON DELETE RESTRICT,
  cloned_from_quotation_id uuid REFERENCES public.quotations (id) ON DELETE RESTRICT,
  workflow_status public.workflow_status_enum NOT NULL DEFAULT 'draft',
  business_outcome public.business_outcome_enum NOT NULL DEFAULT 'not_updated',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  updated_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  CONSTRAINT quotations_sales_owner_username_lower
    CHECK (sales_owner_username = lower(sales_owner_username))
);

CREATE INDEX quotations_sales_owner_updated_at_idx
  ON public.quotations (sales_owner_username, updated_at DESC);

CREATE INDEX quotations_customer_created_at_idx
  ON public.quotations (customer_id, created_at DESC);

CREATE INDEX quotations_workflow_status_idx
  ON public.quotations (workflow_status);

CREATE TRIGGER quotations_touch_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '008_quotations_core is forward-only';
END
$$;
