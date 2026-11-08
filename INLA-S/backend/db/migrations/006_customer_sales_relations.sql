-- Up Migration

CREATE TABLE public.customer_sales_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  sales_username text NOT NULL,
  status public.relation_status_enum NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  ended_at timestamptz,
  ended_by text,
  CONSTRAINT customer_sales_relations_sales_username_lower
    CHECK (sales_username = lower(sales_username))
);

CREATE UNIQUE INDEX customer_sales_relations_one_active_idx
  ON public.customer_sales_relations (customer_id, sales_username)
  WHERE status = 'active'::public.relation_status_enum;

CREATE INDEX customer_sales_relations_active_sales_idx
  ON public.customer_sales_relations (sales_username)
  WHERE status = 'active'::public.relation_status_enum;

CREATE TRIGGER customer_sales_relations_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_sales_relations
  FOR EACH ROW
  EXECUTE FUNCTION audit.capture_row_change();

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '006_customer_sales_relations is forward-only';
END
$$;
