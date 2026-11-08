/** Display: API +84… → local 0… */
export function formatPhoneDisplay(stored: string | null | undefined): string {
  if (!stored) return "—";
  const raw = stored.trim();
  if (!raw) return "—";
  if (raw.startsWith("+84")) {
    const rest = raw.slice(3).replace(/\D/g, "");
    return rest ? `0${rest}` : raw;
  }
  if (raw.startsWith("84") && raw.length >= 10 && /^\d+$/.test(raw)) {
    return `0${raw.slice(2)}`;
  }
  return raw;
}

/** Submit: accept 0… or +84… for backend cleanPhone */
export function normalizePhoneInput(display: string): string {
  const trimmed = display.trim();
  if (!trimmed) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (digits.startsWith("84") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  if (digits.length >= 9) return `+84${digits}`;
  return trimmed;
}
