output "s3_bucket_name" {
  description = "Name of the private S3 bucket that stores the frontend build."
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID. Use this when invalidating the cache after a deploy."
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name. The site is served over HTTPS at this hostname."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID."
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito app client ID for the frontend. This client has no secret."
  value       = aws_cognito_user_pool_client.frontend.id
}

output "seed_user_temporary_password" {
  description = "Shared temporary password for seed users. Present only in Terraform state. Each user must replace it at first sign-in."
  value       = random_password.seed_users.result
  sensitive   = true
}
