import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchBusinessReport,
  fetchDepartmentsReport,
  fetchOperationsReport,
  fetchResubmitReport,
} from "../../api/reports";
import { PageTitle } from "../../components/ui/DataTable";
import { ReportFilters } from "./ReportFilters";
import {
  DonutChart,
  KpiCard,
  LineTrendChart,
  ReportEmptyState,
  ReportErrorBanner,
  ReportLoadingBlock,
  ReportNav,
  OperationsDetailTable,
  ReportSection,
  SlaDepartmentBars,
  VerticalBarChart,
} from "./ReportShared";
import { defaultReportFilters } from "./reportConstants";
import {
  isBusinessEmpty,
  isDepartmentsEmpty,
  isOperationsEmpty,
  isResubmitEmpty,
  mapBusinessReport,
  mapDepartmentsReport,
  mapOperationsReport,
  mapResubmitReport,
} from "./reportMappers";
import { useReportQuery } from "./useReportQuery";

export function ReportOpsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "SALES";
  const [filters, setFilters] = useState(defaultReportFilters);
  const fetcher = useCallback(
    async (applied: typeof filters) => mapOperationsReport(await fetchOperationsReport(applied), applied),
    [],
  );
  const { data, loading, error, apply, empty } = useReportQuery(filters, fetcher, isOperationsEmpty);

  return (
    <>
      <ReportNav />
      <PageTitle kicker="Phân tích hiệu suất" title="Báo cáo vận hành" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Theo dõi lưu lượng báo giá, trạng thái xử lý và hiệu suất SLA theo thời gian.
      </p>
      <ReportFilters variant="ops" role={role} value={filters} onChange={setFilters} onApply={apply} loading={loading} />
      {error ? <ReportErrorBanner message={error} /> : null}
      {loading ? <ReportLoadingBlock /> : null}
      {!loading && !error && empty ? <ReportEmptyState /> : null}
      {!loading && !error && data && !empty ? (
        <>
          <ReportSection
            title="Thống kê số lượng báo giá theo Trạng thái quy trình"
            subtitle={`Tổng số ${data.total} báo giá trong kỳ`}
          >
            <VerticalBarChart bars={data.statusBars} />
          </ReportSection>
          <ReportSection
            title="Chi tiết vận hành báo giá"
            subtitle={`Hiển thị ${data.detailRows.length} trong tổng số ${data.total} báo giá`}
          >
            <OperationsDetailTable rows={data.detailRows} loading={false} />
          </ReportSection>
        </>
      ) : null}
    </>
  );
}

export function ReportBusinessPage() {
  const { user } = useAuth();
  const role = user?.role ?? "SALES";
  const [filters, setFilters] = useState(defaultReportFilters);
  const fetcher = useCallback(async (applied: typeof filters) => mapBusinessReport(await fetchBusinessReport(applied)), []);
  const { data, loading, error, apply, empty } = useReportQuery(filters, fetcher, isBusinessEmpty);

  return (
    <>
      <ReportNav />
      <PageTitle kicker="Hiệu quả kinh doanh" title="Báo cáo kết quả kinh doanh" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Theo dõi tỷ lệ chuyển đổi và doanh thu từ báo giá đã gửi khách hàng.
      </p>
      <ReportFilters variant="business" role={role} value={filters} onChange={setFilters} onApply={apply} loading={loading} />
      {error ? <ReportErrorBanner message={error} /> : null}
      {loading ? <ReportLoadingBlock /> : null}
      {!loading && !error && empty ? <ReportEmptyState /> : null}
      {!loading && !error && data && !empty ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} tone={kpi.tone} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {data.outcomeSplit.length > 0 ? (
              <ReportSection title="Tỷ lệ Won / Lost / Sent">
                <DonutChart segments={data.outcomeSplit} centerValue={String(data.sent)} centerLabel="Đã gửi KH" />
              </ReportSection>
            ) : null}
            <ReportSection title="5 lý do thất bại gần nhất">
              {data.recentLostOutcomes.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Chưa có dữ liệu từ máy chủ (hoặc báo giá Lost chưa gắn lý do). TODO: bổ sung{" "}
                  <code className="text-xs">recentLostOutcomes</code> trong GET /reports/business.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm">
                  {data.recentLostOutcomes.map((row) => (
                    <li key={row.code} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
                      <span className="font-mono font-semibold text-[var(--color-action-primary)]">{row.code}</span>
                      <span className="text-[var(--color-text-muted)]">{row.dateLabel}</span>
                      <p className="w-full text-[var(--color-text-strong)] sm:mt-1">{row.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </ReportSection>
          </div>
        </>
      ) : null}
    </>
  );
}

export function ReportDeptPage() {
  const { user } = useAuth();
  const role = user?.role ?? "SALES";
  const [filters, setFilters] = useState(defaultReportFilters);
  const fetcher = useCallback(
    async (applied: typeof filters) => mapDepartmentsReport(await fetchDepartmentsReport(applied)),
    [],
  );
  const { data, loading, error, apply, empty } = useReportQuery(filters, fetcher, isDepartmentsEmpty);

  return (
    <>
      <ReportNav />
      <PageTitle kicker="Hiệu suất SLA" title="Báo cáo hiệu suất phòng ban" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Thời gian xử lý trung bình theo phòng ban so với định mức SLA trong kỳ báo cáo.
      </p>
      <ReportFilters variant="departments" role={role} value={filters} onChange={setFilters} onApply={apply} loading={loading} />
      {error ? <ReportErrorBanner message={error} /> : null}
      {loading ? <ReportLoadingBlock /> : null}
      {!loading && !error && empty ? <ReportEmptyState /> : null}
      {!loading && !error && data && !empty ? (
        <ReportSection
          title="Thời gian xử lý trung bình theo phòng ban so với Định mức SLA"
          subtitle="Đơn vị: giờ — dữ liệu trung bình trong kỳ báo cáo"
        >
          <SlaDepartmentBars departments={data.departments} />
        </ReportSection>
      ) : null}
    </>
  );
}

export function ReportResubmitPage() {
  const { user } = useAuth();
  const role = user?.role ?? "SALES";
  const [filters, setFilters] = useState(defaultReportFilters);
  const fetcher = useCallback(
    async (applied: typeof filters) => mapResubmitReport(await fetchResubmitReport(applied)),
    [],
  );
  const { data, loading, error, apply, empty } = useReportQuery(filters, fetcher, isResubmitEmpty);

  return (
    <>
      <ReportNav />
      <PageTitle kicker="Phân tích vòng xử lý" title="Báo cáo tỷ lệ Re-submit" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Theo dõi xu hướng gửi lại báo giá, số vòng xử lý và các nguyên nhân phổ biến.
      </p>
      <ReportFilters variant="resubmit" role={role} value={filters} onChange={setFilters} onApply={apply} loading={loading} />
      {error ? <ReportErrorBanner message={error} /> : null}
      {loading ? <ReportLoadingBlock /> : null}
      {!loading && !error && empty ? <ReportEmptyState /> : null}
      {!loading && !error && data && !empty ? (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <KpiCard label="Tỷ lệ trung bình" value={data.avgRate} hint="Trong kỳ đã chọn" tone="neutral" />
            <KpiCard label="Số vòng trung bình" value={data.avgRounds} hint="Trên mỗi báo giá có gửi lại" tone="neutral" />
          </div>
          {data.trend.length > 0 ? (
            <ReportSection title="Tỷ lệ Re-submit (%) theo thời gian" subtitle="Theo tháng submit trong kỳ báo cáo">
              <LineTrendChart points={data.trend} />
            </ReportSection>
          ) : null}
        </>
      ) : null}
    </>
  );
}
