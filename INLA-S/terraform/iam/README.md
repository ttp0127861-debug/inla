# IAM stack (general-admin)

Creates the IAM user `inla-admin`, attaches least-privilege policies, and creates an access key.

**Do not commit secrets.** `terraform apply` stores the secret access key in `terraform.tfstate` and `terraform.tfstate.backup`. Those files are gitignored. Do not copy the secret into source files, shell history notes, screenshots, or chat. Keep it only in the AWS CLI profile you create after apply.

This user can manage S3 buckets whose names start with `inla-s-` in `ap-southeast-1`, Cognito user pools in `ap-southeast-1`, and CloudFront distributions in this account. It can also provision the users API in `ap-southeast-1`: Lambda functions named `inla-s-*` (including versions and aliases), HTTP APIs in that region (APIs, routes, integrations, authorizers, stages, and deployments, including `apigateway:TagResource` and `apigateway:UntagResource` on those ARNs), and `/aws/lambda/inla-s-*` log groups. The only IAM permissions are on roles named `inla-s-*`: manage those roles, attach and read only `AWSLambdaBasicExecutionRole`, list roles, and pass an `inla-s-*` role to `lambda.amazonaws.com`. The users API stack stores its Cognito permissions as an inline role policy, so this user is not granted `iam:CreatePolicy` or `iam:ListPolicies`. The Lambda zip is uploaded with `lambda:UpdateFunctionCode`, not to S3. `PutObject`, `GetObject`, and `ListBucket` for buckets named `inla-s-*` stay on the frontend policy. It cannot change its own user and it is not granted `AdministratorAccess`.

If this user already exists, apply this stack again before `../api` so the attached policy includes the users API permissions. That apply does not rotate the access key.

## Apply

From `INLA-S/terraform/iam`, with the `general-admin` profile already configured:

```powershell
terraform init
terraform plan
terraform apply
```

The provider uses `aws_profile = general-admin` by default.

## Create the inla-admin profile

Read the key once. Terraform redacts sensitive outputs unless you ask for the raw value.

```powershell
terraform output -raw access_key_id
terraform output -raw secret_access_key
aws configure --profile inla-admin
```

When `aws configure` prompts:

- AWS Access Key ID: the access key id output
- AWS Secret Access Key: the secret output
- Default region name: `ap-southeast-1`
- Default output format: `json`

Check the profile, then continue with `../infra`:

```powershell
aws sts get-caller-identity --profile inla-admin
```

The caller ARN should be the `inla-admin` user. If the secret is exposed, delete the access key in IAM and apply this stack again before using it.
