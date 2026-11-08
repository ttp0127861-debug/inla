# React + TypeScript + Vite

## Cognito sign-in

The login screen calls Amazon Cognito in `ap-southeast-1`.

- User pool: `ap-southeast-1_2d8iwcBko`
- App client: `34g1h5s3oji7qjnj6695s21759`

Sign-in uses the email address and password. Cognito keeps the tokens in the browser. The ID token supplies the display name, `cognito:groups`, and `custom:level`. The header shows that name and those groups. Pages inside the app redirect to `/` when there is no session.

Seed users are created with one shared temporary password. It is not stored in this folder. Read it from the infra Terraform state:

```powershell
cd ..\terraform\infra
terraform output -raw seed_user_temporary_password
```

The first successful sign-in opens the existing reset-password screen. Cognito requires a new password of at least 12 characters, with an uppercase letter, a lowercase letter, a number, and a symbol. That temporary password expires after 7 days.

If the state file is gone or the temporary password has expired, set a new one with the `inla-admin` profile. Replace the password below. Do not commit the real value.

```powershell
aws cognito-idp admin-set-user-password --user-pool-id ap-southeast-1_2d8iwcBko --username admin@inla.vn --password "ReplaceWithAStrongPassword1!" --no-permanent --region ap-southeast-1 --profile inla-admin
```

`--no-permanent` leaves the user in the force-change-password state, so the app still asks for a new password. Omit it only when the password you set should be the permanent one.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
