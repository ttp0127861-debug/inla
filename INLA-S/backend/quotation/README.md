# INLA-S Quotation Lambda

Node.js ≥ 20 (CommonJS) Lambda for quotation MVP (workflow, tasks, role payloads, attachments, history). Database via [`inla-s-db`](../db).

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres (same as `backend/db` migrations). |
| `ATTACHMENTS_BUCKET` | For uploads | S3 bucket for presigned PUT (`presign` / `confirm`). |
| `AWS_REGION` | For uploads | e.g. `ap-southeast-1` (default in code if unset). |
| `ATTACHMENTS_ENABLED` | No | Set `true` to enforce ATT-009–011 minimum attachments on QA/R&D/consolidation **complete**. |

Presign/confirm return **500** with a clear message if `ATTACHMENTS_BUCKET` is missing.

## Setup

```bash
cd backend/quotation
npm install
```

Run migrations from `backend/db` first (includes `015_quotation_line_items` for PRICE-FORMAT line items).

## Line items (PRICE-FORMAT)

- Detail includes `lineItems[]` for the current cycle (LIN-01…09).
- Sales draft `PUT /quotations/{code}` accepts `lineItems` as a **full replace** when the field is present (ignored: `unitPrice`).
- Submit requires ≥ 1 valid line (LIN-02…06, LIN-08). Consolidation `PUT …/executor/consolidation` patches per-line `unitPrice` / `lineRemark`; complete consolidation requires LIN-07 on every line. EXC-04 (`productionLeadTime`) and single-row `unitPricePerPiece` are removed.

## Local invoke

```bash
set DATABASE_URL=postgresql://...
node -e "require('./src/index').handler({ routeKey:'GET /quotations', queryStringParameters:{}, requestContext:{ requestId:'local', authorizer:{ jwt:{ claims:{ 'cognito:groups':'EXECUTOR', email:'exec@example.com' } } } } }).then(r=>console.log(r.statusCode))"
```

## Packaging

`deploy-quotation-api.bat` in this folder packages this Lambda and applies `terraform/api`. All API modules: `backend/deploy-api.bat`.

```bash
npm ci --omit=dev
```

Zip `src/`, `node_modules/`, and `package.json`.

## Verification

See [`scripts/smoke-quotation-pr1.ps1`](scripts/smoke-quotation-pr1.ps1) for a PR1 checklist (manual steps against a deployed or local API).

## API spec

[`openapi.yaml`](./openapi.yaml)

After changing `openapi.yaml`, run from the Git repo root: `INLA-S/scripts/sync-contract.ps1` (Terraform outputs appended to `contracts/` for frontend).

## QA / R&D per line

- `GET /quotations/{code}` includes `qaData.qaLineData` and `rndData.rndLineData` (arrays; may be `[]`).
- `PUT /quotations/{code}/qa` and `…/rnd` require **full** `qaLineData` / `rndLineData` arrays matching current `lineItems` (see OpenAPI `QaDataPut` / `RndDataPut`).
- DB migration **016** (`qa_line_data`, `rnd_line_data` JSONB) — run from `backend/db`.

## routeKey map (Terraform / HTTP API v2)

| Method | Path | `routeKey` |
|--------|------|------------|
| GET | /tasks | `GET /tasks` |
| GET | /quotations | `GET /quotations` |
| POST | /quotations | `POST /quotations` |
| GET | /quotations/{code} | `GET /quotations/{code}` |
| PUT | /quotations/{code} | `PUT /quotations/{code}` |
| POST | /quotations/{code}/cancel | `POST /quotations/{code}/cancel` |
| POST | /quotations/{code}/submit | `POST /quotations/{code}/submit` |
| POST | /quotations/{code}/resubmit/prepare | `POST /quotations/{code}/resubmit/prepare` |
| POST | /quotations/{code}/resubmit/submit | `POST /quotations/{code}/resubmit/submit` |
| POST | /quotations/{code}/clone | `POST /quotations/{code}/clone` |
| PATCH | /quotations/{code}/business-outcome | `PATCH /quotations/{code}/business-outcome` |
| POST | /quotations/{code}/tasks/{taskType}/start | `POST /quotations/{code}/tasks/{taskType}/start` |
| POST | /quotations/{code}/tasks/{taskType}/complete | `POST /quotations/{code}/tasks/{taskType}/complete` |
| PUT | /quotations/{code}/qa | `PUT /quotations/{code}/qa` |
| PUT | /quotations/{code}/rnd | `PUT /quotations/{code}/rnd` |
| PUT | /quotations/{code}/executor/intake | `PUT /quotations/{code}/executor/intake` |
| PUT | /quotations/{code}/executor/consolidation | `PUT /quotations/{code}/executor/consolidation` |
| PUT | /quotations/{code}/accounting | `PUT /quotations/{code}/accounting` |
| POST | /quotations/{code}/director/decision | `POST /quotations/{code}/director/decision` |
| GET | /quotations/{code}/attachments | `GET /quotations/{code}/attachments` |
| POST | /quotations/{code}/attachments/presign | `POST /quotations/{code}/attachments/presign` |
| POST | /quotations/{code}/attachments/confirm | `POST /quotations/{code}/attachments/confirm` |
| DELETE | /quotations/{code}/attachments/{attachmentId} | `DELETE /quotations/{code}/attachments/{attachmentId}` |
| GET | /quotations/{code}/history | `GET /quotations/{code}/history` |
| GET | /quotations/{code}/revisions | `GET /quotations/{code}/revisions` |
| GET | /quotations/{code}/revisions/{revisionCode} | `GET /quotations/{code}/revisions/{revisionCode}` |
| GET | /quotations/{code}/similar-by-product | `GET /quotations/{code}/similar-by-product` |
| GET | /quotations/{code}/similar-by-customer | `GET /quotations/{code}/similar-by-customer` |
| GET | /customers/{customerCode}/quotations | `GET /customers/{customerCode}/quotations` |

## Terraform handoff (PR2 + task inbox)

After merge: Orchestrator → Terraform agent — S3 bucket, IAM for Lambda presign, **four attachment routes** above, **`GET /tasks`** (`listTaskInbox`), Lambda env (`ATTACHMENTS_BUCKET`, `AWS_REGION`, optional `ATTACHMENTS_ENABLED`), rebuild `dist/quotation.zip`, re-apply API stack.
