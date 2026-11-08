output "api_url" {
  description = "Base URL of the HTTP API (users, customer, quotation routes). Routes are served from this host with no stage prefix."
  value       = aws_apigatewayv2_api.users.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the users Lambda function."
  value       = aws_lambda_function.users.function_name
}

output "customer_lambda_function_name" {
  description = "Name of the customer Lambda function."
  value       = aws_lambda_function.customer.function_name
}

output "quotation_lambda_function_name" {
  description = "Name of the quotation Lambda function."
  value       = aws_lambda_function.quotation.function_name
}

output "quotation_attachments_bucket_name" {
  description = "Private S3 bucket for quotation file uploads (presigned PUT from the SPA; bucket CORS matches cors_allowed_origins)."
  value       = aws_s3_bucket.quotation_attachments.id
}

output "user_pool_id" {
  description = "Cognito user pool used by the Lambda and the JWT authorizer."
  value       = var.user_pool_id
}
