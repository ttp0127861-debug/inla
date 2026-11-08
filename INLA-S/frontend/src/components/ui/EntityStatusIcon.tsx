import type { EntityStatus } from "../../api/customers";
import { HoverTooltip } from "./HoverTooltip";

function labelFor(status: EntityStatus): string {
  return status === "active" ? "Hoạt động" : "Ngừng hoạt động";
}

function Glyph({ active }: { active: boolean }) {
  const className = `h-5 w-5 ${active ? "text-[#047857]" : "text-[#b91c1c]"}`;
  if (active) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5 11 15l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

export function EntityStatusIcon({ status }: { status: EntityStatus }) {
  const label = labelFor(status);
  const active = status === "active";

  return (
    <HoverTooltip title={label} lines={[label]}>
      <span
        tabIndex={0}
        role="img"
        aria-label={label}
        title={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)] focus-visible:ring-offset-1"
      >
        <Glyph active={active} />
      </span>
    </HoverTooltip>
  );
}
