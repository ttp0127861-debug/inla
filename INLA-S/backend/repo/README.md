# Dev data sheets (`backend/repo/`)

TSV files feed **Neon dev-only** seed scripts under `backend/db/seeds/dev/`. Edit in Excel or Google Sheets: save as **UTF-8 tab-separated text** (`.tsv`), same column order as the file on disk.

## Files

| File | Script | Purpose |
|------|--------|---------|
| `customers.tsv` | `npm run seed:dev` | Business customers + primary contact + active sales relation |
| `sales-label-map.json` | both seeds | Maps sheet label → Cognito sales email (lowercase) |
| `quotations.tsv` | `npm run seed:quotations:dev` | 12 quotations across workflow stages |

## Run order (dev branch)

Scripts live in **`backend/db/package.json`**. Run npm from that folder:

```powershell
cd backend\db
$env:DATABASE_URL = "<neon dev>"
npm run migrate
npm run seed:dev
npm run seed:quotations:dev
```

Validate TSV without DB:

```powershell
npm run seed:dev -- --check
npm run seed:quotations:dev -- --check
```

## Tear down

```powershell
npm run seed:quotations:dev:down
npm run seed:dev:down
```

Run **quotation down before customer down** — `quotations.customer_id` is `ON DELETE RESTRICT`.

## `quotations.tsv` columns

| Column | Required | Values |
|--------|----------|--------|
| `scenario_id` | yes | Stable id (`Q01` …) stored in `sales_note` prefix |
| `customer_name` | yes | Must match `customers.tsv` (seed:dev customers) |
| `sales_label` | yes | Key in `sales-label-map.json`; must match customer’s sales row |
| `workflow_status` | yes | `draft`, `cancelled`, `executor_intake`, `qa_rnd_review`, `executor_consolidation`, `accounting_review`, `director_review`, `approved`, `rejected` |
| `business_outcome` | if approved | `not_updated`, `lost`, `won`, `sent_to_customer`, or `-` |
| `cycle_type` | yes | `new` (only value supported in seed v1) |
| `box_type`, `length_mm`, `width_mm`, `height_mm`, `quantity_pieces` | yes | Sales carton minimum |
| `seed_flags` | no | `qa_done`, `both_active`, or `-` for `qa_rnd_review` variants |
| `notes` | no | Dev comment only (not loaded into DB) |
