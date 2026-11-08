# Staff directory for the frontend. Sign-up is closed. Seed users are created
# once with a generated temporary password and then left alone: ignore_changes
# keeps later password and profile edits from being reset by Terraform.
# The password is not written in this file. It lives only in Terraform state.

resource "random_password" "seed_users" {
  length      = 20
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1

  # Cognito accepts this subset. The password must not be a seed user's email.
  override_special = "!@#*-_=+"
}

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  mfa_configuration = "OFF"

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "level"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 32
    }
  }

  tags = {
    Component = "cognito"
  }
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${local.name_prefix}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = ["COGNITO"]

  read_attributes = [
    "email",
    "email_verified",
    "name",
    "custom:level",
  ]

  write_attributes = [
    "name",
    "custom:level",
  ]

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

locals {
  cognito_groups = {
    ADMIN      = 1
    DIRECTOR   = 2
    EXECUTOR   = 3
    SALES      = 4
    QA         = 5
    "R&D"      = 6
    ACCOUNTING = 7
  }

  seed_users = {
    admin = {
      email  = "admin@inla.vn"
      name   = "Nguyễn Thị Lý"
      level  = "manager"
      groups = ["ADMIN", "EXECUTOR"]
    }
    director = {
      email  = "director@inla.vn"
      name   = "Ban Giám đốc"
      level  = "manager"
      groups = ["DIRECTOR"]
    }
    sales_tinh = {
      email  = "sales.tinh@inla.vn"
      name   = "Phạm Văn Tịnh"
      level  = "manager"
      groups = ["SALES"]
    }
    sales_hiep = {
      email  = "sales.hiep@inla.vn"
      name   = "Nguyễn Phú Hiệp"
      level  = "staff"
      groups = ["SALES"]
    }
    sales_phuong = {
      email  = "sales.phuong@inla.vn"
      name   = "Huỳnh Vũ Phương"
      level  = "staff"
      groups = ["SALES"]
    }
    sales_lam = {
      email  = "sales.lam@inla.vn"
      name   = "Phạm Tùng Lâm"
      level  = "staff"
      groups = ["SALES"]
    }
    sales_dai = {
      email  = "sales.dai@inla.vn"
      name   = "Nguyễn Quốc Đại"
      level  = "staff"
      groups = ["SALES"]
    }
    sales_ton = {
      email  = "sales.ton@inla.vn"
      name   = "Nguyễn Minh Tồn"
      level  = "staff"
      groups = ["SALES"]
    }
    sales_vu = {
      email  = "sales.vu@inla.vn"
      name   = "Lê Huy Vũ"
      level  = "staff"
      groups = ["SALES"]
    }
    qa = {
      email  = "qa@inla.vn"
      name   = "Đỗ Xuân Bách"
      level  = "manager"
      groups = ["QA"]
    }
    rnd = {
      email  = "rnd@inla.vn"
      name   = "Trần Thanh Nhàn"
      level  = "manager"
      groups = ["R&D"]
    }
    accounting = {
      email  = "accounting@inla.vn"
      name   = "Nguyễn Thị Chi"
      level  = "manager"
      groups = ["ACCOUNTING"]
    }
  }

  seed_memberships = merge([
    for user_key, user in local.seed_users : {
      for group_name in user.groups :
      "${user_key}-${group_name}" => {
        user_key   = user_key
        group_name = group_name
      }
    }
  ]...)
}

resource "aws_cognito_user_group" "this" {
  for_each = local.cognito_groups

  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "INLA-S ${each.key}"
  precedence   = each.value
}

resource "aws_cognito_user" "seed" {
  for_each = local.seed_users

  user_pool_id = aws_cognito_user_pool.main.id
  username     = each.value.email

  attributes = {
    email          = each.value.email
    email_verified = "true"
    name           = each.value.name
    "custom:level" = each.value.level
  }

  temporary_password = random_password.seed_users.result
  message_action     = "SUPPRESS"

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_cognito_user_in_group" "seed" {
  for_each = local.seed_memberships

  user_pool_id = aws_cognito_user_pool.main.id
  group_name   = aws_cognito_user_group.this[each.value.group_name].name
  username     = aws_cognito_user.seed[each.value.user_key].username
}
