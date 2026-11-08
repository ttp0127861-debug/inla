variable "aws_profile" {
  description = "AWS CLI profile for the inla-admin user created by the iam stack."
  type        = string
  default     = "inla-admin"
}

variable "aws_region" {
  description = "Region for the S3 bucket. CloudFront is global and is configured with this provider."
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

variable "bucket_name" {
  description = "Globally unique private bucket for the static frontend. Must start with inla-s- so the inla-admin policy allows it."
  type        = string
  default     = "inla-s-dev-frontend"

  validation {
    condition     = startswith(var.bucket_name, "inla-s-") && can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name must be a valid S3 bucket name, 3-63 characters, and start with inla-s-."
  }
}
