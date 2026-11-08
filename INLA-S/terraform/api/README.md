# Users, customer, and quotation API stack

Creates the users, customer, and quotation Lambdas, one HTTP API, a Cognito JWT authorizer, and IAM roles (Cognito management for users; CloudWatch logs only for DB-backed Lambdas).

The pool is `ap-southeast-1_2d8iwcBko` and the app client is `34g1h5s3oji7qjnj6695s21759`. The provider uses the `inla-admin` profile and region `ap-southeast-1`.

## Deploy

From `backend/`, double-click or run:

```bat
deploy-api.bat
```

The script packages `backend/customer`, `backend/quotation`, and `backend/users` (not `db`), then runs `terraform init` and `terraform apply -auto-approve` once, and prints `api_url`.

Each module also has its own script: `backend/customer/deploy-customer-api.bat`, `backend/quotation/deploy-quotation-api.bat`, `backend/users/deploy-user-api.bat`. Set **`DATABASE_URL`** in the environment before `terraform plan` or `apply` (customer and quotation Lambdas). Optional override: `-var="database_url=..."` or `TF_VAR_database_url`.

`inla-admin` must be allowed to create Lambda functions, HTTP APIs, IAM roles, and log groups. Do not attach `AdministratorAccess`.

The Lambda role can call only these Cognito actions, and only on this user pool: list users and groups, get, create, update, enable, disable, reset password, add and remove a group, and delete a user. Delete is for rolling back a failed create. The API has no delete route.

CORS allows `http://localhost:5173` and `https://d2i3ye055vm13o.cloudfront.net`. Methods are GET, POST, PUT, PATCH, DELETE, and OPTIONS. Request headers are `authorization` and `content-type`.

Users routes: `GET/POST /users`, `GET/PUT /users/{username}`, enable/disable/reset-password, `GET /roles`.

Customer routes (15): `/customers`, `/customers/{code}`, contacts, sales, and history under `/customers/{code}/…`.

Quotation routes (**29**, PR2): task inbox (`GET /tasks`), PR1 workflow/history/similar, plus attachment APIs:

- `GET /quotations/{code}/attachments`
- `POST /quotations/{code}/attachments/presign`
- `POST /quotations/{code}/attachments/confirm`
- `DELETE /quotations/{code}/attachments/{attachmentId}`

See `backend/quotation/README.md` routeKey table.

**Quotation Lambda env (PR2):** `DATABASE_URL`, `ATTACHMENTS_BUCKET`, `ATTACHMENTS_ENABLED=true`. Do not set `AWS_REGION` on Lambda (AWS reserved); runtime provides region for the S3 SDK.

**Upload flow:** Browser calls API presign → uploads **directly to S3** with the presigned PUT URL. The private bucket uses CORS (`PUT`, `HEAD`, `GET`) for the same origins as the HTTP API (`cors_allowed_origins`). Output `quotation_attachments_bucket_name` is the bucket id.

Routes hang off `api_url` with no stage name. Send a Cognito access token:

```powershell
curl -H "Authorization: Bearer ACCESS_TOKEN" "$api/users"
```

A caller who is not in `ADMIN` receives `403`. Disabling the caller's own username also returns `403`.

State is gitignored. Do not commit it.
