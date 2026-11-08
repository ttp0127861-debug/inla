variable "database_url" {
  description = "PostgreSQL connection string for DB-backed Lambdas. Prefer setting DATABASE_URL in the shell; -var database_url= overrides."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
}

data "external" "database_url_from_env" {
  program = ["node", "-e", "console.log(JSON.stringify({ database_url: process.env.DATABASE_URL || '' }))"]
}

locals {
  database_url_from_var = var.database_url != null ? trimspace(var.database_url) : ""
  database_url_from_env = trimspace(data.external.database_url_from_env.result.database_url)
  database_url          = local.database_url_from_var != "" ? local.database_url_from_var : local.database_url_from_env
}

check "database_url_configured" {
  assert {
    condition     = local.database_url != ""
    error_message = "Set DATABASE_URL in this shell before plan/apply (PowerShell: $env:DATABASE_URL = 'postgresql://...'). Required for customer and quotation Lambdas. Or pass -var=\"database_url=...\"."
  }
}
