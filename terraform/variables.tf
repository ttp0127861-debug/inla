variable "github_owner" {
  type        = string
  description = "GitHub user or org. Set TF_VAR_github_owner (preferred). If unset, the GitHub provider uses GITHUB_OWNER."
}

variable "github_repository_topics" {
  type        = list(string)
  description = "Topics for INLA. Override with TF_VAR_github_repository_topics."
  default     = ["inla", "terraform", "iac"]
}
