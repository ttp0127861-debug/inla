const ROLES = ["ADMIN", "DIRECTOR", "EXECUTOR", "SALES", "QA", "R&D", "ACCOUNTING"];
const LEVELS = ["manager", "staff"];

function cleanName(value) {
  if (value === undefined) return undefined;
  const name = String(value).trim().replace(/\s+/g, " ");
  if (!name || name.length > 100 || /[\u0000-\u001F]/.test(name)) return null;
  return name;
}

function cleanEmail(value) {
  if (value === undefined) return undefined;
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  return email;
}

function cleanPhone(value) {
  if (value === undefined) return undefined;
  const compact = String(value).replace(/[\s().-]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  if (!/^84\d{8,11}$/.test(digits)) return null;
  return `+${digits}`;
}

function cleanRole(value) {
  if (value === undefined) return undefined;
  return ROLES.includes(value) ? value : null;
}

function cleanLevel(value) {
  if (value === undefined) return undefined;
  return LEVELS.includes(value) ? value : null;
}

function invalid(field) {
  const error = new Error(`Invalid ${field}.`);
  error.name = "ValidationError";
  return error;
}

function parseCreate(body) {
  const email = cleanEmail(body.email);
  const name = cleanName(body.name);
  const phoneNumber = cleanPhone(body.phoneNumber);
  const role = cleanRole(body.role);
  const level = cleanLevel(body.level);
  if (!email) throw invalid("email");
  if (!name) throw invalid("name");
  if (!phoneNumber) throw invalid("phoneNumber");
  if (!role) throw invalid("role");
  if (!level) throw invalid("level");
  return { email, name, phoneNumber, role, level };
}

function parseUpdate(body) {
  const name = cleanName(body.name);
  const phoneNumber = cleanPhone(body.phoneNumber);
  const role = cleanRole(body.role);
  const level = cleanLevel(body.level);
  if (body.name !== undefined && !name) throw invalid("name");
  if (body.phoneNumber !== undefined && !phoneNumber) throw invalid("phoneNumber");
  if (body.role !== undefined && !role) throw invalid("role");
  if (body.level !== undefined && !level) throw invalid("level");
  if (body.email !== undefined) throw invalid("email");
  const update = {};
  if (name) update.name = name;
  if (phoneNumber) update.phoneNumber = phoneNumber;
  if (role) update.role = role;
  if (level) update.level = level;
  if (Object.keys(update).length === 0) throw invalid("body");
  return update;
}

module.exports = { ROLES, parseCreate, parseUpdate };
