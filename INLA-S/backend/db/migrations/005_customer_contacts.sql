-- Up Migration

CREATE TABLE public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  job_title text,
  department text,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  is_primary boolean NOT NULL DEFAULT false,
  status public.entity_status_enum NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_contacts_customer_id_idx
  ON public.customer_contacts (customer_id);

CREATE INDEX customer_contacts_customer_id_status_idx
  ON public.customer_contacts (customer_id, status);

CREATE TRIGGER customer_contacts_touch_updated_at
  BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER customer_contacts_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '005_customer_contacts is forward-only';
END
$$;
