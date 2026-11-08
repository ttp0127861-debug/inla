# Aggregates outputs from independently applied stacks (iam → infra → api).
# Root does not create AWS resources; run `terraform init` and `terraform apply` here
# after each sub-stack has been applied at least once.

data "terraform_remote_state" "iam" {
  backend = "local"

  config = {
    path = "${path.module}/iam/terraform.tfstate"
  }
}

data "terraform_remote_state" "infra" {
  backend = "local"

  config = {
    path = "${path.module}/infra/terraform.tfstate"
  }
}

data "terraform_remote_state" "api" {
  backend = "local"

  config = {
    path = "${path.module}/api/terraform.tfstate"
  }
}
