import type { CycleType } from "../../api/quotations";
import { cycleTypeDisplayLabel } from "../../lib/quotationLabels";

export function CycleTypeBadge({ cycleType }: { cycleType: CycleType | string | null | undefined }) {
  const label = cycleTypeDisplayLabel(cycleType ?? undefined);
  if (label === "—") return <span>—</span>;

  return (
    <span className="inline-flex h-[26px] items-center rounded-[4px] bg-[#eff6ff] px-2 text-xs font-semibold tracking-[0.36px] text-[var(--color-action-primary)]">
      {label}
    </span>
  );
}
