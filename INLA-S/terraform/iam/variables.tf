variable "aws_profile" {
  description = "AWS CLI profile used to create the IAM user. This identity must already be allowed to manage IAM."
  type        = string
  default     = "general-admin"
}

variable "aws_region" {
  description = "Provider region. IAM is global. S3 permissions in this stack are limited to this region."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Short project name used in the policy name and tags."
  type        = string
  default     = "inla-s"

  validation {
    condition     = can(regex("^[a-z0-9]+(-[a-z0-9]+)*$", var.project_name))
    error_message = "project_name must be lowercase letters, numbers, and single hyphens."
  }
}

variable "iam_user_name" {
  description = "IAM user that will apply terraform/infra and publish the frontend build."
  type        = string
  default     = "inla-admin"

  validation {
    condition     = can(regex("^[\\w+=,.@-]{1,64}$", var.iam_user_name))
    error_message = "iam_user_name must be a valid IAM user name (1-64 characters)."
  }
}

variable "bucket_name_prefix" {
  description = "S3 bucket name prefix inla-admin may create and manage. The infra bucket name must start with this prefix."
  type        = string
  default     = "inla-s-"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,30}$", var.bucket_name_prefix))
    error_message = "bucket_name_prefix must be lowercase letters, numbers, and hyphens."
  }
}
