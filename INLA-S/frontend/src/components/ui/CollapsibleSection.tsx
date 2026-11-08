import type { ReactNode } from "react";

function CollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
  trailing,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <fieldset
      className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 ${open ? "pb-4 pt-1" : "pb-1 pt-1"}`}
    >
      <legend className="flex w-full items-center justify-between gap-2 px-1 text-sm font-semibold text-[var(--color-text-strong)]">
        <button type="button" className="inline-flex cursor-pointer items-center gap-1.5" onClick={onToggle} aria-expanded={open}>
          {title}
          <CollapseChevron open={open} />
        </button>
        {trailing}
      </legend>
      {open ? <div className="mt-4">{children}</div> : null}
    </fieldset>
  );
}

export function CircleIconButton({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "add" | "remove";
  onClick: () => void;
  disabled?: boolean;
}) {
  const tone =
    variant === "add"
      ? "border-[var(--color-action-primary)] text-[var(--color-action-primary)] hover:bg-[#eff6ff]"
      : "border-[var(--color-semantic-error)] text-[var(--color-semantic-error)] hover:bg-[#fef2f2]";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-white text-lg leading-none font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {variant === "add" ? "+" : "−"}
    </button>
  );
}
