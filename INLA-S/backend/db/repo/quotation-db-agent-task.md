# DB agent task — Quotation schema

You are the specialist in `backend/db/`. Follow `../.cursor/rules/db.mdc`.

## Read first

1. `../SCHEMA.md` (customer + audit §5)
2. `quotation-schema.md` (this folder)
3. `quotation-audit-checklist.md`
4. `document-index.md` → open docx under `document/` as needed

## Goal

Produce an updated **`../SCHEMA.md`** that includes the quotation domain and a **migration plan** (`007+`). Implement migrations **only after user Phuong approves** the plan.

## Deliverables (in order)

1. **SCHEMA.md update**
   - Retitle scope: Customer + Quotation + shared audit.
   - Insert quotation sections from `quotation-schema.md` (refine enums from Workflow State Machine docx).
   - Extend audit §5 with quotation tables and semantic actions.
   - Update migration file table (§7).
   - Remove quotation from “out of scope” where obsolete.

2. **Migration plan** (in chat or `repo/` only if user asks — do not commit plan-only files unless requested)
   - File names `007` … `013` (or merged files with justification).
   - FK order: `quotations` → `workflow_cycles` → `current_cycle_id` → payload tables.
   - One migration dedicated to audit extension (recommended).

3. **Open technical choices** (bullet list)
   - VND: `numeric(18,2)` vs `bigint` minor units
   - Attachment delete: soft `deleted_at` vs hard DELETE
   - Who inserts `quotation_workflow_events` (app-only vs trigger on status change)
   - Exact `workflow_status_enum` values after docx review

4. **Stop** — no new files under `../migrations/` until explicit user approval.

## After approval (follow-up task)

- Add forward-only SQL migrations.
- Extend `audit.capture_row_change()` in same change set as quotation tables (or immediately after).
- Note in commit/PR: `DATABASE_URL=... npm run migrate` from `backend/db`.

## Forbidden

- `backend/customer/`, `terraform/`, `frontend/`
- Hard-coded `DATABASE_URL`
- Inventing workflow states not in State Machine doc + approved draft

## Optional one-liner for user chat

> DB agent: đọc `backend/db/repo/`, cập nhật `SCHEMA.md` + migration plan cho quotation; chưa tạo migration cho đến khi tôi approve.
