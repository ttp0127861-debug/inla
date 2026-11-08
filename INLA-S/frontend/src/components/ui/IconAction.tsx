import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { HoverTooltip } from "./HoverTooltip";

const variantClass = {
  primary: "text-[var(--color-action-primary)] hover:bg-[#eff6ff] focus-visible:ring-[var(--color-action-primary)]",
  danger: "text-[#b91c1c] hover:bg-[#fef2f2] focus-visible:ring-[#b91c1c]",
  muted: "text-[var(--color-text-muted)] hover:bg-[#f3f4f6] focus-visible:ring-[#9ca3af]",
} as const;

type IconActionProps = {
  label: string;
  icon: ReactNode;
  variant?: keyof typeof variantClass;
  disabled?: boolean;
  to?: string;
  onClick?: () => void;
};

const shell =
  "inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export function IconAction({ label, icon, variant = "primary", disabled, to, onClick }: IconActionProps) {
  const className = `${shell} ${variantClass[variant]}`;

  const content = to ? (
    <Link to={to} className={className} aria-label={label} title={label}>
      {icon}
    </Link>
  ) : (
    <button type="button" className={className} aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {icon}
    </button>
  );

  return (
    <HoverTooltip title={label} lines={[label]}>
      {content}
    </HoverTooltip>
  );
}
