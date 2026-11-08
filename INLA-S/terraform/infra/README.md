# Infra stack (inla-admin)

Creates a private S3 bucket in `ap-southeast-1` and a CloudFront distribution that serves it over HTTPS with Origin Access Control.

Apply this only after `../iam` and after the `inla-admin` AWS CLI profile exists. The provider uses that profile by default. The bucket name must start with `inla-s-`, which is the prefix that user is allowed to manage.

The bucket is not a public website. Only this distribution can read objects (`s3:GetObject`).

This stack also creates a Cognito user pool in `ap-southeast-1`, an app client with `USER_PASSWORD_AUTH` and `USER_SRP_AUTH`, groups `ADMIN`, `DIRECTOR`, `EXECUTOR`, `SALES`, `QA`, `R&D`, and `ACCOUNTING`, and the `custom:level` attribute. Twelve seed users are created with a generated temporary password. That password is not in the Terraform source. It is stored only in this stack's state, which is gitignored. Invite email is suppressed. Each person must set a new password at first sign-in (`NEW_PASSWORD_REQUIRED`). The temporary password expires after 7 days. Seed users use `ignore_changes = all`, so Terraform does not reset a password or profile after the first apply. Sign-up is closed.

If `inla-admin` was created before Cognito was added, apply `../iam` again with `general-admin` first. The infra profile cannot create the user pool until that policy includes Cognito.

## Apply

From `INLA-S/terraform/infra`:

```powershell
terraform init
terraform plan
terraform apply
```

Change the bucket name if `inla-s-dev-frontend` is already taken. Keep the `inla-s-` prefix:

```powershell
terraform apply -var="bucket_name=inla-s-dev-frontend-yourname"
```

CloudFront takes several minutes to finish. Then note `s3_bucket_name`, `cloudfront_distribution_id`, `cloudfront_domain_name`, `cognito_user_pool_id`, and `cognito_user_pool_client_id`.

```powershell
terraform output
terraform output -raw seed_user_temporary_password
```

Give the temporary password to the seed users through a private channel, then clear it from the terminal. Do not commit state, and do not copy the password into a file in this repo. Sign-in uses the email address. `custom:level` is `manager` or `staff`. `admin@inla.vn` is in both `ADMIN` and `EXECUTOR`.

Open `https://<cloudfront_domain_name>` after the upload below.

## Build and publish the frontend

From `INLA-S/frontend`:

```powershell
npm ci
npm run build
```

Upload `frontend/dist` with the inla-admin profile. Replace the bucket name and distribution ID with the outputs above.

```powershell
aws s3 sync .\dist\ s3://BUCKET_NAME/ --delete --region ap-southeast-1 --profile inla-admin
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*" --profile inla-admin
```

`--delete` removes objects that are no longer in `dist/`. Invalidate `/*` after each build so viewers receive the new `index.html`.

Routes such as `/dashboard` are not files in S3. CloudFront rewrites origin 403 and 404 responses to `/index.html` with HTTP 200 so React Router can handle them.

## Destroy

Empty the bucket first (`force_destroy` is off), then destroy with the same profile:

```powershell
aws s3 rm s3://BUCKET_NAME --recursive --region ap-southeast-1 --profile inla-admin
terraform destroy
```
