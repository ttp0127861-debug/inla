variable "aws_profile" {
  description = "AWS CLI profile for the inla-admin user created by the iam stack."
  type        = string
  default     = "inla-admin"
}

variable "aws_region" {
  description = "Region for the Lambda function and HTTP API."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Short project name used in resource names and tags."
  type        = string
  default     = "inla-s"

  validation {
    condition     = can(regex("^[a-z0-9]+(-[a-z0-9]+)*$", var.project_name))
    error_message = "project_name must be lowercase letters, numbers, and single hyphens."
  }
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9]+(-[a-z0-9]+)*$", var.environment))
    error_message = "environment must be lowercase letters, numbers, and single hyphens."
  }
}

variable "user_pool_id" {
  description = "Cognito user pool that stores staff accounts."
  type        = string
  default     = "ap-southeast-1_2d8iwcBko"
}

variable "user_pool_client_id" {
  description = "Cognito app client ID. HTTP API checks this against the access token client_id claim."
  type        = string
  default     = "34g1h5s3oji7qjnj6695s21759"
}

variable "cors_allowed_origins" {
  description = "Browser origins allowed to call the API."
  type        = list(string)
  default = [
    "http://localhost:5173",
    "https://d2i3ye055vm13o.cloudfront.net",
  ]
}

variable "quotation_attachments_bucket_name" {
  description = "Private S3 bucket for quotation attachments. Must start with inla-s- (inla-admin IAM). Defaults to inla-s-{environment}-quotation-attachments."
  type        = string
  default     = null
  nullable    = true

  validation {
    condition = (
      var.quotation_attachments_bucket_name == null ||
      can(regex("^inla-s-", var.quotation_attachments_bucket_name))
    )
    error_message = "quotation_attachments_bucket_name must start with inla-s-."
  }
}

