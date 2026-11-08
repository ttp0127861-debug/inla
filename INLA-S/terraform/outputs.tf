# Public contract for Backend, Frontend, and scripts/sync-contract.ps1.
# Values are read from sub-stack state files (see remote_state.tf).

# --- iam/ ---

output "iam_user_name" {
  description = "IAM user that applies infra/api and publishes the frontend."
  value       = data.terraform_remote_state.iam.outputs.iam_user_name
}

output "iam_policy_arn" {
  description = "S3 and CloudFront policy on inla-admin."
  value       = data.terraform_remote_state.iam.outputs.iam_policy_arn
}

output "cognito_policy_arn" {
  description = "Cognito policy on inla-admin."
  value       = data.terraform_remote_state.iam.outputs.cognito_policy_arn
}

output "users_api_policy_arn" {
  description = "Lambda, HTTP API, and PassRole policy on inla-admin."
  value       = data.terraform_remote_state.iam.outputs.users_api_policy_arn
}

output "access_key_id" {
  description = "inla-admin access key ID (also in iam state)."
  value       = data.terraform_remote_state.iam.outputs.access_key_id
  sensitive   = true
}

output "secret_access_key" {
  description = "inla-admin secret key (iam state only; never commit)."
  value       = data.terraform_remote_state.iam.outputs.secret_access_key
  sensitive   = true
}

# --- infra/ ---

output "s3_bucket_name" {
  description = "Private S3 bucket for frontend build."
  value       = data.terraform_remote_state.infra.outputs.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation."
  value       = data.terraform_remote_state.infra.outputs.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront HTTPS hostname for the SPA."
  value       = data.terraform_remote_state.infra.outputs.cloudfront_domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID (canonical for app config)."
  value       = data.terraform_remote_state.infra.outputs.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito app client ID for the frontend."
  value       = data.terraform_remote_state.infra.outputs.cognito_user_pool_client_id
}

output "seed_user_temporary_password" {
  description = "Shared temporary password for seed users (infra state)."
  value       = data.terraform_remote_state.infra.outputs.seed_user_temporary_password
  sensitive   = true
}

# --- api/ ---

output "api_url" {
  description = "HTTP API base URL (users, customer, quotation routes). No stage prefix."
  value       = data.terraform_remote_state.api.outputs.api_url
}

output "lambda_function_name" {
  description = "Users Lambda function name."
  value       = data.terraform_remote_state.api.outputs.lambda_function_name
}

output "customer_lambda_function_name" {
  description = "Customer Lambda function name."
  value       = data.terraform_remote_state.api.outputs.customer_lambda_function_name
}

output "quotation_lambda_function_name" {
  description = "Quotation Lambda function name."
  value       = data.terraform_remote_state.api.outputs.quotation_lambda_function_name
}

output "quotation_attachments_bucket_name" {
  description = "Private S3 bucket for quotation attachment uploads."
  value       = data.terraform_remote_state.api.outputs.quotation_attachments_bucket_name
}

output "api_user_pool_id" {
  description = "User pool ID configured on the API stack (should match cognito_user_pool_id)."
  value       = data.terraform_remote_state.api.outputs.user_pool_id
}
