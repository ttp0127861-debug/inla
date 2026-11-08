# Users Lambda

Node.js 20 function for the INLA-S staff directory. API Gateway invokes `src/index.handler`.

`deploy-user-api.bat` in this folder installs dependencies, zips this folder, and applies `terraform/api`. `backend/deploy-api.bat` packages every API module (not `db`) and applies once. The function reads **`USER_POOL_ID`** from Lambda environment (set by Terraform). This module does **not** use `DATABASE_URL`. Terraform apply for the shared API stack still needs `DATABASE_URL` because the customer and quotation Lambdas do.

| Variable | Required | Description |
|----------|----------|-------------|
| `USER_POOL_ID` | Yes | Cognito user pool ID for the target environment. |

## Layout

- `src/index.js` routes the HTTP API event
- `src/handlers` one module per resource
- `src/services` Cognito calls and request validation
- `src/middleware` ADMIN group check

## Routes

Every route requires a Cognito access token. API Gateway rejects a missing or invalid token. The function then requires the `ADMIN` group and returns `403` otherwise.

| Method | Path | Action |
| --- | --- | --- |
| GET | `/users` | List users. Optional query: `q`, `role`, `enabled=true\|false`. |
| GET | `/users/{username}` | Get one user. `username` is the email address. |
| POST | `/users` | Create a user and email a temporary password. |
| PUT | `/users/{username}` | Update name, phone, level, or role. Email cannot change. |
| POST | `/users/{username}/disable` | Disable the user. An admin cannot disable their own account. |
| POST | `/users/{username}/enable` | Enable the user. |
| POST | `/users/{username}/reset-password` | Ask Cognito to email a password reset. |
| GET | `/roles` | List the Cognito groups used as roles. |

There is no delete route. `AdminDeleteUser` is used only to roll back a create that failed while assigning the role, and that rollback never targets the caller.

## Rules

- A user written by this API has exactly one role: `ADMIN`, `DIRECTOR`, `EXECUTOR`, `SALES`, `QA`, `R&D`, or `ACCOUNTING`.
- At most one enabled user may belong to `EXECUTOR`.
- `level` is `manager` or `staff` and is stored in `custom:level`.
- `name` and `phone_number` are Cognito attributes. A local number such as `0901234567` is stored as E.164, `+84901234567`.

Create body:

```json
{
  "email": "person@inla.vn",
  "name": "Nguyen Van A",
  "phoneNumber": "0901234567",
  "role": "SALES",
  "level": "staff"
}
```

## Errors

```json
{ "error": { "code": "FORBIDDEN", "message": "Only the ADMIN group can manage users." } }
```

`VALIDATION_ERROR` is `400`, `UNAUTHORIZED` is `401`, `FORBIDDEN` is `403`, `NOT_FOUND` is `404`, `CONFLICT` is `409`.
