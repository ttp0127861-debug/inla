output "github_repository_full_name" {
  description = "owner/name of the GitHub repository"
  value       = github_repository.inla.full_name
}

output "github_repository_html_url" {
  description = "HTTPS URL of the GitHub repository"
  value       = github_repository.inla.html_url
}