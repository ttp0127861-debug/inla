export const badgeToneClasses = {
  neutral: "bg-[#f3f4f6] text-[#4b5563]",
  brand: "bg-[#f5ebe6] text-[var(--color-brand-primary)] tracking-[0.36px]",
  info: "bg-[#eff6ff] text-[var(--color-action-primary)]",
  ok: "bg-[#ecfdf5] text-[#047857]",
  warning: "bg-[#fff7ed] text-[#c2410c] font-bold",
  danger: "bg-[#fef2f2] text-[#b91c1c]",
  draft: "bg-[#f3f4f6] text-[#4b5563]",
} as const;

export type BadgeToneKey = keyof typeof badgeToneClasses;

export function badgeToneClass(tone: BadgeToneKey): string {
  return badgeToneClasses[tone];
}

const tones = badgeToneClasses;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[4px] px-2 text-xs leading-4 font-semibold ${tones[tone]} ${/quá hạn/i.test(children) ? "font-bold" : ""}`}
    >
      {children}
    </span>
  );
}

export function statusTone(label: string): keyof typeof tones {
  const value = label.toLowerCase();
  if (value.includes("quá hạn") || value.includes("từ chối") || value.includes("thất bại") || value.includes("khóa")) {
    return "danger";
  }
  if (value.includes("gần") || value.includes("còn") || value.includes("nháp") || value.includes("chờ")) {
    return "warning";
  }
  if (value.includes("hoạt động") || value.includes("trong hạn") || value.includes("thành công") || value.includes("phê duyệt") || value.includes("won")) {
    return "ok";
  }
  if (value.includes("xử lý") || value.includes("mới")) return "info";
  return "neutral";
}
