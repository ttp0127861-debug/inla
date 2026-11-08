# INLA-S Customer Lambda

Node.js ≥ 20 (CommonJS) Lambda for customer, contact, sales-relation, and audit history APIs. Data access goes through the shared [`inla-s-db`](../db) package (`query` for reads, `runWithRequestContext` for writes).

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (same as `backend/db` migrations). |

## Local setup

```bash
cd backend/customer
npm install
```

Apply schema first from `backend/db` (`npm run migrate` with `DATABASE_URL` set).

## Local smoke test

Invoke the handler with a synthetic HTTP API v2 event (JWT claims under `requestContext.authorizer.jwt.claims`, route in `routeKey`). Example:

```bash
set DATABASE_URL=postgresql://...
node -e "require('./src/index').handler({ routeKey:'GET /customers', queryStringParameters:{}, requestContext:{ requestId:'local', authorizer:{ jwt:{ claims:{ 'cognito:groups':'ADMIN', email:'admin@example.com' } } } } }).then(r=>console.log(r.statusCode, r.body))"
```

## Authorization

- **ADMIN**: full access.
- **SALES**: list/get/update customers with an active `customer_sales_relations` row; `POST /customers` auto-links the creator. Assign/remove sales is ADMIN-only.

## Deploy packaging

`deploy-customer-api.bat` in this folder packages this Lambda and applies `terraform/api`. All API modules: `backend/deploy-api.bat`. Install production dependencies only so `inla-s-db` and its `@neondatabase/serverless` dependency are included:

```bash
npm ci --omit=dev
```

Then zip `src/`, `node_modules/`, and `package.json`.

## API spec

See [`openapi.yaml`](./openapi.yaml). Aggregated backend spec: `backend/api-spec.yaml` (not edited from this module).
