# Quotation audit checklist (strict)

Apply together with customer audit in `../migrations/002_audit_platform.sql` and `../SCHEMA.md` §5.

## Platform

- [ ] Add column `audit_events.quotation_id uuid NULL`.
- [ ] Index `audit_events (quotation_id, occurred_at DESC) WHERE quotation_id IS NOT NULL`.
- [ ] Extend `audit.capture_row_change()` to set:
  - [ ] `quotation_id` for all quotation-domain tables
  - [ ] `customer_id` from `quotations.customer_id` when the row is quotation-scoped (keep customer-scoped history working)
- [ ] Document new semantic `action` values in `../SCHEMA.md` (prefix `quotation.`).

## Triggers (AFTER INSERT OR UPDATE OR DELETE)

Attach to every **mutable** quotation business table:

- [ ] `quotations`
- [ ] `workflow_cycles`
- [ ] `quotation_customer_snapshots`
- [ ] `quotation_sales_data`
- [x] `quotation_development_minutes` (`014` — `quotation.development_minutes.updated` / `.deleted`)
- [x] `quotation_line_items` (`015` — `quotation.line_item.created` / `.updated` / `.deleted`)
- [x] `quotation_line_qa` (`017` — `entity_id` = `line_item_id`; `quotation.line_qa.created` / `.updated` / `.deleted`)
- [x] `quotation_line_rnd` (`017` — `quotation.line_rnd.created` / `.updated` / `.deleted`)
- [x] `quotation_line_rnd_print_plates` (`018` — `entity_id` = `id`; `quotation.line_rnd_print_plate.created` / `.updated` / `.deleted`)
- [x] `quotation_line_director` (`017` — `quotation.line_director.created` / `.updated` / `.deleted`)
- [ ] `quotation_executor_intake`
- [ ] `quotation_executor_consolidation`
- [ ] `quotation_accounting_data`
- [ ] `quotation_tasks`
- [ ] `quotation_attachments` (include soft-delete as UPDATE if used)

## Append-only tables

- [ ] `quotation_workflow_events` — INSERT only from app; audit each INSERT; consider `BEFORE UPDATE OR DELETE` → `RAISE`.
- [ ] `quotation_revisions` — INSERT only (VER-004); audit INSERT; consider block UPDATE/DELETE.

## Application

- [ ] All quotation writes use `runWithRequestContext` (never raw `query` for DML that should audit).
- [ ] Lambdas must **not** `INSERT` into `audit_events`.
- [ ] `old_data` / `new_data` jsonb must remain sufficient for history API (Envers replacement).

## Semantic actions (minimum set — extend in SCHEMA.md)

| Trigger context | Example `action` |
|-----------------|------------------|
| quotations INSERT | `quotation.created` |
| quotations → cancelled | `quotation.cancelled` |
| quotations workflow_status change | `quotation.status_changed` |
| workflow_cycles INSERT | `quotation.cycle.created` |
| sales_data UPDATE | `quotation.sales.updated` |
| executor/accounting UPDATE | `quotation.executor_intake.updated`, `quotation.executor_consolidation.updated`, `quotation.accounting.updated` |
| development_minutes INSERT/UPDATE/DELETE | `quotation.development_minutes.updated` / `.deleted` |
| line_items INSERT/UPDATE/DELETE | `quotation.line_item.created` / `.updated` / `.deleted` |
| line_qa / line_rnd / line_director INSERT/UPDATE/DELETE | `quotation.line_qa.created` / `.updated` / `.deleted` (same pattern for `line_rnd` and `line_director`). `entity_id` is `line_item_id::text`. |
| line_rnd_print_plates INSERT/UPDATE/DELETE | `quotation.line_rnd_print_plate.created` / `.updated` / `.deleted`. `entity_id` is `id::text`. |
| task_status → completed | `quotation.task.completed` (derive in trigger when detectable) |
| attachments INSERT | `quotation.attachment.added` |
| attachments soft-remove | `quotation.attachment.removed` |
| revisions INSERT | `quotation.revision.recorded` |
| workflow_events INSERT | optional duplicate — prefer single source (app inserts event **or** trigger on status, not both) |

## Denormalization

- [ ] Prefer `quotation_id` on every child table so triggers do not need multi-table lookups in hot path.

## Verification

- [x] Migration `013_*` + `014_*` + `015_*` + `017_*` + `018_*` (line QA, R&D, print plates, and director audit; cycle QA/R&D/director tables removed from `capture_row_change()`) runs after table creation.
- [ ] No quotation table without audit trigger except explicitly documented append-only with INSERT audit only.
