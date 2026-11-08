import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useSignOutAction } from "../../auth/AuthContext";
import { homeFor } from "../../auth/cognito";
import { listQuotations, quotationsErrorMessage } from "../../api/quotations";
import { listCustomers, customersErrorMessage } from "../../api/customers";
import { listUsers, getUser, usersErrorMessage } from "../../api/users";
import { fetchBusinessReport, fetchOperationsReport, reportsErrorMessage } from "../../api/reports";
import { Button } from "../../components/ui/Button";
import { DataTable, Stat } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { WorkflowStatusBadge } from "../../components/ui/WorkflowStatusBadge";
import { IconAction } from "../../components/ui/IconAction";
import { roleDisplayLabel } from "../../lib/roleLabels";
import { businessOutcomeLabel } from "../../lib/quotationLabels";
import { defaultReportDateRange } from "../reports/reportConstants";
import type { BusinessOutcome, WorkflowStatus } from "../../api/quotations";
import { levelLabel } from "../admin/AdminPages";
import {
  DashboardLayout,
  TaskInboxSection,
  TaskStatsRow,
  OperationsWorkflowKpiRow,
  SalesKpiRow,
  SalesQuotationLink,
  useTaskInboxPreview,
} from "./dashboardShared";

const ACTIVE_WORKFLOW: WorkflowStatus[] = [
  "executor_intake",
  "qa_rnd_review",
  "executor_consolidation",
  "accounting_review",
  "director_review",
];

function inReportRange(iso: string, fromDate: string, toDate: string): boolean {
  const day = iso.slice(0, 10);
  return day >= fromDate && day <= toDate;
}

function countInProgress(byWorkflowStatus: { workflowStatus: WorkflowStatus; count: number }[]): number {
  return byWorkflowStatus
    .filter((row) => ACTIVE_WORKFLOW.includes(row.workflowStatus))
    .reduce((sum, row) => sum + row.count, 0);
}

function IconHandle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashSalesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationsTotal, setOperationsTotal] = useState(0);
  const [byWorkflowStatus, setByWorkflowStatus] = useState<{ workflowStatus: WorkflowStatus; count: number }[]>([]);
  const [inProgress, setInProgress] = useState(0);
  const [sent, setSent] = useState(0);
  const [won, setWon] = useState(0);
  const [lost, setLost] = useState(0);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [quotationTableRows, setQuotationTableRows] = useState<
    {
      code: string;
      customerName: string;
      workflowStatus: WorkflowStatus;
      businessOutcome: string;
    }[]
  >([]);

  useEffect(() => {
    let active = true;
    const range = defaultReportDateRange();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchBusinessReport(range),
      fetchOperationsReport({ ...range, department: "all" }),
      listQuotations({ page: 1, pageSize: 100 }),
    ])
      .then(([business, operations, listed]) => {
        if (!active) return;
        setOperationsTotal(operations.total);
        setByWorkflowStatus(operations.byWorkflowStatus);
        setInProgress(countInProgress(operations.byWorkflowStatus));
        setSent(business.sent);
        setWon(business.won);
        setLost(business.lost);
        setWinRate(business.winRate);
        setQuotationTableRows(
          listed.quotations
            .filter((q) => inReportRange(q.createdAt, range.fromDate, range.toDate))
            .map((q) => ({
              code: q.code,
              customerName: q.customerName ?? "—",
              workflowStatus: q.workflowStatus,
              businessOutcome: q.businessOutcome,
            })),
        );
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(reportsErrorMessage(loadError) || quotationsErrorMessage(loadError));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout
      title=""
      aside={
        <div className="flex gap-2">
          <Button to="/quotations/new">Tạo báo giá</Button>
          <Button to="/customers/new" variant="secondary">
            Tạo khách hàng
          </Button>
        </div>
      }
      loading={loading}
      error={error}
    >
      <section className="mb-10">
        <h2 className="mb-1 text-base font-semibold text-[var(--color-text-strong)]">Tổng quan báo giá</h2>
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">Thống kê toàn bộ công ty (báo cáo 30 ngày)</p>
        <OperationsWorkflowKpiRow
          loading={loading}
          total={operationsTotal}
          byWorkflowStatus={byWorkflowStatus}
        />
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--color-text-strong)]">Thống kê của bạn</h2>
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">Dữ liệu cá nhân · lọc theo Sales phụ trách trên trang danh sách</p>
        <SalesKpiRow loading={loading} inProgress={inProgress} sent={sent} won={won} lost={lost} winRate={winRate} />
        <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Danh sách báo giá</h3>
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">Báo giá bạn phụ trách · 30 ngày gần nhất</p>
        <DataTable
          emptyHint="Không có báo giá phù hợp."
          columns={["Mã BG", "Khách hàng", "Trạng thái", "Kết quả KD"]}
          rows={quotationTableRows.map((row) => [
            <SalesQuotationLink key={`self-${row.code}`} code={row.code} />,
            row.customerName,
            <WorkflowStatusBadge key={`${row.code}-wf-self`} status={row.workflowStatus} />,
            businessOutcomeLabel(row.businessOutcome as BusinessOutcome),
          ])}
        />
      </section>
    </DashboardLayout>
  );
}

export function DashExecutorPage() {
  return (
    <DashboardLayout title="Tổng quan công việc">
      <TaskInboxSection />
    </DashboardLayout>
  );
}

export function DashQaPage() {
  return (
    <DashboardLayout title="Tổng quan công việc">
      <TaskInboxSection />
    </DashboardLayout>
  );
}

export function DashRndPage() {
  return (
    <DashboardLayout title="Tổng quan công việc">
      <TaskInboxSection />
    </DashboardLayout>
  );
}

export function DashDirectorPage() {
  const { rows, counts, loading, error } = useTaskInboxPreview(10);

  return (
    <DashboardLayout title="Tổng quan phê duyệt" loading={loading} error={error}>
        <TaskStatsRow
          counts={counts}
          labels={{
            pending: "Báo giá chờ phê duyệt",
            warning: "Cảnh báo Gần đến hạn",
            overdue: "Quá hạn",
          }}
        />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base leading-6 font-semibold text-[var(--color-text-strong)]">Danh sách chờ phê duyệt</h2>
          {!loading && rows.length > 0 ? (
            <Link to="/tasks" className="text-sm font-semibold text-[var(--color-action-primary)]">
              Xem tất cả
            </Link>
          ) : null}
        </div>
        <DataTable
          loading={loading}
          emptyHint="Không có báo giá chờ phê duyệt."
          skeletonCells={["link", "barWide", "barNarrow", "barWide", "barNarrow", "link"]}
          columns={["Mã BG", "Khách hàng", "Giá trị", "Công đoạn", "Hạn xử lý", "Hành động"]}
          rows={rows.map((row) => [
            <Link key={row.quotationCode} to={row.actionHref} className="font-semibold text-[var(--color-action-primary)]">
              {row.quotationCode}
            </Link>,
            row.customerName,
            row.valueLabel,
            row.stepLabel,
            row.deadlineLabel,
            <IconAction key={`${row.quotationCode}-act`} label="Xử lý" to={row.actionHref} icon={<IconHandle />} />,
          ])}
        />
    </DashboardLayout>
  );
}

export function DashAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledUsers, setEnabledUsers] = useState(0);
  const [quotationTotal, setQuotationTotal] = useState(0);
  const [customerTotal, setCustomerTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listUsers({ enabled: true, page: 1, pageSize: 1 }),
      listCustomers({ page: 1, pageSize: 1 }),
      listQuotations({ page: 1, pageSize: 1 }),
    ])
      .then(([usersRes, customersRes, quotationsRes]) => {
        if (!active) return;
        setEnabledUsers(usersRes.total);
        setCustomerTotal(customersRes.total);
        setQuotationTotal(quotationsRes.total);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(usersErrorMessage(loadError) || customersErrorMessage(loadError) || quotationsErrorMessage(loadError));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout
      kicker="Chế độ xem toàn cục (Read-Only)"
      title="Tổng quan hệ thống"
      loading={loading}
      error={error}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin">
          <Stat label="Tài khoản đang hoạt động" value={String(enabledUsers)} hint="người dùng" />
        </Link>
        <Stat label="Trạng thái hệ thống & SLA" value="Ổn định" hint="Đang vận hành ổn định" />
        <Link to="/quotations">
          <Stat label="Tổng số báo giá trên hệ thống" value={String(quotationTotal)} hint="báo giá" />
        </Link>
        <Link to="/customers">
          <Stat label="Tổng số khách hàng" value={String(customerTotal)} hint="khách hàng" />
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button to="/admin">Quản lý người dùng</Button>
        <Button to="/admin/sla" variant="secondary">
          Mở cấu hình SLA
        </Button>
        <Button to="/quotations" variant="secondary">
          Danh sách báo giá
        </Button>
        <Button to="/customers" variant="secondary">
          Danh sách khách hàng
        </Button>
      </div>
    </DashboardLayout>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const signOut = useSignOutAction();
  const home = homeFor(user?.groups ?? []);
  const role = [roleDisplayLabel(user?.role), user?.level ? levelLabel(user.level) : ""].filter(Boolean).join(" · ");
  const Background = dashboardFor(user?.role);
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    getUser(user.email)
      .then((res) => {
        if (active) setPhone(res.user.phoneNumber?.trim() ?? "");
      })
      .catch(() => {
        if (active) setPhone("");
      });
    return () => {
      active = false;
    };
  }, [user?.email]);

  return (
    <>
      <Background />
      <Drawer title="Hồ sơ cá nhân" closeTo={home}>
        <div className="mb-6 grid place-items-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--color-avatar)] text-lg font-bold text-[var(--color-brand-primary)]">
            {user?.initials}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Họ và tên" value={user?.name ?? ""} readOnly />
          <Field label="Email" value={user?.email ?? ""} readOnly />
          <Field label="Số điện thoại" value={phone || "—"} readOnly />
          <Field label="Vai trò" value={role} readOnly />
        </div>
        <div className="mt-8">
          <Button variant="error" block onClick={signOut}>
            Đăng xuất
          </Button>
        </div>
        <Link to="/session-expired" className="mt-4 block text-center text-sm text-[var(--color-text-muted)]">
          Xem phiên hết hạn
        </Link>
      </Drawer>
    </>
  );
}

function dashboardFor(role: string | undefined) {
  if (role === "ADMIN") return DashAdminPage;
  if (role === "DIRECTOR") return DashDirectorPage;
  if (role === "EXECUTOR") return DashExecutorPage;
  if (role === "QA") return DashQaPage;
  if (role === "R&D") return DashRndPage;
  if (role === "ACCOUNTING") return DashExecutorPage;
  return DashSalesPage;
}
