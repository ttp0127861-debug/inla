output "iam_user_name" {
  description = "IAM user that applies the infra stack and publishes the frontend."
  value       = aws_iam_user.inla_admin.name
}

output "iam_policy_arn" {
  description = "Least-privilege S3 and CloudFront policy attached to the IAM user."
  value       = aws_iam_policy.inla_admin.arn
}

output "cognito_policy_arn" {
  description = "Least-privilege Cognito policy attached to the IAM user."
  value       = aws_iam_policy.inla_admin_cognito.arn
}

output "users_api_policy_arn" {
  description = "Least-privilege Lambda, HTTP API, log group, and PassRole policy attached to the IAM user."
  value       = aws_iam_policy.inla_admin_users_api.arn
}

output "access_key_id" {
  description = "Access key ID for the inla-admin AWS CLI profile. Also stored in this stack's state."
  value       = aws_iam_access_key.inla_admin.id
  sensitive   = true
}

output "secret_access_key" {
  description = "Secret access key for the inla-admin AWS CLI profile. Stored in this stack's state. Do not commit it."
  value       = aws_iam_access_key.inla_admin.secret
  sensitive   = true
}
