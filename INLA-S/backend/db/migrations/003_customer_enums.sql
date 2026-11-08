-- Up Migration

CREATE TYPE public.customer_type_enum AS ENUM ('business', 'individual');

CREATE TYPE public.entity_status_enum AS ENUM ('active', 'inactive');

CREATE TYPE public.relation_status_enum AS ENUM ('active', 'inactive');

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '003_customer_enums is forward-only';
END
$$;
