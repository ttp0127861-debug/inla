import type { ReactNode } from "react";

type HoverTooltipProps = {
  /** Plain-text fallback for native tooltip */
  title: string;
  /** Tooltip body; use lines for multi-line */
  lines?: string[];
  children: ReactNode;
};

export function HoverTooltip({ title, lines, children }: HoverTooltipProps) {
  const body = lines?.filter(Boolean) ?? [title];

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 max-w-xs -translate-x-1/2 rounded bg-[#111827] px-2 py-1 text-left text-xs leading-snug text-white opacity-0 shadow transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {body.map((line, index) => (
          <span key={line} className={index > 0 ? "mt-0.5 block text-[11px] text-[#e5e7eb]" : "block whitespace-nowrap"}>
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}
