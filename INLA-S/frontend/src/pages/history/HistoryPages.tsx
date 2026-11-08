import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { SlaIndicatorBadge } from "../../components/ui/SlaIndicatorBadge";
import { IconAction } from "../../components/ui/IconAction";
import { DataTable, PageTitle } from "../../components/ui/DataTable";
import { quotationsErrorMessage } from "../../api/quotations";
import { loadTaskInbox, type SlaFilter, type TaskInboxRow } from "../../lib/taskInbox";
import { QuoteChrome } from "../quotation/QuotePages";

function IconHandle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SLA_FILTERS: { id: SlaFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "overdue", label: "Quá hạn" },
  { id: "warning", label: "Gần đến hạn" },
  { id: "normal", label: "Trong hạn" },
];

export function TaskListPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<SlaFilter>("all");
  const [rows, setRows] = useState<TaskInboxRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    loadTaskInbox(user.groups, filter)
      .then((result) => {
        if (!active) return;
        setRows(result);
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
  }, [user, filter]);

  return (
    <>
      <PageTitle
        title="Danh sách ưu tiên SLA"
        aside={
          <div className="flex flex-wrap gap-2 text-sm">
            {SLA_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${
                  filter === id
                    ? "border-[var(--color-action-primary)] bg-[#eff6ff] font-semibold text-[var(--color-action-primary)]"
                    : "border-[var(--color-border)] bg-white hover:bg-[#f9fafb]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      {error ? <p className="mb-4 rounded-[var(--radius-sm)] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p> : null}
      <DataTable
        loading={loading}
        emptyHint="Không có task đang mở phù hợp vai trò của bạn."
        skeletonCells={["link", "barWide", "barNarrow", "barWide", "barNarrow", "pill", "link"]}
        columns={["Mã BG", "Khách hàng", "Loại vòng", "Công đoạn xử lý", "Hạn xử lý", "Cảnh báo SLA", "Hành động"]}
        rows={(rows ?? []).map((row) => [
          <Link to={row.actionHref} className="font-semibold text-[var(--color-action-primary)]">
            {row.quotationCode}
          </Link>,
          row.customerName,
          row.cycleLabel,
          row.stepLabel,
          row.deadlineLabel,
          <SlaIndicatorBadge state={row.slaState} />,
          <IconAction label="Xử lý" to={row.actionHref} icon={<IconHandle />} />,
        ])}
      />
    </>
  );
}

export function SlaHistoryPage() {
  return (
    <QuoteChrome>
      <PageTitle title="Lịch sử SLA theo Task" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        So sánh thời gian xử lý thực tế giữa các vòng báo giá. Tab này vẫn dùng mock — dữ liệu task đầy đủ có trong{" "}
        <code className="text-xs">GET /quotations/{"{code}"}</code> (mảng <code className="text-xs">tasks</code>), chưa có API lịch sử SLA riêng.
      </p>
      <DataTable
        columns={["Vòng", "Tên Task / Công đoạn", "Người xử lý", "Bắt đầu", "Deadline", "Hoàn thành thực tế", "Thời lượng thực tế", "Trạng thái SLA"]}
        rows={[
          ["Vòng 2", "Tiếp nhận và phân loại yêu cầu", "Lê Hoàng Nam", "27/01/2026 · 09:10", "27/01/2026 · 11:10", "27/01/2026 · 10:40", "1,5 giờ", "Trong hạn"],
          ["Vòng 2", "Đánh giá chất lượng", "Trần Thị B", "27/01/2026 · 10:45", "27/01/2026 · 14:45", "28/01/2026 · 11:25", "3,6 giờ", "Trong hạn"],
          ["Vòng 1", "Phê duyệt báo giá", "Phạm Văn D", "20/01/2026 · 09:00", "20/01/2026 · 11:00", "20/01/2026 · 15:40", "6,6 giờ", "Quá hạn"],
        ]}
      />
    </QuoteChrome>
  );
}
