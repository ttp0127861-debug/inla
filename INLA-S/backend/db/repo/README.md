# DB repo — reference for the DB agent

This folder holds **authoritative drafts and instructions** that are not migrations. The live contract after approval is **`../SCHEMA.md`** plus files under **`../migrations/`**.

## When to read this

- **Quotation domain:** start here before changing `SCHEMA.md` or creating migrations.
- **Customer domain:** use **`../SCHEMA.md`** only (already applied through `006_*`).

## Files

| File | Purpose |
|------|---------|
| [`quotation-schema.md`](./quotation-schema.md) | Quotation model draft from `document/` (fields, tables, enums, audit). **Merge into `SCHEMA.md` after user approve.** |
| [`quotation-audit-checklist.md`](./quotation-audit-checklist.md) | Non-negotiable audit extensions for quotation tables. |
| [`quotation-db-agent-task.md`](./quotation-db-agent-task.md) | Step-by-step task, deliverables, and stop gate before `migrations/`. |
| [`document-index.md`](./document-index.md) | Which docx under `document/` maps to which schema section. |

## Product docs (outside this folder)

Path from repo root: `INLA-S/document/`. Quick text index: `document/_extract_customer.txt` (do not prefer extract over docx when they conflict).

## Workflow

1. Read `quotation-schema.md` + `quotation-audit-checklist.md`.
2. Read docx listed in `document-index.md` (especially Workflow State Machine + SLA).
3. Update **`../SCHEMA.md`** and publish a **migration plan** in your reply.
4. **Wait for user approve** — then add `007_*.sql` and following under **`../migrations/`**.
5. Do not run migrate as a gate unless the user asks; document the command in `../README.md` if needed.

## Rules

Follow `../.cursor/rules/db.mdc`. Do not edit `backend/customer`, `terraform/`, or `frontend/` from the DB agent role.
