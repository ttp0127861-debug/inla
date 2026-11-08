import { normalizePhoneInput } from "../../lib/phoneVN";
import { PROVINCE_OPTIONS } from "../../lib/vietnamProvinces";

export const PHONE_VN_PATTERN = /^\+84\d{8,11}$/;

export function validatePhoneField(display: string): string | undefined {
  if (!display.trim()) return "Nhập số điện thoại.";
  const normalized = normalizePhoneInput(display.trim());
  if (!PHONE_VN_PATTERN.test(normalized)) return "Số điện thoại không hợp lệ.";
  return undefined;
}

export function validateEmailField(email: string): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Nhập email hợp lệ.";
  return undefined;
}

export function validateTaxIdField(taxId: string): string | undefined {
  const trimmed = taxId.trim();
  if (!trimmed) return "Nhập mã số thuế.";
  if (!/^\d{10}$|^\d{13}$/.test(trimmed)) return "Mã số thuế gồm 10 hoặc 13 chữ số.";
  return undefined;
}

export function validateProvinceField(province: string): string | undefined {
  const trimmed = province.trim();
  if (!trimmed) return "Nhập Tỉnh/Thành phố.";
  if (!(PROVINCE_OPTIONS as readonly string[]).includes(trimmed)) return "Chọn Tỉnh/Thành phố trong danh sách.";
  return undefined;
}

export function validateWebsiteField(website: string | undefined): string | undefined {
  const trimmed = (website ?? "").trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Website phải bắt đầu bằng http:// hoặc https://.";
    }
  } catch {
    return "Website phải bắt đầu bằng http:// hoặc https://.";
  }
  return undefined;
}
