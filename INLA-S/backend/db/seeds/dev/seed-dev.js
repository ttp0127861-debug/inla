/**
 * Dev customer seed — Neon dev branch only (never NODE_ENV=production).
 *
 * Re-seed (quotations reference customers — down quotations first):
 *   npm run seed:quotations:dev:down
 *   npm run seed:dev:down
 *   npm run seed:dev
 *   npm run seed:quotations:dev
 *
 * Validate TSV without DB: npm run seed:dev -- --check
 */
const fs = require("fs");
const path = require("path");
const { query, runWithRequestContext } = require("../../src/index.js");

const REPO_DIR = path.resolve(__dirname, "../../../repo");
const TSV_PATH = path.join(REPO_DIR, "customers.tsv");
const MAP_PATH = path.join(REPO_DIR, "sales-label-map.json");
const ACTOR = { username: "seed:dev", role: "SYSTEM", requestId: "seed-dev" };
/** Must match frontend `PROVINCE_OPTIONS` labels exactly (Customer UI MVP). */
const PROVINCES = ["TP. Hồ Chí Minh", "Hà Nội", "TP. Đà Nẵng"];

const MVP_TAX_ID = /^\d{10}$|^\d{13}$/;
const MVP_PHONE = /^\+84\d{8,11}$/;

/** VN mobile prefixes after +84 (no leading 0). */
const VN_MOBILE_PREFIXES = [
  "90",
  "91",
  "92",
  "93",
  "94",
  "96",
  "97",
  "98",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "70",
  "76",
  "77",
  "78",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "88",
  "89",
];

const STREET_LINES = [
  "123 Nguyễn Huệ",
  "45 Lê Lợi",
  "88 Pasteur",
  "12 Trần Hưng Đạo",
  "256 Cách Mạng Tháng Tám",
  "7 Hai Bà Trưng",
  "19 Phan Đình Phùng",
  "62 Nguyễn Thị Minh Khai",
  "101 Võ Văn Tần",
  "34 Lý Tự Trọng",
  "5 Nguyễn Văn Cừ",
  "220 Điện Biên Phủ",
  "18 Bà Triệu",
  "90 Lê Duẩn",
  "33 Trường Chinh",
  "71 Hoàng Văn Thụ",
  "14 Nguyễn Trãi",
  "28 Lê Văn Sỹ",
  "9 Đinh Tiên Hoàng",
  "55 Nguyễn Đình Chiểu",
  "41 Phạm Ngũ Lão",
  "66 Nguyễn Xí",
  "3 Lê Quang Định",
  "17 Trần Não",
];

function fnv1a(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mixHash(seed, round) {
  let h = fnv1a(`${seed}#${round}`);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return h >>> 0;
}

/** 10-digit business MST — deterministic, no SEED prefix. */
function vnTaxId(index, customerSlug, salt = 0) {
  let h = mixHash(`mst:${index}:${customerSlug}`, salt);
  let digits = "";
  for (let i = 0; i < 10; i += 1) {
    h = mixHash(`mst-digit:${index}:${customerSlug}:${salt}:${i}`, h);
    digits += String(h % 10);
  }
  if (/^0+$/.test(digits)) {
    return vnTaxId(index, customerSlug, salt + 1);
  }
  return digits;
}

/** +84 mobile — deterministic; suffix avoids long runs of zeros. */
function vnPhoneE164(index, customerSlug, role, salt = 0) {
  const h0 = mixHash(`phone:${role}:${index}:${customerSlug}`, salt);
  const prefix = VN_MOBILE_PREFIXES[h0 % VN_MOBILE_PREFIXES.length];
  let h = mixHash(`phone-body:${role}:${index}:${customerSlug}`, salt + 1);
  let suffix = "";
  for (let i = 0; i < 7; i += 1) {
    h = mixHash(`phone-digit:${role}:${index}:${i}`, h);
    suffix += String(h % 10);
  }
  if (/^0+$/.test(suffix) || /^(\d)\1{6}$/.test(suffix)) {
    return vnPhoneE164(index, customerSlug, role, salt + 1);
  }
  return `+84${prefix}${suffix}`;
}

function assertUniqueSeedIds(rows) {
  const taxIds = new Set();
  const phones = new Set();
  for (const row of rows) {
    if (taxIds.has(row.taxId)) {
      throw new Error(`Duplicate tax_id in seed batch: ${row.taxId} (${row.name}).`);
    }
    taxIds.add(row.taxId);
    if (phones.has(row.phone)) {
      throw new Error(`Duplicate customer phone in seed batch: ${row.phone} (${row.name}).`);
    }
    phones.add(row.phone);
    if (row.phone === row.contactPhone) {
      throw new Error(`Contact phone must differ from customer phone for ${row.name}.`);
    }
    if (row.taxId.startsWith("SEED")) {
      throw new Error(`tax_id must not use SEED prefix (${row.name}).`);
    }
    if (!MVP_TAX_ID.test(row.taxId)) {
      throw new Error(`tax_id must be 10 or 13 digits (${row.name}).`);
    }
    if (!MVP_PHONE.test(row.phone) || !MVP_PHONE.test(row.contactPhone)) {
      throw new Error(`Phone must match +84 and 8–11 digits (${row.name}).`);
    }
    if (!PROVINCES.includes(row.province)) {
      throw new Error(`province must be a known UI option (${row.name}: ${row.province}).`);
    }
  }
}

const SYNC_CUSTOMER_CODE_SEQ = `
SELECT CASE
  WHEN max_code IS NULL THEN setval('customer_code_seq', 1, false)
  ELSE setval('customer_code_seq', max_code, true)
END
FROM (
  SELECT MAX(CAST(SUBSTRING(code FROM 4) AS integer)) AS max_code
  FROM customers
  WHERE code ~ '^KH-[0-9]+$'
) AS codes
`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slug(name) {
  const ascii = name
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!ascii) throw new Error(`Cannot build an email slug from ${JSON.stringify(name)}.`);
  return ascii;
}

function loadRows() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  const lines = fs
    .readFileSync(TSV_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("customers.tsv has no data rows.");

  const slugs = new Set();
  const rows = lines.map((line, offset) => {
    const index = offset + 1;
    const parts = line.split("\t");
    if (parts.length !== 2) {
      throw new Error(`Row ${index} has ${parts.length} columns; expected customer_name and sales_label.`);
    }
    const name = parts[0].trim();
    const label = parts[1].trim();
    if (!name) throw new Error(`Row ${index} has an empty customer name.`);
    if (!Object.prototype.hasOwnProperty.call(map, label)) {
      throw new Error(`Row ${index} sales label ${JSON.stringify(label)} is not in sales-label-map.json.`);
    }
    const salesUsername = String(map[label]).trim().toLowerCase();
    if (!salesUsername) throw new Error(`Row ${index} maps ${JSON.stringify(label)} to an empty username.`);
    const customerSlug = slug(name);
    if (slugs.has(customerSlug)) throw new Error(`Row ${index} repeats email slug ${customerSlug}.`);
    slugs.add(customerSlug);
    const taxId = vnTaxId(index, customerSlug);
    const phone = vnPhoneE164(index, customerSlug, "customer");
    let contactPhone = vnPhoneE164(index, customerSlug, "contact");
    if (contactPhone === phone) {
      contactPhone = vnPhoneE164(index, customerSlug, "contact", 1);
    }
    return {
      index,
      name,
      label,
      salesUsername,
      taxId,
      phone,
      email: `seed+${customerSlug}@dev.inla.local`,
      addressLine: STREET_LINES[(index - 1) % STREET_LINES.length],
      province: PROVINCES[(index - 1) % PROVINCES.length],
      contactName: `Liên hệ ${name}`,
      contactEmail: `seed+${customerSlug}.contact@dev.inla.local`,
      contactPhone,
    };
  });
  assertUniqueSeedIds(rows);
  return rows;
}

function tuples(rowCount, columnCount, suffix) {
  const rows = [];
  let parameter = 1;
  for (let row = 0; row < rowCount; row += 1) {
    const columns = [];
    for (let column = 0; column < columnCount; column += 1) {
      columns.push(`$${parameter}::text`);
      parameter += 1;
    }
    rows.push(`(${columns.join(", ")}${suffix || ""})`);
  }
  return rows.join(", ");
}

function assertCounts(expected) {
  const count = Number(expected);
  if (!Number.isInteger(count) || count < 1) throw new Error("Seed count must be a positive integer.");
  return `
DO $$
BEGIN
  IF (SELECT count(*) FROM customers WHERE created_by = 'seed:dev') <> ${count} THEN
    RAISE EXCEPTION 'seed:dev customer count mismatch';
  END IF;
  IF (
    SELECT count(*)
    FROM customer_contacts AS contact
    JOIN customers AS customer ON customer.id = contact.customer_id
    WHERE customer.created_by = 'seed:dev'
  ) <> ${count} THEN
    RAISE EXCEPTION 'seed:dev contact count mismatch';
  END IF;
  IF (
    SELECT count(*)
    FROM customer_sales_relations AS relation
    JOIN customers AS customer ON customer.id = relation.customer_id
    WHERE customer.created_by = 'seed:dev' AND relation.status = 'active'
  ) <> ${count} THEN
    RAISE EXCEPTION 'seed:dev relation count mismatch';
  END IF;
END
$$;
`;
}

async function seed(rows) {
  const taxIds = rows.map((row) => row.taxId);
  const existing = await query(
    "SELECT count(*)::int AS n FROM customers WHERE created_by = $1 OR tax_id = ANY($2::text[])",
    ["seed:dev", taxIds]
  );
  if (Number(existing.rows[0].n) > 0) {
    throw new Error("Dev seed rows already exist. Run npm run seed:dev:down before seeding again.");
  }

  const customerParams = rows.flatMap((row) => [row.name, row.taxId, row.phone, row.email, row.addressLine, row.province]);
  const contactParams = rows.flatMap((row) => [row.taxId, row.contactName, row.contactEmail, row.contactPhone]);
  const relationParams = rows.flatMap((row) => [row.taxId, row.salesUsername]);

  await runWithRequestContext(ACTOR, (txn) => [
    txn.query(
      `INSERT INTO customers (
         name, tax_id, phone, email, address_line, province, customer_type, status, created_by, updated_by
       ) VALUES ${tuples(rows.length, 6, ", 'business', 'active', 'seed:dev', 'seed:dev'")}`,
      customerParams
    ),
    txn.query(
      `INSERT INTO customer_contacts (customer_id, full_name, email, phone, is_primary, status)
       SELECT customer.id, seed.full_name, seed.email, seed.phone, true, 'active'
       FROM customers AS customer
       JOIN (VALUES ${tuples(rows.length, 4)}) AS seed(tax_id, full_name, email, phone)
         ON customer.tax_id = seed.tax_id
       WHERE customer.created_by = 'seed:dev'`,
      contactParams
    ),
    txn.query(
      `INSERT INTO customer_sales_relations (customer_id, sales_username, status, created_by)
       SELECT customer.id, seed.sales_username, 'active', 'seed:dev'
       FROM customers AS customer
       JOIN (VALUES ${tuples(rows.length, 2)}) AS seed(tax_id, sales_username)
         ON customer.tax_id = seed.tax_id
       WHERE customer.created_by = 'seed:dev'`,
      relationParams
    ),
    txn.query(assertCounts(rows.length)),
    txn.query(SYNC_CUSTOMER_CODE_SEQ),
  ]);
  console.log(`Seeded ${rows.length} dev customers.`);
}

async function removeSeed() {
  const results = await runWithRequestContext(ACTOR, (txn) => [
    txn.query(
      "DELETE FROM customer_sales_relations WHERE customer_id IN (SELECT id FROM customers WHERE created_by = 'seed:dev')"
    ),
    txn.query(
      "DELETE FROM customer_contacts WHERE customer_id IN (SELECT id FROM customers WHERE created_by = 'seed:dev')"
    ),
    txn.query("DELETE FROM customers WHERE created_by = 'seed:dev'"),
    txn.query(SYNC_CUSTOMER_CODE_SEQ),
  ]);
  console.log(`Removed ${results[2].rowCount} dev customers.`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    fail("seed:dev must not run when NODE_ENV=production.");
  }
  const checkOnly = process.argv.includes("--check");
  const down = process.argv.includes("--down");
  try {
    const rows = down ? null : loadRows();
    if (checkOnly) {
      console.log(`Validated ${rows.length} customers from customers.tsv.`);
      return;
    }
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      fail("DATABASE_URL is not configured. Point it at a Neon dev branch, run npm run migrate, then npm run seed:dev.");
    }
    if (down) await removeSeed();
    else await seed(rows);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    fail(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadRows, tuples };
