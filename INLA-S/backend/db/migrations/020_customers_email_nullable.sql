-- Up Migration
-- CUS-06: company email optional on customers; contacts.email stays NOT NULL.

UPDATE public.customers
SET email = NULL
WHERE email = '';

ALTER TABLE public.customers
  ALTER COLUMN email DROP NOT NULL;

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '020_customers_email_nullable is forward-only';
END
$$;
