/** UI labels for Cognito/API role codes (§2 Role Permission Matrix). Values sent to API stay as codes. */
const ROLE_LABELS: Record<string, string> = {
  SALES: "Nhân viên Sales",
  EXECUTOR: "Trưởng phòng Kế hoạch",
  QA: "QA",
  "R&D": "R&D",
  RND: "R&D",
  ACCOUNTING: "Kế toán",
  DIRECTOR: "Giám đốc",
  ADMIN: "Quản trị hệ thống",
};

export function roleDisplayLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return ROLE_LABELS[code] ?? code;
}
