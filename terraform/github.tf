# GitHub: public repo + protected main (fully IaC)

resource "github_repository" "inla" {
  name        = "inla"
  description = "Infrastructure as Code cho dự án INLA"
  visibility  = "public"
  auto_init   = true
}

resource "github_repository_topics" "inla" {
  repository = github_repository.inla.name
  topics     = var.github_repository_topics
}
