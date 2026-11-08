terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

# Token: GITHUB_TOKEN. Owner: TF_VAR_github_owner, else GITHUB_OWNER. Do not hard-code.
provider "github" {
  owner = var.github_owner
}
