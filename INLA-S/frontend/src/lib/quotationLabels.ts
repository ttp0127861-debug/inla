import type { BusinessOutcome, QuotationTask, TaskStatus, TaskType, WorkflowStatus } from "../api/quotations";

type BadgeTone = "neutral" | "brand" | "info" | "ok" | "warning" | "danger" | "draft";

export function workflowStatusLabel(status: WorkflowStatus): string {
  const map: Record<WorkflowStatus, string> = {
    draft: "Bản nháp",
    cancelled: "Đã hủy",
    executor_intake: "Chờ phòng điều phối tiếp nhận",
    qa_rnd_review: "QA / R&D đánh giá",
    executor_consolidation: "Tổng hợp báo giá",
    accounting_review: "Kế toán xử lý",
    director_review: "Chờ phê duyệt",
    approved: "Đã phê duyệt",
    rejected: "Từ chối phê duyệt",
  };
  return map[status] ?? status;
}

export function workflowStatusTone(status: WorkflowStatus): BadgeTone {
  if (status === "draft") return "draft";
  if (status === "cancelled" || status === "rejected") return "danger";
  if (status === "approved") return "ok";
  if (status === "director_review") return "warning";
  return "info";
}

export function businessOutcomeLabel(outcome: BusinessOutcome): string {
  const map: Record<BusinessOutcome, string> = {
    not_updated: "Chưa có kết quả",
    sent_to_customer: "Đã gửi KH",
    won: "Thành công (Won)",
    lost: "Thất bại (Lost)",
  };
  return map[outcome] ?? outcome;
}

export function businessOutcomeTone(outcome: BusinessOutcome): BadgeTone {
  if (outcome === "won") return "ok";
  if (outcome === "lost") return "danger";
  if (outcome === "sent_to_customer") return "info";
  return "neutral";
}

/** API / filter values (unchanged). */
export function cycleTypeLabel(cycleType: string | undefined): string {
  if (cycleType === "re_submit") return "RE_SUBMIT";
  if (cycleType === "new") return "NEW";
  return cycleType ?? "—";
}

/** Figma cycle badge labels. */
export function cycleTypeDisplayLabel(cycleType: string | undefined): string {
  if (cycleType === "re_submit") return "GỬI LẠI";
  if (cycleType === "new") return "TẠO MỚI";
  return cycleType ?? "—";
}

export type SlaIndicatorVariant = "on_track" | "due_soon" | "overdue";

export function normalizeSlaAlertState(state: string | null | undefined): string {
  if (!state || state === "none") return "normal";
  const folded = state.trim().toLowerCase();
  if (folded === "ok" || folded === "on_time" || folded === "đúng hạn" || folded === "dung han") return "normal";
  if (folded === "late" || folded === "trễ hạn" || folded === "tre han") return "overdue";
  if (folded === "on_track") return "normal";
  if (folded === "due_soon") return "warning";
  return state;
}

export function slaIndicatorVariant(state: string | null | undefined): SlaIndicatorVariant {
  const normalized = normalizeSlaAlertState(state);
  if (normalized === "overdue") return "overdue";
  if (normalized === "warning" || normalized === "due_soon") return "due_soon";
  return "on_track";
}

export function workflowStatusVariantClass(status: WorkflowStatus): string {
  if (status === "draft") return "bg-[#f3f4f6] text-[#4b5563]";
  if (status === "cancelled" || status === "rejected") return "bg-[#fef2f2] text-[#b91c1c]";
  if (status === "approved") return "bg-[#ecfdf5] text-[#047857]";
  if (status === "director_review") return "bg-[#fff7ed] text-[#c2410c]";
  return "bg-[#eff6ff] text-[var(--color-action-primary)]";
}

export function taskTypeLabel(taskType: TaskType): string {
  const map: Record<TaskType, string> = {
    executor_intake: "Phòng điều phối tiếp nhận",
    qa_review: "QA đánh giá",
    rnd_review: "R&D đánh giá",
    executor_consolidation: "Tổng hợp báo giá",
    accounting_review: "Kế toán",
    director_review: "Phê duyệt Giám đốc",
  };
  return map[taskType] ?? taskType;
}

export function taskStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: "Chưa bắt đầu",
    in_progress: "Đang xử lý",
    completed: "Hoàn thành",
    skipped: "Bỏ qua",
  };
  return map[status] ?? status;
}

export function slaAlertLabel(state: string | null | undefined): string | null {
  const normalized = normalizeSlaAlertState(state);
  if (!normalized || normalized === "none") return null;
  const map: Record<string, string> = {
    normal: "Trong hạn",
    warning: "Gần đến hạn",
    overdue: "Quá hạn",
    on_track: "Trong hạn",
    due_soon: "Gần đến hạn",
  };
  return map[normalized] ?? state ?? null;
}

export function slaAlertTone(state: string | null | undefined): BadgeTone {
  const variant = slaIndicatorVariant(state);
  if (variant === "overdue") return "danger";
  if (variant === "due_soon") return "warning";
  if (variant === "on_track") return "ok";
  return "neutral";
}

export function activeSlaTask(tasks: QuotationTask[] | undefined): QuotationTask | null {
  if (!tasks?.length) return null;
  const open = tasks.filter((t) => t.taskStatus === "in_progress" && t.slaAlertState && t.slaAlertState !== "none");
  return open[0] ?? tasks.find((t) => t.taskStatus === "in_progress") ?? null;
}
