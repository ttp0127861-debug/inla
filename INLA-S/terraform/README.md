# INLA-S Terraform

Three **independent** stacks (separate state), applied in order. The **root** folder (`terraform/`) does not create AWS resources; it **re-exports** all sub-stack outputs for `terraform output`, contracts, and tooling.

1. `iam/` with the `general-admin` profile. Creates the IAM user `inla-admin`, one least-privilege policy, and an access key.
2. Create an AWS CLI profile named `inla-admin` from that key.
3. `infra/` with the `inla-admin` profile. Creates the private S3 bucket, CloudFront distribution, and Cognito user pool.
4. `api/` after `infra`. Run `backend/deploy-api.bat`. It packages the customer, quotation, and users Lambdas (not `db`) and applies this stack. `inla-admin` still needs Lambda, API Gateway, IAM role, and log group permissions before that apply. See [api/README.md](api/README.md).
5. **Root aggregate (after 1–4):** from `terraform/` run `terraform init` then `terraform apply`. This refreshes `outputs.tf` from local state files under `iam/`, `infra/`, and `api/` (see `remote_state.tf`). No AWS changes.

```powershell
cd INLA-S/terraform
terraform init
terraform apply   # updates root state outputs only
terraform output -json
```

Use root `terraform output -json` for `scripts/sync-contract.ps1` (includes `api_url`, Cognito IDs, CloudFront, Lambda names, etc.). **`database_url` is not exported** — it is a sensitive input to `api/` only.

When you add a new output in `iam/`, `infra/`, or `api/`, **re-export it in root `outputs.tf`** in the same change.

The IAM state file contains the access key secret. Do not commit `terraform.tfstate` from any of these folders.

- [iam/README.md](iam/README.md)
- [infra/README.md](infra/README.md)
- [api/README.md](api/README.md)
