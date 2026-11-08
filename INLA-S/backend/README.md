# INLA-S backend

This folder groups **users**, **customer**, **quotation**, and **db** Lambdas (each subfolder has its own `package.json`). The **single OpenAPI document** consumed by the frontend and docs is:

- **`api-spec.yaml`** — aggregated from submodule specs (do not edit by hand).

## Aggregated OpenAPI (`api-spec.yaml`)

Submodule APIs are defined in:

- `users/openapi.yaml`
- `customer/openapi.yaml`
- `quotation/openapi.yaml`

After you change any of these files (or add another `**/openapi.yaml` under `backend/`), regenerate the aggregate:

```bash
cd backend
npm install
npm run api-spec:merge
```

This runs `scripts/merge-api-spec.mjs`, which discovers all `openapi.yaml` files, merges them with **Redocly** `join` (prefixes components/tags with each module’s `info.title` to avoid name clashes), and writes **`api-spec.yaml`**. Re-runs with the same inputs produce stable output.

## Contracts / infra sync

If the repo uses Terraform outputs in `contracts/`, from the **INLA-S** root run:

```powershell
.\scripts\sync-contract.ps1
```

(OpenAPI changes do not replace that step; run both when applicable.)

## Deploy API

`deploy-api.bat` in this folder packages the customer, quotation, and users Lambdas, then applies `terraform/api` once. It does not deploy `db`. Set `DATABASE_URL` before that apply. Regenerating `api-spec.yaml` does not by itself deploy anything.
