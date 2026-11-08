locals {
  name_prefix         = "${var.project_name}-${var.environment}"
  users_lambda_zip    = abspath("${path.module}/../../backend/users/dist/users.zip")
  customer_lambda_zip   = abspath("${path.module}/../../backend/customer/dist/customer.zip")
  quotation_lambda_zip  = abspath("${path.module}/../../backend/quotation/dist/quotation.zip")
  users_routes = {
    list_users     = "GET /users"
    get_user       = "GET /users/{username}"
    create_user    = "POST /users"
    update_user    = "PUT /users/{username}"
    disable_user   = "POST /users/{username}/disable"
    enable_user    = "POST /users/{username}/enable"
    reset_password = "POST /users/{username}/reset-password"
    list_roles     = "GET /roles"
  }
  customer_routes = {
    list_customers      = "GET /customers"
    create_customer     = "POST /customers"
    get_customer        = "GET /customers/{code}"
    update_customer     = "PUT /customers/{code}"
    deactivate_customer = "POST /customers/{code}/deactivate"
    activate_customer   = "POST /customers/{code}/activate"
    list_contacts       = "GET /customers/{code}/contacts"
    create_contact      = "POST /customers/{code}/contacts"
    get_contact         = "GET /customers/{code}/contacts/{contactId}"
    update_contact      = "PUT /customers/{code}/contacts/{contactId}"
    deactivate_contact  = "POST /customers/{code}/contacts/{contactId}/deactivate"
    list_sales          = "GET /customers/{code}/sales"
    add_sales           = "POST /customers/{code}/sales"
    remove_sales        = "POST /customers/{code}/sales/{salesUsername}/remove"
    list_history        = "GET /customers/{code}/history"
  }
  quotation_routes = {
    list_task_inbox              = "GET /tasks"
    list_quotations              = "GET /quotations"
    create_quotation             = "POST /quotations"
    get_quotation                = "GET /quotations/{code}"
    update_quotation             = "PUT /quotations/{code}"
    cancel_quotation             = "POST /quotations/{code}/cancel"
    submit_quotation             = "POST /quotations/{code}/submit"
    resubmit_prepare             = "POST /quotations/{code}/resubmit/prepare"
    resubmit_submit              = "POST /quotations/{code}/resubmit/submit"
    clone_quotation              = "POST /quotations/{code}/clone"
    patch_business_outcome       = "PATCH /quotations/{code}/business-outcome"
    task_start                   = "POST /quotations/{code}/tasks/{taskType}/start"
    task_complete                = "POST /quotations/{code}/tasks/{taskType}/complete"
    put_qa                       = "PUT /quotations/{code}/qa"
    put_rnd                      = "PUT /quotations/{code}/rnd"
    get_development_minutes      = "GET /quotations/{code}/development-minutes"
    put_development_minutes      = "PUT /quotations/{code}/development-minutes"
    put_executor_intake          = "PUT /quotations/{code}/executor/intake"
    put_executor_consolidation   = "PUT /quotations/{code}/executor/consolidation"
    put_accounting               = "PUT /quotations/{code}/accounting"
    director_decision            = "POST /quotations/{code}/director/decision"
    list_history                 = "GET /quotations/{code}/history"
    list_revisions               = "GET /quotations/{code}/revisions"
    get_revision                 = "GET /quotations/{code}/revisions/{revisionCode}"
    similar_by_product           = "GET /quotations/{code}/similar-by-product"
    similar_by_customer          = "GET /quotations/{code}/similar-by-customer"
    list_customer_quotations     = "GET /customers/{customerCode}/quotations"
    list_attachments             = "GET /quotations/{code}/attachments"
    presign_attachment           = "POST /quotations/{code}/attachments/presign"
    confirm_attachment           = "POST /quotations/{code}/attachments/confirm"
    delete_attachment            = "DELETE /quotations/{code}/attachments/{attachmentId}"
    report_operations            = "GET /reports/operations"
    report_business              = "GET /reports/business"
    report_departments           = "GET /reports/departments"
    report_resubmit              = "GET /reports/resubmit"
  }
}

data "aws_cognito_user_pool" "main" {
  user_pool_id = var.user_pool_id
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "cognito" {
  statement {
    sid    = "ManageUsersInThisPool"
    effect = "Allow"
    actions = [
      "cognito-idp:ListUsers",
      "cognito-idp:ListUsersInGroup",
      "cognito-idp:ListGroups",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminResetUserPassword",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminListGroupsForUser",
    ]
    resources = [data.aws_cognito_user_pool.main.arn]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
}

resource "aws_iam_role" "users" {
  name               = "${local.name_prefix}-users"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy" "cognito" {
  name   = "${local.name_prefix}-users-cognito"
  role   = aws_iam_role.users.id
  policy = data.aws_iam_policy_document.cognito.json
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.users.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "users" {
  name              = "/aws/lambda/${local.name_prefix}-users"
  retention_in_days = 14
}

resource "aws_lambda_function" "users" {
  function_name    = "${local.name_prefix}-users"
  role             = aws_iam_role.users.arn
  runtime          = "nodejs20.x"
  handler          = "src/index.handler"
  filename         = local.users_lambda_zip
  source_code_hash = filebase64sha256(local.users_lambda_zip)
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      USER_POOL_ID = var.user_pool_id
    }
  }

  depends_on = [
    aws_iam_role_policy.cognito,
    aws_iam_role_policy_attachment.logs,
    aws_cloudwatch_log_group.users,
  ]
}

resource "aws_apigatewayv2_api" "users" {
  name          = "${local.name_prefix}-users"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 600
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.users.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.name_prefix}-cognito"

  jwt_configuration {
    audience = [var.user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.user_pool_id}"
  }
}

resource "aws_apigatewayv2_integration" "users" {
  api_id                 = aws_apigatewayv2_api.users.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.users.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "users" {
  for_each = local.users_routes

  api_id             = aws_apigatewayv2_api.users.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.users.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_iam_role" "customer" {
  name               = "${local.name_prefix}-customer"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "customer_logs" {
  role       = aws_iam_role.customer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "customer" {
  name              = "/aws/lambda/${local.name_prefix}-customer"
  retention_in_days = 14
}

resource "aws_lambda_function" "customer" {
  function_name    = "${local.name_prefix}-customer"
  role             = aws_iam_role.customer.arn
  runtime          = "nodejs20.x"
  handler          = "src/index.handler"
  filename         = local.customer_lambda_zip
  source_code_hash = filebase64sha256(local.customer_lambda_zip)
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DATABASE_URL = local.database_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.customer_logs,
    aws_cloudwatch_log_group.customer,
  ]
}

resource "aws_apigatewayv2_integration" "customer" {
  api_id                 = aws_apigatewayv2_api.users.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.customer.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "customer" {
  for_each = local.customer_routes

  api_id             = aws_apigatewayv2_api.users.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.customer.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.users.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.users.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_customer" {
  statement_id  = "AllowHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.customer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.users.execution_arn}/*/*"
}

resource "aws_iam_role" "quotation" {
  name               = "${local.name_prefix}-quotation"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "quotation_logs" {
  role       = aws_iam_role.quotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "quotation" {
  name              = "/aws/lambda/${local.name_prefix}-quotation"
  retention_in_days = 14
}

resource "aws_lambda_function" "quotation" {
  function_name    = "${local.name_prefix}-quotation"
  role             = aws_iam_role.quotation.arn
  runtime          = "nodejs20.x"
  handler          = "src/index.handler"
  filename         = local.quotation_lambda_zip
  source_code_hash = filebase64sha256(local.quotation_lambda_zip)
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DATABASE_URL        = local.database_url
      ATTACHMENTS_BUCKET  = aws_s3_bucket.quotation_attachments.id
      ATTACHMENTS_ENABLED = "true"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.quotation_logs,
    aws_iam_role_policy.quotation_attachments_s3,
    aws_cloudwatch_log_group.quotation,
  ]
}

resource "aws_apigatewayv2_integration" "quotation" {
  api_id                 = aws_apigatewayv2_api.users.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.quotation.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "quotation" {
  for_each = local.quotation_routes

  api_id             = aws_apigatewayv2_api.users.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.quotation.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_quotation" {
  statement_id  = "AllowHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.quotation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.users.execution_arn}/*/*"
}
