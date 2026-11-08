-- Up Migration
-- Customer UI MVP (2026-11-08): CHECK tax_id / phone; one active primary contact; phone list index.

-- ---------------------------------------------------------------------------
-- Pre-check existing rows (fail fast with counts before adding constraints)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  bad_tax bigint;
  bad_cust_phone bigint;
  bad_contact_phone bigint;
  bad_primary bigint;
BEGIN
  SELECT count(*) INTO bad_tax
  FROM public.customers
  WHERE tax_id !~ '^\d{10}$' AND tax_id !~ '^\d{13}$';

  SELECT count(*) INTO bad_cust_phone
  FROM public.customers
  WHERE phone !~ '^\+84\d{8,11}$';

  SELECT count(*) INTO bad_contact_phone
  FROM public.customer_contacts
  WHERE phone !~ '^\+84\d{8,11}$';

  SELECT count(*) INTO bad_primary
  FROM (
    SELECT customer_id, count(*)::int AS n
    FROM public.customer_contacts
    WHERE is_primary AND status = 'active'
    GROUP BY customer_id
    HAVING count(*) > 1
  ) dup;

  IF bad_tax > 0 THEN
    RAISE EXCEPTION '019: % customer row(s) violate tax_id format (10 or 13 digits)', bad_tax;
  END IF;
  IF bad_cust_phone > 0 THEN
    RAISE EXCEPTION '019: % customer row(s) violate phone format (+84 + 8–11 digits)', bad_cust_phone;
  END IF;
  IF bad_contact_phone > 0 THEN
    RAISE EXCEPTION '019: % contact row(s) violate phone format (+84 + 8–11 digits)', bad_contact_phone;
  END IF;
  IF bad_primary > 0 THEN
    RAISE EXCEPTION '019: % customer(s) have more than one active primary contact', bad_primary;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- customers — CUS-04 / CUS-05
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD CONSTRAINT customers_tax_id_mvp_chk
    CHECK (tax_id ~ '^\d{10}$' OR tax_id ~ '^\d{13}$'),
  ADD CONSTRAINT customers_phone_mvp_chk
    CHECK (phone ~ '^\+84\d{8,11}$');

CREATE INDEX customers_phone_idx
  ON public.customers (phone);

-- pg_trgm is not enabled in this stack; equality / prefix search only until extension is added.

-- ---------------------------------------------------------------------------
-- customer_contacts — CON-05; CON-R01 partial unique
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_contacts
  ADD CONSTRAINT customer_contacts_phone_mvp_chk
    CHECK (phone ~ '^\+84\d{8,11}$');

CREATE UNIQUE INDEX customer_contacts_one_active_primary_uniq
  ON public.customer_contacts (customer_id)
  WHERE is_primary = true AND status = 'active'::public.entity_status_enum;

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '019_customer_mvp_validation is forward-only';
END
$$;
