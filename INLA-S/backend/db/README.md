# Database

Shared Neon client and SQL migrations for INLA-S.

**Quotation schema (draft):** see [`repo/`](./repo/README.md) for DB-agent reference before quotation migrations land in `SCHEMA.md` and `migrations/`. Runtime queries use `@neondatabase/serverless` over HTTPS via **`process.env.DATABASE_URL`** (`readDatabaseUrl()` / `isDatabaseConfigured()` in `src/index.js`). Migrations use `node-pg-migrate` and the same **`DATABASE_URL`** variable.

Apply pending migrations from this directory:

```powershell
$env:DATABASE_URL = "<neon connection string>"
npm run migrate
```

Do not run migrations on import, during build, or inside a Lambda handler.

## Dev seed

`npm run seed:dev` is for a Neon **dev** branch only. Production and production CI must never run it. The script exits when `NODE_ENV=production`. It is not part of `npm run migrate`.

Source files: see `backend/repo/README.md` (`customers.tsv`, `quotations.tsv`, `sales-label-map.json`).

```powershell
cd backend/db
$env:DATABASE_URL = "<neon dev connection string>"
npm run migrate
npm run seed:dev
npm run seed:quotations:dev
```

`npm run seed:dev:down` deletes customers with `created_by = 'seed:dev'`, then their contacts and sales relations. **Run `npm run seed:quotations:dev:down` first** — quotations reference customers (`ON DELETE RESTRICT`).

To refresh customer seed data (realistic VN `tax_id` / `+84` phones): `seed:quotations:dev:down` → `seed:dev:down` → `seed:dev` → `seed:quotations:dev`. Quotation down temporarily disables append-only row guards on `quotation_workflow_events` / `quotation_revisions` inside one transaction (dev seed only).

`npm run seed:quotations:dev` inserts 12 quotations (`created_by = 'seed:quotations:dev'`) across workflow stages from `quotations.tsv`. Requires `seed:dev` customers first.

Audit rows already stored stay in `audit_events`. `npm run seed:dev -- --check` and `npm run seed:quotations:dev -- --check` validate TSV files without connecting.

## Client

```javascript
const { query, runWithRequestContext } = require("../db");

const { rows } = await query("select * from customers where id = $1", [id]);

await runWithRequestContext(event, (txn) => [
  txn.query(
    "insert into customers (customer_type, name, tax_id, phone, email, address_line, province, created_by) values ($1, $2, $3, $4, $5, $6, $7, $8)",
    ["business", name, taxId, phone, email, address, province, actor]
  ),
]);
```

`query` is one statement and does not set audit session variables. Use it for reads.

`runWithRequestContext` is the write path. In the same HTTP transaction it runs three separate statements, then the statements returned by the callback:

```sql
SELECT set_config('audit.actor_username', $1, true);
SELECT set_config('audit.actor_role', $1, true);
SELECT set_config('audit.request_id', $1, true);
```

Each call has its own parameter. The callback must be synchronous and return an array of `txn.query(...)` results. The driver cannot wait for another query, or an external API, between statements.

`customers.created_by` and `customers.updated_by` are application columns. Triggers do not fill them. Do not insert into `audit_events` from Lambda code.

## Actor

For an API Gateway HTTP API JWT event:

- `actor_username` is `cognito:username`, then `email`, then `username`.
- `cognito:groups` is parsed the same way as `backend/users/src/middleware/auth.js` (array, or a string such as `[ADMIN SALES]`).
- `actor_role` is the first group in this order: `ADMIN`, `DIRECTOR`, `EXECUTOR`, `SALES`, `QA`, `R&D`, `ACCOUNTING`. Any other group comes after those. An empty list stores NULL.
- `request_id` is `requestContext.requestId`.

If the value is not an API Gateway event, pass `{ username, role, requestId }`.
