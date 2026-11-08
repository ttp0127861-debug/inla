import type { TaskType, WorkflowStatus } from "./quotations";
import { apiJsonRequest, HttpRequestError } from "./http";

export type ReportDepartment = TaskType;

export type ReportPeriodMeta = {
  fromDate: string;
  toDate: string;
  periodAnchor: "quotationCreatedAt";
};

export type OperationsReportResponse = ReportPeriodMeta & {
  total: number;
  byWorkflowStatus: { workflowStatus: WorkflowStatus; count: number }[];
};

export type RecentLostOutcome = {
  quotationCode: string;
  lostAt: string;
  reason: string;
};

export type BusinessReportResponse = ReportPeriodMeta & {
  sent: number;
  won: number;
  lost: number;
  winRate: number | null;
  totalWonValue: number;
  /** Optional until backend adds to GET /reports/business */
  recentLostOutcomes?: RecentLostOutcome[];
};

export type DepartmentReportRow = {
  taskType: string;
  departmentLabel: string;
  avgDurationHours: number | null;
  avgSlaHours: number | null;
  completedTasks: number;
  overSlaCount: number;
};

export type DepartmentsReportResponse = ReportPeriodMeta & {
  departments: DepartmentReportRow[];
};

export type ResubmitMonthlyPoint = {
  month: string;
  submittedQuotations: number;
  quotationsWithResubmit: number;
  resubmitRate: number | null;
};

export type ResubmitReportResponse = ReportPeriodMeta & {
  avgResubmitRate: number | null;
  avgCyclesPerQuotation: number | null;
  submittedQuotations?: number;
  quotationsWithResubmit?: number;
  monthlySeries: ResubmitMonthlyPoint[];
};

export type ReportQueryInput = {
  fromDate: string;
  toDate: string;
  department?: string;
};

export function buildReportQuery(input: ReportQueryInput): string {
  const search = new URLSearchParams();
  if (input.fromDate) search.set("fromDate", input.fromDate);
  if (input.toDate) search.set("toDate", input.toDate);
  if (input.department && input.department !== "all") search.set("department", input.department);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function reportQueryFromFilters(filters: ReportQueryInput & { department: string }): string {
  return buildReportQuery({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    department: filters.department,
  });
}

async function reportRequest<T>(path: string): Promise<T> {
  try {
    return await apiJsonRequest<T>(path);
  } catch (error) {
    if (error instanceof HttpRequestError) {
      const message =
        error.code === "NETWORK" ? "Không kết nối được máy chủ báo cáo." : error.message;
      throw new ReportsApiError(error.status, error.code, message);
    }
    throw error;
  }
}

export class ReportsApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ReportsApiError";
    this.status = status;
    this.code = code;
  }
}

export function reportsErrorMessage(error: unknown): string {
  if (error instanceof ReportsApiError) return error.message;
  if (error instanceof HttpRequestError) return error.message;
  return "Không tải được báo cáo.";
}

export function fetchOperationsReport(filters: ReportQueryInput & { department: string }): Promise<OperationsReportResponse> {
  return reportRequest(`/reports/operations${reportQueryFromFilters(filters)}`);
}

export function fetchBusinessReport(filters: ReportQueryInput): Promise<BusinessReportResponse> {
  return reportRequest(`/reports/business${buildReportQuery(filters)}`);
}

export function fetchDepartmentsReport(filters: ReportQueryInput & { department: string }): Promise<DepartmentsReportResponse> {
  return reportRequest(`/reports/departments${reportQueryFromFilters(filters)}`);
}

export function fetchResubmitReport(filters: ReportQueryInput): Promise<ResubmitReportResponse> {
  return reportRequest(`/reports/resubmit${buildReportQuery(filters)}`);
}
