locals {
  quotation_attachments_bucket_name = coalesce(
    var.quotation_attachments_bucket_name,
    "inla-s-${var.environment}-quotation-attachments"
  )
}

resource "aws_s3_bucket" "quotation_attachments" {
  bucket = local.quotation_attachments_bucket_name
}

resource "aws_s3_bucket_public_access_block" "quotation_attachments" {
  bucket = aws_s3_bucket.quotation_attachments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "quotation_attachments" {
  bucket = aws_s3_bucket.quotation_attachments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "quotation_attachments" {
  bucket = aws_s3_bucket.quotation_attachments.id

  cors_rule {
    allowed_headers = ["content-type", "x-amz-*"]
    allowed_methods = ["PUT", "HEAD", "GET"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }

  depends_on = [aws_s3_bucket_public_access_block.quotation_attachments]
}

data "aws_iam_policy_document" "quotation_attachments_s3" {
  statement {
    sid    = "QuotationAttachmentObjects"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]
    resources = ["${aws_s3_bucket.quotation_attachments.arn}/quotations/*"]
  }
}

resource "aws_iam_role_policy" "quotation_attachments_s3" {
  name   = "${local.name_prefix}-quotation-attachments-s3"
  role   = aws_iam_role.quotation.id
  policy = data.aws_iam_policy_document.quotation_attachments_s3.json
}
