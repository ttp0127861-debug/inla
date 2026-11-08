import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { listTaskInbox, quotationsErrorMessage, type WorkflowStatus } from "../../api/quotations";
import { workflowStatusLabel, workflowStatusVariantClass } from "../../lib/quotationLabels";
import { SlaIndicatorBadge } from "../../components/ui/SlaIndicatorBadge";
import { badgeToneClass, type BadgeToneKey } from "../../components/ui/Badge";
import { DataTable, PageTitle, Stat } from "../../components/ui/DataTable";
import { IconAction } from "../../components/ui/IconAction";
import { mapTaskInboxItem, type TaskInboxRow } from "../../lib/taskInbox";
import { quoteHref } from "../quotation/quotationContext";

export type TaskInboxCounts = {
  pending: number;
  warning: number;
  overdue: number;
};

export function DashboardLayout({
  title,
  kicker,
  aside,
  loading,
  error,
  children,
}: {
  title: string;
  kicker?: string;
  aside?: ReactNode;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <>
      <PageTitle kicker={kicker} title={title} aside={aside} />
      {error ? (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}
      {loading ? <DashboardLoadingShell /> : children}
    </>
  );
}

function DashboardLoadingShell() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-[108px] animate-pulse rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#f9fafb]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#f9fafb]" />
    </div>
  );
}

export function TaskStatsRow({
  counts,
  loading,
  labels,
}: {
  counts: TaskInboxCounts;
  loading?: boolean;
  labels?: { pending?: string; warning?: string; overdue?: string };
}) {
  if (loading) {
    return (
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-[108px] animate-pulse rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#f9fafb]" />
        ))}
      </div>
    );
  }
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <Stat label={labels?.pending ?? "Việc chờ xử lý"} value={String(counts.pending)} />
      <Stat label={labels?.warning ?? "Gần đến hạn (WARNING)"} value={String(counts.warning)} />
      <Stat label={labels?.overdue ?? "Quá hạn (OVERDUE)"} value={String(counts.overdue)} />
    </div>
  );
}

function IconHandle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskPriorityTable({
  rows,
  loading,
  limit,
  emptyHint = "Không có công việc phù hợp.",
}: {
  rows: TaskInboxRow[];
  loading?: boolean;
  limit?: number;
  emptyHint?: string;
}) {
  const visible = limit != null ? rows.slice(0, limit) : rows;
  return (
    <DataTable
      loading={loading}
      emptyHint={emptyHint}
      skeletonCells={["link", "barWide", "barWide", "barNarrow", "barNarrow", "pill", "link"]}
      columns={["Mã BG", "Khách hàng", "Loại vòng", "Công đoạn xử lý", "Hạn xử lý", "Cảnh báo SLA", "Hành động"]}
      rows={visible.map((row) => [
        <Link key={row.quotationCode} to={row.actionHref} className="font-semibold text-[var(--color-action-primary)]">
          {row.quotationCode}
        </Link>,
        row.customerName,
        row.cycleLabel,
        row.stepLabel,
        row.deadlineLabel,
        <SlaIndicatorBadge key={`${row.quotationCode}-sla`} state={row.slaState} />,
        <IconAction key={`${row.quotationCode}-act`} label="Xử lý" to={row.actionHref} icon={<IconHandle />} />,
      ])}
    />
  );
}

export function TaskInboxSection({
  sectionTitle,
  viewAllHref = "/tasks",
}: {
  sectionTitle?: string;
  viewAllHref?: string;
}) {
  const { rows, counts, loading, error } = useTaskInboxPreview(10);
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base leading-6 font-semibold text-[var(--color-text-strong)]">
          {sectionTitle ?? "Danh sách ưu tiên SLA"}
        </h2>
        {!loading && rows.length > 0 ? (
          <Link to={viewAllHref} className="text-sm font-semibold text-[var(--color-action-primary)]">
            Xem tất cả
          </Link>
        ) : null}
      </div>
      {error ? (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}
      <TaskStatsRow counts={counts} loading={loading} />
      <TaskPriorityTable rows={rows} loading={loading} limit={10} />
    </>
  );
}

/** Preview rows (page 1) plus SLA breakdown totals from lightweight count queries. */
export function useTaskInboxPreview(previewSize = 10): {
  rows: TaskInboxRow[];
  counts: TaskInboxCounts;
  loading: boolean;
  error: string | null;
} {
  const [rows, setRows] = useState<TaskInboxRow[]>([]);
  const [counts, setCounts] = useState<TaskInboxCounts>({ pending: 0, warning: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listTaskInbox({ page: 1, pageSize: previewSize }),
      listTaskInbox({ page: 1, pageSize: 1 }),
      listTaskInbox({ slaAlertState: "warning", page: 1, pageSize: 1 }),
      listTaskInbox({ slaAlertState: "overdue", page: 1, pageSize: 1 }),
    ])
      .then(([preview, allCount, warningCount, overdueCount]) => {
        if (!active) return;
        setRows(preview.tasks.map(mapTaskInboxItem));
        setCounts({
          pending: allCount.total,
          warning: warningCount.total,
          overdue: overdueCount.total,
        });
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(quotationsErrorMessage(loadError));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [previewSize]);

  return { rows, counts, loading, error };
}

export function formatListQuotationValue(finalQuotationValue: number | null | undefined): string {
  if (finalQuotationValue == null) return "—";
  return `${finalQuotationValue.toLocaleString("vi-VN")} VNĐ`;
}

export function SalesQuotationLink({ code }: { code: string }) {
  return (
    <Link to={quoteHref(code)} className="font-semibold text-[var(--color-action-primary)]">
      {code}
    </Link>
  );
}

export type SalesOverviewScope = "organization" | "self";

const WORKFLOW_STATUS_ORDER: WorkflowStatus[] = [
  "draft",
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
  "approved",
  "rejected",
  "cancelled",
];

function DashboardKpiTile({
  label,
  value,
  hint,
  workflowStatus,
  badgeTone,
}: {
  label: string;
  value: string;
  hint?: string;
  workflowStatus?: WorkflowStatus;
  badgeTone?: BadgeToneKey;
}) {
  const colored = Boolean(workflowStatus || badgeTone);
  const surfaceClass = workflowStatus
    ? workflowStatusVariantClass(workflowStatus)
    : badgeTone
      ? badgeToneClass(badgeTone)
      : "border border-[var(--color-border)] bg-white text-[var(--color-text-strong)]";

  return (
    <article
      className={`flex h-full min-h-[7.75rem] flex-col rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-card)] ${surfaceClass}`}
    >
      <p className={`text-sm leading-5 ${colored ? "font-semibold" : "text-[var(--color-text-muted)]"}`}>{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-serif)] text-[32px] leading-none font-bold ${
          colored ? "" : "text-[var(--color-text-strong)]"
        }`}
      >
        {value}
      </p>
      <p className={`mt-auto pt-2 text-sm leading-5 ${colored ? "opacity-90" : "text-[var(--color-text-body)]"}`}>
        {hint ?? "\u00a0"}
      </p>
    </article>
  );
}

export function OperationsWorkflowKpiRow({
  total,
  byWorkflowStatus,
  loading,
}: {
  total: number;
  byWorkflowStatus: { workflowStatus: WorkflowStatus; count: number }[];
  loading?: boolean;
}) {
  const countByStatus = new Map(byWorkflowStatus.map((row) => [row.workflowStatus, row.count]));
  const tiles = WORKFLOW_STATUS_ORDER.filter((status) => (countByStatus.get(status) ?? 0) > 0).map((status) => ({
    status,
    label: workflowStatusLabel(status),
    value: countByStatus.get(status) ?? 0,
  }));

  const tileRowClass = "mb-6 flex flex-nowrap items-stretch gap-4 overflow-x-auto pb-1";
  const tileWrapClass = "flex min-w-[8.75rem] shrink-0 flex-1";

  if (loading) {
    const placeholders = Math.max(tiles.length || 4, 4) + 1;
    return (
      <div className={tileRowClass}>
        {Array.from({ length: placeholders }, (_, key) => (
          <div
            key={key}
            className={`${tileWrapClass} min-h-[7.75rem] animate-pulse rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#f9fafb]`}
          />
        ))}
      </div>
    );
  }

  if (total === 0 || tiles.length === 0) {
    return (
      <div className={tileRowClass}>
        <div className={tileWrapClass}>
          <DashboardKpiTile label="Tổng báo giá" value="0" hint="Trong kỳ 30 ngày" />
        </div>
      </div>
    );
  }

  return (
    <div className={tileRowClass}>
      <div className={tileWrapClass}>
        <DashboardKpiTile label="Tổng báo giá" value={String(total)} hint="Trong kỳ 30 ngày" />
      </div>
      {tiles.map((tile) => (
        <div key={tile.status} className={tileWrapClass}>
          <DashboardKpiTile label={tile.label} value={String(tile.value)} workflowStatus={tile.status} />
        </div>
      ))}
    </div>
  );
}

export function SalesKpiRow({
  inProgress,
  sent,
  won,
  lost,
  winRate,
  loading,
}: {
  inProgress: number;
  sent: number;
  won: number;
  lost: number;
  winRate: number | null;
  loading?: boolean;
}) {
  const tileRowClass = "mb-2 flex flex-nowrap items-stretch gap-4 overflow-x-auto pb-1";
  const tileWrapClass = "flex min-w-[10.5rem] shrink-0 flex-1";
  const wonHint = sent > 0 ? `Tỷ lệ Won: ${((winRate ?? won / sent) * 100).toFixed(0).replace(".", ",")}%` : "Tỷ lệ Won: —";
  const lostHint = sent > 0 ? `Tỷ lệ Lost: ${((lost / sent) * 100).toFixed(0).replace(".", ",")}%` : "Tỷ lệ Lost: —";

  if (loading) {
    return (
      <div className={tileRowClass}>
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className={`${tileWrapClass} min-h-[7.75rem] animate-pulse rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#f9fafb]`}
          />
        ))}
      </div>
    );
  }
  return (
    <div className={tileRowClass}>
      <div className={tileWrapClass}>
        <DashboardKpiTile label="Báo giá đang xử lý" value={String(inProgress)} badgeTone="warning" />
      </div>
      <div className={tileWrapClass}>
        <DashboardKpiTile label="Đã gửi khách hàng" value={String(sent)} badgeTone="info" />
      </div>
      <div className={tileWrapClass}>
        <DashboardKpiTile label="Thành công (Won)" value={String(won)} hint={wonHint} badgeTone="ok" />
      </div>
      <div className={tileWrapClass}>
        <DashboardKpiTile label="Thất bại (Lost)" value={String(lost)} hint={lostHint} badgeTone="danger" />
      </div>
    </div>
  );
}
