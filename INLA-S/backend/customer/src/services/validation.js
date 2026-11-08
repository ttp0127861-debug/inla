const { PROVINCE_SET } = require("../lib/vietnamProvinces");

const CUSTOMER_TYPES = ["business", "individual"];
const STATUSES = ["active", "inactive"];
const TAX_ID_RE = /^\d{10}$|^\d{13}$/;

function cleanText(value, maxLen) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text || text.length > maxLen || /[\u0000-\u001F]/.test(text)) return null;
  return text;
}

function cleanOptionalText(value, maxLen) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  if (!text || text.length > maxLen || /[\u0000-\u001F]/.test(text)) return null;
  return text;
}

function cleanEmailFormat(value) {
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  return email;
}

function cleanEmailOptional(value) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  return cleanEmailFormat(value);
}

function cleanPhone(value) {
  if (value === undefined) return undefined;
  const compact = String(value).replace(/[\s().-]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  if (!/^84\d{8,11}$/.test(digits)) return null;
  return `+${digits}`;
}

function cleanTaxId(value) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!TAX_ID_RE.test(text)) return null;
  return text;
}

function cleanProvince(value) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!text || !PROVINCE_SET.has(text)) return null;
  return text;
}

function cleanWebsite(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const text = String(value).trim();
  if (!text || text.length > 500) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return text;
  } catch {
    return null;
  }
}

function cleanEnum(value, allowed) {
  if (value === undefined) return undefined;
  return allowed.includes(value) ? value : null;
}

function cleanBool(value) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return null;
}

function invalid(field, message) {
  const error = new Error(message || `Invalid ${field}.`);
  error.name = "ValidationError";
  return error;
}

function parseCreateCustomer(body) {
  const customerType = cleanEnum(body.customerType, CUSTOMER_TYPES);
  const name = cleanText(body.name, 500);
  const shortName = cleanOptionalText(body.shortName, 200);
  const taxId = cleanTaxId(body.taxId);
  const phone = cleanPhone(body.phone);
  const email = cleanEmailOptional(body.email);
  const addressLine = cleanText(body.addressLine, 500);
  const province = cleanProvince(body.province);
  const website = cleanWebsite(body.website);
  const notes = cleanOptionalText(body.notes, 2000);
  if (!customerType) throw invalid("customerType");
  if (!name) throw invalid("name", "Nhập tên khách hàng.");
  if (!taxId) throw invalid("taxId", "Mã số thuế gồm 10 hoặc 13 chữ số.");
  if (!phone) throw invalid("phone", "Số điện thoại không hợp lệ (+84, 8–11 chữ số).");
  if (body.email !== undefined && body.email !== null && String(body.email).trim() && email === null) {
    throw invalid("email", "Nhập email hợp lệ.");
  }
  if (!addressLine) throw invalid("addressLine", "Nhập địa chỉ.");
  if (!province) throw invalid("province", "Chọn Tỉnh/Thành phố trong danh sách.");
  if (body.website !== undefined && body.website !== null && String(body.website).trim() && website === null) {
    throw invalid("website", "Website phải bắt đầu bằng http:// hoặc https://.");
  }
  return {
    customerType,
    name,
    shortName,
    taxId,
    phone,
    email: email ?? null,
    addressLine,
    province,
    website,
    notes,
  };
}

function parseUpdateCustomer(body) {
  const customerType = cleanEnum(body.customerType, CUSTOMER_TYPES);
  const name = cleanText(body.name, 500);
  const shortName = body.shortName === null ? null : cleanOptionalText(body.shortName, 200);
  const taxId = body.taxId !== undefined ? cleanTaxId(body.taxId) : undefined;
  const phone = body.phone !== undefined ? cleanPhone(body.phone) : undefined;
  let email;
  if (body.email !== undefined) {
    email = cleanEmailOptional(body.email);
    if (body.email !== null && String(body.email).trim() && email === null) {
      throw invalid("email", "Nhập email hợp lệ.");
    }
  }
  const addressLine = body.addressLine !== undefined ? cleanText(body.addressLine, 500) : undefined;
  const province = body.province !== undefined ? cleanProvince(body.province) : undefined;
  const website = body.website === undefined ? undefined : cleanWebsite(body.website);
  const notes = body.notes === undefined ? undefined : body.notes === null ? null : cleanOptionalText(body.notes, 2000);
  if (body.customerType !== undefined && !customerType) throw invalid("customerType");
  if (body.name !== undefined && !name) throw invalid("name", "Nhập tên khách hàng.");
  if (body.taxId !== undefined && !taxId) throw invalid("taxId", "Mã số thuế gồm 10 hoặc 13 chữ số.");
  if (body.phone !== undefined && !phone) throw invalid("phone", "Số điện thoại không hợp lệ (+84, 8–11 chữ số).");
  if (body.addressLine !== undefined && !addressLine) throw invalid("addressLine", "Nhập địa chỉ.");
  if (body.province !== undefined && !province) throw invalid("province", "Chọn Tỉnh/Thành phố trong danh sách.");
  if (body.shortName !== undefined && body.shortName !== null && !shortName) throw invalid("shortName");
  if (
    body.website !== undefined &&
    body.website !== null &&
    String(body.website).trim() &&
    website === null
  ) {
    throw invalid("website", "Website phải bắt đầu bằng http:// hoặc https://.");
  }
  if (body.notes !== undefined && body.notes !== null && !notes) throw invalid("notes");
  const update = {};
  if (customerType) update.customerType = customerType;
  if (name) update.name = name;
  if (body.shortName !== undefined) update.shortName = shortName;
  if (taxId) update.taxId = taxId;
  if (phone) update.phone = phone;
  if (email !== undefined) update.email = email;
  if (addressLine) update.addressLine = addressLine;
  if (province) update.province = province;
  if (body.website !== undefined) update.website = website;
  if (body.notes !== undefined) update.notes = notes;
  if (Object.keys(update).length === 0) throw invalid("body");
  return update;
}

function parseCreateContact(body) {
  const fullName = cleanText(body.fullName, 200);
  const jobTitle = cleanOptionalText(body.jobTitle, 200);
  const department = cleanOptionalText(body.department, 200);
  const email = cleanEmailFormat(body.email);
  const phone = cleanPhone(body.phone);
  const notes = cleanOptionalText(body.notes, 2000);
  const isPrimary = cleanBool(body.isPrimary);
  if (!fullName) throw invalid("fullName");
  if (!email) throw invalid("email", "Nhập email hợp lệ.");
  if (!phone) throw invalid("phone", "Số điện thoại không hợp lệ (+84, 8–11 chữ số).");
  if (body.isPrimary !== undefined && isPrimary === null) throw invalid("isPrimary");
  return {
    fullName,
    jobTitle,
    department,
    email,
    phone,
    notes,
    isPrimary: isPrimary === true,
  };
}

function parseUpdateContact(body) {
  const fullName = cleanText(body.fullName, 200);
  const jobTitle = body.jobTitle === null ? null : cleanOptionalText(body.jobTitle, 200);
  const department = body.department === null ? null : cleanOptionalText(body.department, 200);
  const email = body.email !== undefined ? cleanEmailFormat(body.email) : undefined;
  const phone = body.phone !== undefined ? cleanPhone(body.phone) : undefined;
  const notes = body.notes === null ? null : body.notes !== undefined ? cleanOptionalText(body.notes, 2000) : undefined;
  const isPrimary = cleanBool(body.isPrimary);
  if (body.fullName !== undefined && !fullName) throw invalid("fullName");
  if (body.email !== undefined && !email) throw invalid("email", "Nhập email hợp lệ.");
  if (body.phone !== undefined && !phone) throw invalid("phone");
  if (body.isPrimary !== undefined && isPrimary === null) throw invalid("isPrimary");
  const update = {};
  if (fullName) update.fullName = fullName;
  if (body.jobTitle !== undefined) update.jobTitle = jobTitle;
  if (body.department !== undefined) update.department = department;
  if (email) update.email = email;
  if (phone) update.phone = phone;
  if (body.notes !== undefined) update.notes = notes;
  if (isPrimary !== undefined) update.isPrimary = isPrimary;
  if (Object.keys(update).length === 0) throw invalid("body");
  return update;
}

function parseAddSales(body) {
  const salesUsername = cleanEmailFormat(body.salesUsername) || cleanText(body.salesUsername, 254);
  if (!salesUsername) throw invalid("salesUsername");
  return { salesUsername: salesUsername.toLowerCase() };
}

function phoneSearchPatterns(q) {
  const trimmed = String(q).trim();
  const compact = trimmed.replace(/[\s().-]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  else if (/^\d+$/.test(digits) && !digits.startsWith("84")) digits = `84${digits}`;
  const patterns = [`%${trimmed}%`, `%${compact}%`];
  if (/^84\d{3,}$/.test(digits)) {
    patterns.push(`%+${digits}%`, `%${digits.slice(2)}%`);
  }
  return [...new Set(patterns)];
}

function parseListFilters(query) {
  const customerType = query?.customerType ? cleanEnum(query.customerType, CUSTOMER_TYPES) : null;
  const status = query?.status ? cleanEnum(query.status, STATUSES) : null;
  const province = query?.province ? cleanProvince(query.province) : null;
  const q = query?.q ? String(query.q).trim().slice(0, 200) : null;
  if (query?.customerType && !customerType) throw invalid("customerType");
  if (query?.status && !status) throw invalid("status");
  if (query?.province && !province) throw invalid("province");
  return { customerType, status, province, q };
}

module.exports = {
  parseCreateCustomer,
  parseUpdateCustomer,
  parseCreateContact,
  parseUpdateContact,
  parseAddSales,
  parseListFilters,
  phoneSearchPatterns,
};
