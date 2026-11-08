-- Up Migration

CREATE TYPE public.workflow_status_enum AS ENUM (
  'draft',
  'cancelled',
  'executor_intake',
  'qa_rnd_review',
  'executor_consolidation',
  'accounting_review',
  'director_review',
  'approved',
  'rejected'
);

CREATE TYPE public.business_outcome_enum AS ENUM (
  'not_updated',
  'sent_to_customer',
  'won',
  'lost'
);

CREATE TYPE public.cycle_type_enum AS ENUM ('new', 're_submit');

CREATE TYPE public.task_type_enum AS ENUM (
  'executor_intake',
  'qa_review',
  'rnd_review',
  'executor_consolidation',
  'accounting_review',
  'director_review'
);

CREATE TYPE public.task_status_enum AS ENUM (
  'pending',
  'in_progress',
  'completed'
);

CREATE TYPE public.dimension_type_enum AS ENUM ('inner', 'outer');

CREATE TYPE public.sla_alert_state_enum AS ENUM (
  'normal',
  'warning',
  'overdue'
);

CREATE TYPE public.director_decision_enum AS ENUM ('approved', 'rejected');

CREATE TYPE public.attachment_section_enum AS ENUM (
  'sales',
  'qa',
  'rnd',
  'executor_intake',
  'executor_consolidation',
  'accounting'
);

CREATE TYPE public.workflow_action_type_enum AS ENUM (
  'submit',
  'cancel',
  'task_start',
  'task_complete',
  'approve',
  'reject',
  'outcome_update',
  'resubmit_open',
  'clone'
);

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '007_quotation_enums is forward-only';
END
$$;
