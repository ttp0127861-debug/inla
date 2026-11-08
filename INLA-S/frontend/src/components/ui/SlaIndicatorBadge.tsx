import { slaAlertLabel, slaIndicatorVariant, type SlaIndicatorVariant } from "../../lib/quotationLabels";

const styles: Record<SlaIndicatorVariant, string> = {
  on_track: "text-[#4b5563]",
  due_soon: "bg-[#fff7ed] font-semibold text-[#c2410c]",
  overdue: "bg-[#fef2f2] font-bold text-[#b91c1c]",
};

type SlaIndicatorBadgeProps = {
  state: string | null | undefined;
  label?: string | null;
};

export function SlaIndicatorBadge({ state, label }: SlaIndicatorBadgeProps) {
  const variant = slaIndicatorVariant(state);
  const text = label ?? slaAlertLabel(state) ?? "Trong hạn";

  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1.5 rounded-[4px] px-2 text-xs leading-4 ${styles[variant]}`}
    >
      {variant === "on_track" ? (
        <img src="/icons/sla-clock.svg" alt="" className="size-4 shrink-0 opacity-80" aria-hidden />
      ) : (
        <img src="/icons/sla-warning.svg" alt="" className="size-4 shrink-0" aria-hidden />
      )}
      <span>{text}</span>
    </span>
  );
}
