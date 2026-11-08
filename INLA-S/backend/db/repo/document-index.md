# Document index → quotation schema

Sources live in **`../../document/`** (Markdown `.md` only).

| Document | Schema sections | Notes |
|----------|-----------------|--------|
| `Data_Field_Specification_Quotation_Management_MVP.md` | § columns (SAL, QA, RND, EXI, EXC, ACC, DIR, ATT, HIS, SLA) | Logical names → SQL in `quotation-schema.md` |
| `annex/Annex_BM03_Development_Minutes_MVP.md` | **`quotation_development_minutes`** | Việc B; delta `spec-deltas/2026-11-06-BM03-qa-rnd-split.md` |
| `annex/BM03-field-map.md` | QA-09…15, RND-01/02/11/05/06 | Template `templates/BM03-QT02-LTM/` |
| `spec-deltas/2026-11-06-BM03-qa-rnd-split.md` | QA columns; drop RND-03/04; `production_plan`; development_minutes | Apply to baseline `.md` |
| `annex/Annex_PRICE-FORMAT_LineItems_MVP.md` | **`quotation_line_items`**; drop EXC-04 | Template `templates/PRICE-FORMAT/` |
| `spec-deltas/2026-11-06-PRICE-FORMAT-line-items.md` | LIN-*; EXC-01 per line | DB: **`015_quotation_line_items.sql`** applied; merge into baseline `.md` |
| `Business_Rules_Quotation_Management_MVP.md` | §6 app rules; QUO, ATT, VER, CLN, RES | |
| `Customer_Management_Specification_Quotation_Management_MVP.md` | FK customer/contact; snapshot | |
| `Workflow_State_Machine_Quotation_Management_MVP.md` | **`workflow_status_enum`** | Required read for enum |
| `SLA_Alert_Specification_Quotation_Management_MVP.md` | `quotation_tasks` SLA | |
| `Role_Permission_Matrix_Quotation_Management_MVP.md` | §6 | Auth not in DB |
| `Open_Questions_Assumptions_Quotation_Management_MVP.md` | OQ-QUO-* | Overrides in `quotation-schema.md` |
| `Requirement_Summary_Quotation_Management_MVP.md` | Scope | |
| `MVP_Feature_List_Quotation_Management.md` | Features | |
| `Screen_Inventory_Quotation_Management_MVP.md` | UI | Not schema authority |
| `UI_Workflow_Quotation_Management_MVP.md` | UI | |

## INLA-S stack overrides (document vs implementation)

| Document says | INLA-S decision |
|---------------|-----------------|
| VER-002 Hibernate Envers | **Postgres** `audit_events` + triggers + `quotation_revisions` |
| DF-OPEN-08 / OQ-QUO-01 quotation code OPEN | **`BG-` + 6 digits** |
| Line items (historical MVP text) | **See annex PRICE-FORMAT** — `quotation_line_items` |
| Similar quotations (SIM-*) | Query-time only |
