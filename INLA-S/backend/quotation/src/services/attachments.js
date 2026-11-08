const { randomUUID } = require("crypto");
const { query, runWithRequestContext } = require("inla-s-db");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { fail } = require("../lib/http");
const { getPrincipal } = require("../middleware/auth");
const { mapAttachment } = require("./mappers");

const MAX_FILES_PER_SCOPE = 10;

/** ATT-007/008: section must match caller role. */
const SECTION_ROLE = {
  sales: "SALES",
  qa: "QA",
  rnd: "R&D",
  executor_intake: "EXECUTOR",
  executor_consolidation: "EXECUTOR",
  accounting: "ACCOUNTING",
};

function assertSectionRole(section, role) {
  const expected = SECTION_ROLE[section];
  if (!expected || expected !== role) {
    return fail(403, "FORBIDDEN", "Attachment section does not match your role.");
  }
  return null;
}

function attachmentBucket() {
  return process.env.ATTACHMENTS_BUCKET || "";
}

function s3Client() {
  return new S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });
}

async function listAttachments(row, { cycleId, section }, pagination) {
  const params = [row.id];
  const where = ["quotation_id = $1", "deleted_at IS NULL"];
  if (cycleId) {
    params.push(cycleId);
    where.push(`cycle_id = $${params.length}`);
  }
  if (section) {
    params.push(section);
    where.push(`section = $${params.length}::attachment_section_enum`);
  }
  const whereSql = where.join(" AND ");
  const countResult = await query(
    `SELECT count(*)::int AS total FROM quotation_attachments WHERE ${whereSql}`,
    params
  );
  params.push(pagination.pageSize);
  const limitIdx = params.length;
  params.push(pagination.offset);
  const offsetIdx = params.length;
  const result = await query(
    `SELECT * FROM quotation_attachments WHERE ${whereSql}
     ORDER BY uploaded_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  return {
    attachments: result.rows.map(mapAttachment),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: countResult.rows[0].total,
  };
}

async function presignUpload(event, row, { fileName, mimeType, section, size }) {
  const bucket = attachmentBucket();
  if (!bucket) {
    return fail(500, "INTERNAL_ERROR", "ATTACHMENTS_BUCKET is not configured.");
  }
  const { username, role } = getPrincipal(event);
  const roleDenied = assertSectionRole(section, role);
  if (roleDenied) return roleDenied;
  const ext = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  const storageKey = `quotations/${row.id}/${row.current_cycle_id}/${section}/${randomUUID()}.${ext}`;

  const count = await query(
    `SELECT count(*)::int AS n FROM quotation_attachments
     WHERE cycle_id = $1 AND section = $2::attachment_section_enum
       AND uploaded_by_role = $3 AND deleted_at IS NULL`,
    [row.current_cycle_id, section, role]
  );
  if (count.rows[0].n >= MAX_FILES_PER_SCOPE) {
    return fail(409, "CONFLICT", "Maximum 10 attachments per role and section.");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: size,
  });
  const uploadUrl = await getSignedUrl(s3Client(), command, { expiresIn: 900 });
  return { uploadUrl, storageKey, expiresInSeconds: 900 };
}

async function confirmUpload(event, row, body) {
  const bucket = attachmentBucket();
  if (!bucket) {
    return fail(500, "INTERNAL_ERROR", "ATTACHMENTS_BUCKET is not configured.");
  }
  if (!body.storageKey.startsWith(`quotations/${row.id}/`)) {
    return fail(400, "VALIDATION_ERROR", "Invalid storageKey for this quotation.");
  }
  const { username, role } = getPrincipal(event);
  const roleDenied = assertSectionRole(body.section, role);
  if (roleDenied) return roleDenied;
  const ext = body.fileName.includes(".") ? body.fileName.split(".").pop().toLowerCase() : null;

  const count = await query(
    `SELECT count(*)::int AS n FROM quotation_attachments
     WHERE cycle_id = $1 AND section = $2::attachment_section_enum
       AND uploaded_by_role = $3 AND deleted_at IS NULL`,
    [row.current_cycle_id, body.section, role]
  );
  if (count.rows[0].n >= MAX_FILES_PER_SCOPE) {
    return fail(409, "CONFLICT", "Maximum 10 attachments per role and section.");
  }

  const results = await runWithRequestContext(event, (txn) => [
    txn.query(
      `INSERT INTO quotation_attachments (
         quotation_id, cycle_id, section, file_name, file_extension, mime_type, file_size_bytes,
         storage_key, uploaded_by, uploaded_by_role
       ) VALUES ($1,$2,$3::attachment_section_enum,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        row.id,
        row.current_cycle_id,
        body.section,
        body.fileName,
        ext,
        body.mimeType,
        body.size,
        body.storageKey,
        username,
        role,
      ]
    ),
  ]);
  return { attachment: mapAttachment(results[0].rows[0]) };
}

async function softDeleteAttachment(event, row, attachmentId) {
  const existing = await query(
    `SELECT * FROM quotation_attachments WHERE id = $1 AND quotation_id = $2 AND deleted_at IS NULL`,
    [attachmentId, row.id]
  );
  const att = existing.rows[0];
  if (!att) return fail(404, "NOT_FOUND", "Attachment not found.");
  const { username, role } = getPrincipal(event);
  if (att.uploaded_by !== username) {
    return fail(403, "FORBIDDEN", "You can only delete your own attachments.");
  }

  await runWithRequestContext(event, (txn) => [
    txn.query(`UPDATE quotation_attachments SET deleted_at = now() WHERE id = $1`, [attachmentId]),
  ]);
  return { ok: true };
}

module.exports = { listAttachments, presignUpload, confirmUpload, softDeleteAttachment };
