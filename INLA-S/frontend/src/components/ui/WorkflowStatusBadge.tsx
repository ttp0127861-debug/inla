import type { WorkflowStatus } from "../../api/quotations";
import { workflowStatusLabel, workflowStatusVariantClass } from "../../lib/quotationLabels";

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus | string }) {
  const label = workflowStatusLabel(status as WorkflowStatus);
  return (
    <span
      className={`inline-flex h-[26px] max-w-full items-center rounded-[4px] px-2 text-xs font-semibold leading-4 ${workflowStatusVariantClass(status as WorkflowStatus)}`}
    >
      {label}
    </span>
  );
}
