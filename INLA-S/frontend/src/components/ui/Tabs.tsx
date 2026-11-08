import { NavLink } from "react-router-dom";

export function TabRow({ tabs }: { tabs: { to: string; label: string; end?: boolean }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [
              "border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:text-[var(--color-action-primary)]",
              isActive
                ? "border-[var(--color-action-primary)] font-semibold text-[var(--color-action-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]",
            ].join(" ")
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export function quoteTabs(code: string): { to: string; label: string; end?: boolean }[] {
  const base = `/quotations/${encodeURIComponent(code)}`;
  return [
    { to: base, label: "Yêu cầu Sales", end: true },
    { to: `${base}/qa`, label: "Kỹ thuật (QA - R&D)" },
    { to: `${base}/consolidation`, label: "Tổng hợp" },
    { to: `${base}/accounting`, label: "Kế toán" },
    { to: `${base}/approval`, label: "Phê duyệt" },
    { to: `${base}/files`, label: "Tệp đính kèm" },
    { to: `${base}/history`, label: "Lịch sử" },
  ];
}

export type CustomerTabCounts = { contacts?: number; sales?: number; quotes?: number };

function tabLabel(base: string, count?: number): string {
  return count != null ? `${base} (${count})` : base;
}

export function customerTabs(code: string, counts: CustomerTabCounts = {}): { to: string; label: string; end?: boolean }[] {
  const base = `/customers/${encodeURIComponent(code)}`;
  return [
    { to: base, label: "Thông tin", end: true },
    { to: `${base}/contacts`, label: tabLabel("Người liên hệ", counts.contacts) },
    { to: `${base}/sales`, label: tabLabel("Sales liên quan", counts.sales) },
    { to: `${base}/quotes`, label: tabLabel("Báo giá", counts.quotes) },
    { to: `${base}/history`, label: "Lịch sử thay đổi" },
  ];
}
