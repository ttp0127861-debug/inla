-- Up Migration

CREATE TABLE public.quotation_customer_snapshots (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  customer_type public.customer_type_enum NOT NULL,
  customer_code text NOT NULL,
  customer_name text NOT NULL,
  tax_id text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address_line text NOT NULL,
  province text NOT NULL,
  contact_id uuid,
  contact_full_name text,
  contact_email text,
  contact_phone text,
  contact_job_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quotation_customer_snapshots_quotation_id_idx
  ON public.quotation_customer_snapshots (quotation_id);

CREATE TABLE public.quotation_sales_data (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  sales_note text,
  box_type text,
  length_mm numeric(18, 2),
  width_mm numeric(18, 2),
  height_mm numeric(18, 2),
  dimension_type public.dimension_type_enum,
  material text,
  layer_count integer,
  flute_type text,
  product_load_kg numeric(18, 2),
  printing_description text,
  print_color_count integer,
  print_side_count integer,
  quantity_pieces integer,
  delivery_location text,
  desired_delivery_time text,
  additional_requirements text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quotation_sales_data_quotation_id_idx
  ON public.quotation_sales_data (quotation_id);

CREATE TRIGGER quotation_sales_data_touch_updated_at
  BEFORE UPDATE ON public.quotation_sales_data
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.quotation_qa_data (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  quality_assessment_result text,
  quality_requirements text,
  qa_note text
);

CREATE INDEX quotation_qa_data_quotation_id_idx
  ON public.quotation_qa_data (quotation_id);

CREATE TABLE public.quotation_rnd_data (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  printing_plate_cost numeric(18, 2) NOT NULL DEFAULT 0,
  die_cost numeric(18, 2) NOT NULL DEFAULT 0,
  expected_plate_order_date date,
  expected_die_order_date date,
  rnd_note text
);

CREATE INDEX quotation_rnd_data_quotation_id_idx
  ON public.quotation_rnd_data (quotation_id);

CREATE TABLE public.quotation_executor_intake (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  intake_note text
);

CREATE INDEX quotation_executor_intake_quotation_id_idx
  ON public.quotation_executor_intake (quotation_id);

CREATE TABLE public.quotation_executor_consolidation (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  unit_price_per_piece numeric(18, 2),
  production_lead_time text,
  delivery_terms text,
  consolidation_note text
);

CREATE INDEX quotation_executor_consolidation_quotation_id_idx
  ON public.quotation_executor_consolidation (quotation_id);

CREATE TABLE public.quotation_accounting_data (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  payment_terms text,
  vat_rate numeric(18, 2) NOT NULL DEFAULT 10,
  financial_adjustment text,
  final_quotation_value numeric(18, 2),
  accounting_note text
);

CREATE INDEX quotation_accounting_data_quotation_id_idx
  ON public.quotation_accounting_data (quotation_id);

CREATE TABLE public.quotation_director_data (
  workflow_cycle_id uuid PRIMARY KEY REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  director_decision public.director_decision_enum,
  approval_note text,
  rejection_reason text,
  decision_at timestamptz
);

CREATE INDEX quotation_director_data_quotation_id_idx
  ON public.quotation_director_data (quotation_id);

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '010_quotation_cycle_payload is forward-only';
END
$$;
