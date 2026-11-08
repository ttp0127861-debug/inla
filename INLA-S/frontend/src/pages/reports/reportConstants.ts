import type { TaskType } from "../../api/quotations";
import { taskTypeLabel } from "../../lib/quotationLabels";

export type ReportFilterVariant = "ops" | "business" | "departments" | "resubmit";

const REPORT_DEPARTMENTS: TaskType[] = [
  "executor_intake",
  "qa_review",
  "rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];

export const REPORT_DEPARTMENT_OPTIONS: { value: "all" | TaskType; label: string }[] = [
  { value: "all", label: "Tất cả phòng ban" },
  ...REPORT_DEPARTMENTS.map((value) => ({ value, label: taskTypeLabel(value) })),
];

export type ReportFilterState = {
  fromDate: string;
  toDate: string;
  workflowStatus: string;
  department: string;
  cycleType: string;
  outcome: string;
  salesStaff: string;
  customerGroup: string;
  slaStatus: string;
  stage: string;
  triggerSource: string;
  assignee: string;
  currentStatus: string;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** OQ-RPT-02: default reporting window = last 30 days. */
export function defaultReportDateRange(): { fromDate: string; toDate: string } {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  return { fromDate: isoDate(fromDate), toDate: isoDate(toDate) };
}

export function defaultReportFilters(): ReportFilterState {
  const { fromDate, toDate } = defaultReportDateRange();
  return {
    fromDate,
    toDate,
    workflowStatus: "all",
    department: "all",
    cycleType: "all",
    outcome: "all",
    salesStaff: "all",
    customerGroup: "all",
    slaStatus: "all",
    stage: "all",
    triggerSource: "all",
    assignee: "all",
    currentStatus: "all",
  };
}

export const REPORT_NAV = [
  { to: "/reports", label: "Báo cáo vận hành", end: true as const },
  { to: "/reports/business", label: "Kết quả kinh doanh" },
  { to: "/reports/departments", label: "Hiệu suất phòng ban" },
  { to: "/reports/resubmit", label: "Tỷ lệ Re-submit" },
];
