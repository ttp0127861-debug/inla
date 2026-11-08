import type { CycleType, WorkflowStatus } from "../../api/quotations";
import { getQuotation, listQuotations } from "../../api/quotations";
import type {
  BusinessReportResponse,
  DepartmentsReportResponse,
  OperationsReportResponse,
  ResubmitReportResponse,
} from "../../api/reports";
import { activeSlaTask, workflowStatusLabel } from "../../lib/quotationLabels";
import type { ReportFilterState } from "./reportConstants";

export type OpsDetailRow = {
  code: string;
  customerName: string;
  cycleType: CycleType | undefined;
  workflowStatus: WorkflowStatus;
  slaState: string;
  processedLabel: string;
};

export type OpsReportView = {
  total: number;
  statusBars: { label: string; value: number }[];
  detailRows: OpsDetailRow[];
};

export type BusinessReportView = {
  kpis: { label: string; value: string; hint: string; tone?: "ok" | "danger" | "neutral" }[];
  outcomeSplit: { label: string; value: number; color: string }[];
  sent: number;
  recentLostOutcomes: { code: string; dateLabel: string; reason: string }[];
};

export type DeptReportView = {
  departments: { name: string; actualHours: number; slaHours: number; overSla?: boolean }[];
};

export type ResubmitReportView = {
  avgRate: string;
  avgRounds: string;
  trend: { label: string; rate: number }[];
};

function formatPercentFraction(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function formatVnd(value: number): string {
  return value.toLocaleString("vi-VN");
}

function formatDecimal(value: number | null | undefined, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  const text = value.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return suffix ? `${text}${suffix}` : text;
}

function monthShortLabel(yyyyMm: string): string {
  const month = Number(yyyyMm.split("-")[1]);
  return Number.isFinite(month) ? `T${month}` : yyyyMm;
}

function inReportRange(iso: string, fromDate: string, toDate: string): boolean {
  const day = iso.slice(0, 10);
  return day >= fromDate && day <= toDate;
}

async function mapInChunks<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

async function loadOperationsDetailRows(filters: ReportFilterState): Promise<OpsDetailRow[]> {
  const listed = await listQuotations({ pageSize: 100 });
  const scoped = listed.quotations
    .filter((row) => inReportRange(row.createdAt, filters.fromDate, filters.toDate))
    .slice(0, 50);
  const details = await mapInChunks(scoped, 6, (row) => getQuotation(row.code));
  return details.map((detail) => {
    const slaTask = activeSlaTask(detail.tasks);
    return {
      code: detail.quotation.code,
      customerName: detail.quotation.customerName ?? "—",
      cycleType: detail.quotation.currentCycleType,
      workflowStatus: detail.quotation.workflowStatus,
      slaState: slaTask?.slaAlertState ?? "normal",
      processedLabel: "—",
    };
  });
}

export async function mapOperationsReport(
  response: OperationsReportResponse,
  filters: ReportFilterState,
): Promise<OpsReportView> {
  const statusBars = response.byWorkflowStatus
    .filter((row) => row.count > 0)
    .map((row) => ({
      label: workflowStatusLabel(row.workflowStatus),
      value: row.count,
    }));
  let detailRows: OpsDetailRow[] = [];
  if (response.total > 0) {
    try {
      detailRows = await loadOperationsDetailRows(filters);
    } catch {
      detailRows = [];
    }
  }
  return { total: response.total, statusBars, detailRows };
}

export function isOperationsEmpty(view: OpsReportView): boolean {
  return view.total === 0 || view.statusBars.length === 0;
}

function formatReportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("vi-VN");
}

export function mapBusinessReport(response: BusinessReportResponse): BusinessReportView {
  const { sent, won, lost, winRate, totalWonValue, recentLostOutcomes } = response;
  const sentOnly = Math.max(0, sent - won - lost);
  const lostRows =
    recentLostOutcomes?.map((row) => ({
      code: row.quotationCode,
      dateLabel: formatReportDate(row.lostAt),
      reason: row.reason?.trim() ? row.reason : "—",
    })) ?? [];
  return {
    sent,
    recentLostOutcomes: lostRows.slice(0, 5),
    kpis: [
      { label: "Đã gửi khách hàng", value: String(sent), hint: "báo giá", tone: "neutral" },
      {
        label: "Thành công (Won)",
        value: String(won),
        hint: sent > 0 ? `báo giá · ${formatPercentFraction(winRate ?? won / sent)}` : "báo giá",
        tone: "ok",
      },
      {
        label: "Thất bại (Lost)",
        value: String(lost),
        hint: sent > 0 ? `báo giá · ${formatPercentFraction(lost / sent)}` : "báo giá",
        tone: "danger",
      },
      { label: "Tổng giá trị Won", value: formatVnd(totalWonValue), hint: "VNĐ", tone: "neutral" },
    ],
    outcomeSplit: [
      { label: "Thành công", value: won, color: "#047857" },
      { label: "Thất bại", value: lost, color: "#b91c1c" },
      { label: "Đã gửi", value: sentOnly, color: "#1d4ed8" },
    ].filter((segment) => segment.value > 0),
  };
}

export function isBusinessEmpty(view: BusinessReportView): boolean {
  return view.sent === 0;
}

export function mapDepartmentsReport(response: DepartmentsReportResponse): DeptReportView {
  return {
    departments: response.departments
      .filter((row) => row.completedTasks > 0)
      .map((row) => ({
        name: row.departmentLabel,
        actualHours: row.avgDurationHours ?? 0,
        slaHours: row.avgSlaHours ?? 0,
        overSla: row.overSlaCount > 0,
      })),
  };
}

export function isDepartmentsEmpty(view: DeptReportView): boolean {
  return view.departments.length === 0;
}

export function mapResubmitReport(response: ResubmitReportResponse): ResubmitReportView {
  return {
    avgRate: formatPercentFraction(response.avgResubmitRate),
    avgRounds: formatDecimal(response.avgCyclesPerQuotation, " vòng"),
    trend: response.monthlySeries.map((point) => ({
      label: monthShortLabel(point.month),
      rate: point.resubmitRate != null ? Math.round(point.resubmitRate * 1000) / 10 : 0,
    })),
  };
}

export function isResubmitEmpty(view: ResubmitReportView): boolean {
  return view.trend.length === 0 && view.avgRate === "—";
}
