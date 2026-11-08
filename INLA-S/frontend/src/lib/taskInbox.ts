import {
  listTaskInbox,
  type QuotationTask,
  type TaskInboxItem,
  type TaskType,
  type WorkflowStatus,
} from "../api/quotations";
import { DEFAULT_PAGE_SIZE } from "./pagination";
import { cycleTypeLabel, slaAlertLabel, taskTypeLabel } from "./quotationLabels";
import { quoteHref } from "../pages/quotation/quotationContext";

export type SlaFilter = "all" | "overdue" | "warning" | "normal";

export type TaskInboxRow = {
  quotationCode: string;
  customerName: string;
  cycleLabel: string;
  stepLabel: string;
  deadlineLabel: string;
  slaBadge: string;
  slaState: string;
  actionHref: string;
  valueLabel: string;
  sortKey: number;
};

export function workflowPhaseLabel(status: WorkflowStatus): string {
  const map: Record<WorkflowStatus, string> = {
    draft: "Bản nháp",
    cancelled: "Đã hủy",
    executor_intake: "Chờ phòng điều phối tiếp nhận",
    qa_rnd_review: "Vòng QA / R&D",
    executor_consolidation: "Tổng hợp báo giá",
    accounting_review: "Vòng chi phí",
    director_review: "Vòng phê duyệt",
    approved: "Đã phê duyệt",
    rejected: "Từ chối",
  };
  return map[status] ?? status;
}

export function taskTabHref(code: string, taskType: TaskType): string {
  const segment: Record<TaskType, string> = {
    executor_intake: "",
    qa_review: "qa",
    rnd_review: "qa",
    executor_consolidation: "consolidation",
    accounting_review: "accounting",
    director_review: "approval",
  };
  const path = segment[taskType];
  return path ? quoteHref(code, path) : quoteHref(code);
}

export function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date
    .toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    })
    .replace(",", " -");
}

export function slaBadgeText(task: QuotationTask): string {
  const state = task.slaAlertState ?? "normal";
  return slaAlertLabel(state) ?? "Trong hạn";
}

function slaSortPriority(state: string | undefined, deadlineAt: string | null | undefined): number {
  if (state === "overdue") return 0;
  if (state === "warning") return 1;
  const t = deadlineAt ? new Date(deadlineAt).getTime() : Number.MAX_SAFE_INTEGER;
  return 2 + t / 1e15;
}

function slaAlertStateQuery(filter: SlaFilter): "overdue" | "warning" | "normal" | undefined {
  if (filter === "all") return undefined;
  return filter;
}

export function mapTaskInboxItem(item: TaskInboxItem): TaskInboxRow {
  const { quotation, task } = item;
  const slaState = task.slaAlertState ?? "normal";
  const valueLabel =
    quotation.finalQuotationValue != null
      ? `${quotation.finalQuotationValue.toLocaleString("vi-VN")} VNĐ`
      : "—";
  return {
    quotationCode: quotation.code,
    customerName: quotation.customerName ?? "—",
    cycleLabel: `${workflowPhaseLabel(quotation.workflowStatus)} · ${cycleTypeLabel(quotation.currentCycleType)}`,
    stepLabel: taskTypeLabel(task.taskType),
    deadlineLabel: formatDeadline(task.slaDeadlineAt),
    slaBadge: slaBadgeText(task),
    slaState,
    actionHref: taskTabHref(quotation.code, task.taskType),
    valueLabel,
    sortKey: slaSortPriority(slaState, task.slaDeadlineAt),
  };
}

async function fetchAllTaskInboxPages(slaFilter: SlaFilter): Promise<TaskInboxRow[]> {
  const pageSize = DEFAULT_PAGE_SIZE;
  let page = 1;
  const rows: TaskInboxRow[] = [];
  const slaAlertState = slaAlertStateQuery(slaFilter);

  for (;;) {
    const batch = await listTaskInbox({ page, pageSize, slaAlertState });
    rows.push(...batch.tasks.map(mapTaskInboxItem));
    if (page * pageSize >= batch.total) break;
    page += 1;
  }

  rows.sort((a, b) => a.sortKey - b.sortKey);
  return rows;
}

/** Loads all inbox rows for the current user (role-scoped server-side). */
export async function loadTaskInbox(_groups: string[], slaFilter: SlaFilter = "all"): Promise<TaskInboxRow[]> {
  return fetchAllTaskInboxPages(slaFilter);
}
