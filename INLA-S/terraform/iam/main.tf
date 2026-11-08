data "aws_caller_identity" "current" {}

locals {
  bucket_arn        = "arn:aws:s3:::${var.bucket_name_prefix}*"
  object_arn        = "arn:aws:s3:::${var.bucket_name_prefix}*/*"
  distribution_arn  = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
  origin_access_arn = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:origin-access-control/*"
  user_pool_arn     = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
  lambda_arn        = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-*"
  users_role_arn    = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-*"
  users_log_arn     = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-*"
}

resource "aws_iam_user" "inla_admin" {
  name = var.iam_user_name
}

# Scoped to this project's buckets and CloudFront resources.
# No iam:* and no AdministratorAccess. inla-admin cannot change its own permissions.
data "aws_iam_policy_document" "inla_admin" {
  statement {
    sid       = "ListBuckets"
    effect    = "Allow"
    actions   = ["s3:ListAllMyBuckets"]
    resources = ["*"]
  }

  statement {
    sid       = "CreateProjectBucketInRegion"
    effect    = "Allow"
    actions   = ["s3:CreateBucket"]
    resources = [local.bucket_arn]

    condition {
      test     = "StringEquals"
      variable = "s3:LocationConstraint"
      values   = [var.aws_region]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ManageProjectBucket"
    effect = "Allow"
    actions = [
      "s3:DeleteBucket",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:GetBucketLocation",
      "s3:GetBucketPolicy",
      "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy",
      "s3:GetBucketPolicyStatus",
      "s3:GetBucketPublicAccessBlock",
      "s3:PutBucketPublicAccessBlock",
      "s3:GetBucketOwnershipControls",
      "s3:PutBucketOwnershipControls",
      "s3:GetEncryptionConfiguration",
      "s3:PutEncryptionConfiguration",
      "s3:GetLifecycleConfiguration",
      "s3:PutLifecycleConfiguration",
      "s3:GetBucketTagging",
      "s3:PutBucketTagging",
      "s3:GetBucketVersioning",
      "s3:GetBucketAcl",
      "s3:GetBucketCORS",
      "s3:PutBucketCORS",
      "s3:GetBucketWebsite",
      "s3:GetBucketLogging",
      "s3:GetBucketNotification",
      "s3:GetBucketRequestPayment",
      "s3:GetAccelerateConfiguration",
      "s3:GetBucketObjectLockConfiguration",
      "s3:GetReplicationConfiguration",
    ]
    resources = [local.bucket_arn]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "PublishProjectObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts",
    ]
    resources = [local.object_arn]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  # Create and list APIs, plus the AWS-managed cache policy lookup, do not
  # accept a distribution ARN. CloudFront is global, so there is no region limit.
  statement {
    sid    = "CreateAndListCloudFront"
    effect = "Allow"
    actions = [
      "cloudfront:CreateDistribution",
      "cloudfront:ListDistributions",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:ListOriginAccessControls",
      "cloudfront:GetCachePolicy",
      "cloudfront:ListCachePolicies",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ManageAccountDistributions"
    effect = "Allow"
    actions = [
      "cloudfront:GetDistribution",
      "cloudfront:GetDistributionConfig",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
      "cloudfront:UntagResource",
      "cloudfront:ListTagsForResource",
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations",
    ]
    resources = [local.distribution_arn]
  }

  statement {
    sid    = "ManageAccountOriginAccessControls"
    effect = "Allow"
    actions = [
      "cloudfront:GetOriginAccessControl",
      "cloudfront:UpdateOriginAccessControl",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:TagResource",
      "cloudfront:ListTagsForResource",
    ]
    resources = [local.origin_access_arn]
  }
}

# Separate policy so the S3 and CloudFront document stays within the managed-policy size limit.
# CreateUserPool and ListUserPools do not accept a user pool id. Both are limited to ap-southeast-1.
# Every other action is limited to user pools in this account and region.
# This is not AdministratorAccess, and it grants no IAM permissions.
data "aws_iam_policy_document" "inla_admin_cognito" {
  statement {
    sid    = "CreateAndListCognitoUserPools"
    effect = "Allow"
    actions = [
      "cognito-idp:CreateUserPool",
      "cognito-idp:ListUserPools",
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ManageCognitoUserPools"
    effect = "Allow"
    actions = [
      "cognito-idp:DescribeUserPool",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:DeleteUserPool",
      "cognito-idp:AddCustomAttributes",
      "cognito-idp:GetUserPoolMfaConfig",
      "cognito-idp:SetUserPoolMfaConfig",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:ListTagsForResource",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:UpdateUserPoolClient",
      "cognito-idp:DeleteUserPoolClient",
      "cognito-idp:ListUserPoolClients",
      "cognito-idp:CreateGroup",
      "cognito-idp:GetGroup",
      "cognito-idp:UpdateGroup",
      "cognito-idp:DeleteGroup",
      "cognito-idp:ListGroups",
      "cognito-idp:ListUsers",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminResetUserPassword",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminListGroupsForUser",
    ]
    resources = [local.user_pool_arn]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
}

# Separate policy for the users API stack. IAM is global, so PassRole and role
# management have no region condition. Lambda, HTTP API, and log actions are
# limited to ap-southeast-1. This is not AdministratorAccess.
# inla-admin can pass only an inla-s-* role to Lambda, and can attach only the
# basic Lambda logging policy to that role. It still cannot change its own user.
# The API stack uploads the zip with UpdateFunctionCode, so this policy adds no
# artifact bucket. Project buckets remain on the frontend policy.
data "aws_iam_policy_document" "inla_admin_users_api" {
  statement {
    sid    = "ManageProjectLambdaFunctions"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:GetFunctionCodeSigningConfig",
      "lambda:GetFunctionRecursionConfig",
      "lambda:GetRuntimeManagementConfig",
      "lambda:GetPolicy",
      "lambda:ListVersionsByFunction",
      "lambda:ListAliases",
      "lambda:ListTags",
      "lambda:PublishVersion",
      "lambda:CreateAlias",
      "lambda:UpdateAlias",
      "lambda:GetAlias",
      "lambda:DeleteAlias",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:AddPermission",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
    ]
    resources = [
      local.lambda_arn,
      "${local.lambda_arn}:*",
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  # ListFunctions does not accept a function ARN.
  statement {
    sid       = "ListLambdaFunctionsInRegion"
    effect    = "Allow"
    actions   = ["lambda:ListFunctions"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  # HTTP API ids are assigned at create time, so this is every API in this
  # region. Paths are listed separately because a stage ARN is
  # /apis/{id}/stages/{name}, and TagResource is checked on that ARN.
  # GET, POST, PUT, PATCH, and DELETE create and manage the API, routes,
  # integrations, authorizers, stages, and deployments. TagResource,
  # UntagResource, and GET on /tags cover provider default tags.
  statement {
    sid    = "ManageProjectHttpApis"
    effect = "Allow"
    actions = [
      "apigateway:GET",
      "apigateway:POST",
      "apigateway:PUT",
      "apigateway:PATCH",
      "apigateway:DELETE",
      "apigateway:TagResource",
      "apigateway:UntagResource",
    ]
    resources = [
      "arn:aws:apigateway:${var.aws_region}::/apis",
      "arn:aws:apigateway:${var.aws_region}::/apis/*",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/routes",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/routes/*",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/integrations",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/integrations/*",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/authorizers",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/authorizers/*",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/stages",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/stages/*",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/deployments",
      "arn:aws:apigateway:${var.aws_region}::/apis/*/deployments/*",
      "arn:aws:apigateway:${var.aws_region}::/tags/*",
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "DescribeProjectLogGroups"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ManageProjectLambdaLogGroups"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DeleteLogGroup",
      "logs:PutLogEvents",
      "logs:PutRetentionPolicy",
      "logs:ListTagsForResource",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
    ]
    resources = [
      local.users_log_arn,
      "${local.users_log_arn}:*",
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ManageProjectLambdaRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:GetRole",
      "iam:DeleteRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:ListRoleTags",
      "iam:ListInstanceProfilesForRole",
      "iam:PutRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:ListRolePolicies",
      "iam:DetachRolePolicy",
      "iam:ListAttachedRolePolicies",
    ]
    resources = [local.users_role_arn]
  }

  statement {
    sid    = "AttachBasicLambdaLoggingPolicy"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
    ]
    resources = [local.users_role_arn]

    condition {
      test     = "ArnEquals"
      variable = "iam:PolicyARN"
      values   = ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
    }
  }

  statement {
    sid       = "PassProjectRoleToLambda"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [local.users_role_arn]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com"]
    }
  }

  # ListRoles cannot be limited to a role name. It does not allow changing roles.
  statement {
    sid       = "ListRoles"
    effect    = "Allow"
    actions   = ["iam:ListRoles"]
    resources = ["*"]
  }

  # The API stack reads this AWS managed policy when attaching it. It does not
  # create a customer managed policy; the Cognito permissions are an inline
  # role policy, already covered by PutRolePolicy above.
  statement {
    sid     = "ReadBasicLambdaLoggingPolicy"
    effect  = "Allow"
    actions = ["iam:GetPolicy", "iam:GetPolicyVersion"]
    resources = [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    ]
  }
}

resource "aws_iam_policy" "inla_admin" {
  name        = "${var.project_name}-frontend-infra"
  description = "Manage INLA-S frontend buckets in ap-southeast-1 and CloudFront distributions in this account. Does not grant IAM administration."
  policy      = data.aws_iam_policy_document.inla_admin.json
}

resource "aws_iam_policy" "inla_admin_cognito" {
  name        = "${var.project_name}-cognito"
  description = "Manage Cognito user pools, app clients, groups, and users in ap-southeast-1. Does not grant IAM administration."
  policy      = data.aws_iam_policy_document.inla_admin_cognito.json
}

resource "aws_iam_user_policy_attachment" "inla_admin" {
  user       = aws_iam_user.inla_admin.name
  policy_arn = aws_iam_policy.inla_admin.arn
}

resource "aws_iam_user_policy_attachment" "inla_admin_cognito" {
  user       = aws_iam_user.inla_admin.name
  policy_arn = aws_iam_policy.inla_admin_cognito.arn
}

resource "aws_iam_policy" "inla_admin_users_api" {
  name        = "${var.project_name}-users-api"
  description = "Provision the INLA-S users Lambda, HTTP API, execution role, and log group in ap-southeast-1. Does not grant AdministratorAccess."
  policy      = data.aws_iam_policy_document.inla_admin_users_api.json
}

resource "aws_iam_user_policy_attachment" "inla_admin_users_api" {
  user       = aws_iam_user.inla_admin.name
  policy_arn = aws_iam_policy.inla_admin_users_api.arn
}

resource "aws_iam_access_key" "inla_admin" {
  user = aws_iam_user.inla_admin.name

  depends_on = [
    aws_iam_user_policy_attachment.inla_admin,
    aws_iam_user_policy_attachment.inla_admin_cognito,
    aws_iam_user_policy_attachment.inla_admin_users_api,
  ]
}
