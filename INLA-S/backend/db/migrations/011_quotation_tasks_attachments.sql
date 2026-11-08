-- Up Migration

CREATE TABLE public.quotation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  task_type public.task_type_enum NOT NULL,
  task_status public.task_status_enum NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  sla_started_at timestamptz,
  sla_deadline_at timestamptz,
  sla_completed_at timestamptz,
  sla_duration_hours numeric(10, 2),
  sla_alert_state public.sla_alert_state_enum NOT NULL DEFAULT 'normal',
  CONSTRAINT quotation_tasks_cycle_task_type_key UNIQUE (cycle_id, task_type)
);

CREATE INDEX quotation_tasks_quotation_id_idx
  ON public.quotation_tasks (quotation_id);

CREATE INDEX quotation_tasks_cycle_id_idx
  ON public.quotation_tasks (cycle_id);

CREATE TABLE public.quotation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations (id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.workflow_cycles (id) ON DELETE RESTRICT,
  section public.attachment_section_enum NOT NULL,
  file_name text NOT NULL,
  file_extension text,
  mime_type text,
  file_size_bytes bigint NOT NULL,
  storage_key text NOT NULL,
  uploaded_by text NOT NULL,
  uploaded_by_role text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  source_attachment_id uuid REFERENCES public.quotation_attachments (id) ON DELETE RESTRICT,
  deleted_at timestamptz
);

CREATE INDEX quotation_attachments_cycle_section_role_idx
  ON public.quotation_attachments (cycle_id, section, uploaded_by_role);

CREATE INDEX quotation_attachments_quotation_id_idx
  ON public.quotation_attachments (quotation_id);

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '011_quotation_tasks_attachments is forward-only';
END
$$;
