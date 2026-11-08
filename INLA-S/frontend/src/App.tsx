import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { canAccessPath } from "./auth/cognito";
import { AppShell } from "./components/ui/AppShell";
import { CreateUserPage, EditUserPage, ReplaceUserPage, ResetPasswordPage as AdminResetPage, SlaConfigPage, UserListPage } from "./pages/admin/AdminPages";
import { AuthNavigationRegistrar } from "./auth/AuthNavigationRegistrar";
import { IdleSessionMonitor } from "./auth/IdleSessionMonitor";
import { ForgotPasswordPage, LoginPage, LoginRequiredPage, ResetPasswordPage, SessionExpiredPage } from "./pages/auth/AuthPages";
import {
  ContactDeactivatePage,
  CustomerContactsPage,
  CustomerCreatePage,
  CustomerDeactivatePage,
  CustomerDetailPage,
  CustomerEditPage,
  CustomerHistoryPage,
  CustomerListPage,
  CustomerQuotesPage,
  CustomerSalesPage,
  CustomerShellRoute,
} from "./pages/customer/CustomerPages";
import { DashAdminPage, DashDirectorPage, DashExecutorPage, DashQaPage, DashRndPage, DashSalesPage, ProfilePage } from "./pages/dashboard/DashboardPages";
import { SlaHistoryPage, TaskListPage } from "./pages/history/HistoryPages";
import {
  QuotationDetailRoute,
  QuoteAccountingPage,
  QuoteApprovalPage,
  QuoteConsolidationPage,
  QuoteCreatePage,
  QuoteEditPage,
  QuoteFilesPage,
  QuoteHistoryPage,
  QuoteListPage,
  QuoteQaPage,
  QuoteRequestPage,
  QuoteRevisionsPage,
} from "./pages/quotation/QuotePages";
import { QuoteClonePage, QuoteResubmitPage, QuoteSnapshotPage, SendConfirmPage, SimilarCustomerPage, SimilarProductPage } from "./pages/quotation/QuoteFlows";
import { ReportBusinessPage, ReportDeptPage, ReportOpsPage, ReportResubmitPage } from "./pages/reports/ReportPages";
import { ApprovePage, CancelQuotePage, CompleteTaskPage, ConflictPage, DeactivatePage, EmptyPage, ForbiddenPage, LoadingPage, NotFoundPage, OutcomePage, PreviewPage, RejectPage, ResubmitReasonPage, SharedIndexPage, ToastPage, UploadStatesPage, ValidationPage } from "./pages/shared/SharedPages";

function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="min-h-screen bg-[var(--color-surface-background)]" />;
  }
  if (status !== "authenticated" || !user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/" replace state={{ from }} />;
  }
  return (
    <>
      <IdleSessionMonitor />
      <Outlet />
    </>
  );
}

function RequirePath() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Outlet />;
  if (location.pathname.startsWith("/admin") && !user.groups.includes("ADMIN")) {
    return <Navigate to="/shared/forbidden" replace />;
  }
  if (!canAccessPath(user.groups, location.pathname)) {
    return <Navigate to="/shared/forbidden" replace />;
  }
  return <Outlet />;
}

function LegacyRndTabRedirect() {
  const { code = "" } = useParams();
  return <Navigate to={`/quotations/${encodeURIComponent(code)}/qa`} replace />;
}

function RequireAdmin() {
  const { user } = useAuth();
  if (!user?.groups.includes("ADMIN")) {
    return <Navigate to="/shared/forbidden" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <>
      <AuthNavigationRegistrar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/session-expired" element={<SessionExpiredPage />} />
        <Route path="/login-required" element={<LoginRequiredPage />} />
        <Route element={<RequireAuth />}>
        <Route element={<RequirePath />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashSalesPage />} />
          <Route path="/dashboard/executor" element={<DashExecutorPage />} />
          <Route path="/dashboard/qa" element={<DashQaPage />} />
          <Route path="/dashboard/rnd" element={<DashRndPage />} />
          <Route path="/dashboard/accounting" element={<Navigate to="/dashboard/executor" replace />} />
          <Route path="/dashboard/director" element={<DashDirectorPage />} />
          <Route path="/dashboard/admin" element={<DashAdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/quotations" element={<QuoteListPage />} />
          <Route path="/quotations/new" element={<QuoteCreatePage />} />
          <Route path="/quotations/clone" element={<QuoteClonePage />} />
          <Route path="/quotations/resubmit" element={<QuoteResubmitPage />} />
          <Route path="/quotations/similar-product" element={<SimilarProductPage />} />
          <Route path="/quotations/similar-customer" element={<SimilarCustomerPage />} />
          <Route path="/quotations/:code/edit" element={<QuoteEditPage />} />
          <Route path="/quotations/:code" element={<QuotationDetailRoute><QuoteRequestPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/qa" element={<QuotationDetailRoute><QuoteQaPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/rnd" element={<LegacyRndTabRedirect />} />
          <Route path="/quotations/:code/development-minutes" element={<LegacyRndTabRedirect />} />
          <Route path="/quotations/:code/consolidation" element={<QuotationDetailRoute><QuoteConsolidationPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/accounting" element={<QuotationDetailRoute><QuoteAccountingPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/approval" element={<QuotationDetailRoute><QuoteApprovalPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/files" element={<QuotationDetailRoute><QuoteFilesPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/history" element={<QuotationDetailRoute><QuoteHistoryPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/revisions" element={<QuotationDetailRoute><QuoteRevisionsPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/revisions/:id" element={<QuoteSnapshotPage />} />
          <Route path="/quotations/:code/sla" element={<QuotationDetailRoute><SlaHistoryPage /></QuotationDetailRoute>} />
          <Route path="/quotations/:code/send" element={<SendConfirmPage />} />
          <Route path="/quotations/:code/snapshot" element={<QuoteSnapshotPage />} />

          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<CustomerCreatePage />} />
          <Route path="/customers/:code" element={<CustomerShellRoute />}>
            <Route index element={<CustomerDetailPage />} />
            <Route path="deactivate" element={<CustomerDeactivatePage />} />
            <Route path="contacts" element={<CustomerContactsPage />} />
            <Route path="contacts/new" element={<CustomerContactsPage modal />} />
            <Route path="contacts/:contactId/edit" element={<CustomerContactsPage modal />} />
            <Route path="contacts/:contactId/deactivate" element={<ContactDeactivatePage />} />
            <Route path="sales" element={<CustomerSalesPage />} />
            <Route path="quotes" element={<CustomerQuotesPage />} />
            <Route path="history" element={<CustomerHistoryPage />} />
          </Route>
          <Route path="/customers/:code/edit" element={<CustomerEditPage />} />

          <Route path="/reports" element={<ReportOpsPage />} />
          <Route path="/reports/business" element={<ReportBusinessPage />} />
          <Route path="/reports/departments" element={<ReportDeptPage />} />
          <Route path="/reports/resubmit" element={<ReportResubmitPage />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<UserListPage />} />
            <Route path="/admin/users/new" element={<CreateUserPage />} />
            <Route path="/admin/users/:username/edit" element={<EditUserPage />} />
            <Route path="/admin/users/:username/reset" element={<AdminResetPage />} />
            <Route path="/admin/users/:username/replace" element={<ReplaceUserPage />} />
            <Route path="/admin/sla" element={<SlaConfigPage />} />
            <Route path="/admin/sla/edit" element={<SlaConfigPage modal="edit" />} />
            <Route path="/admin/sla/history" element={<SlaConfigPage modal="history" />} />
          </Route>

          <Route path="/shared/states" element={<SharedIndexPage />} />
          <Route path="/shared/loading" element={<LoadingPage />} />
          <Route path="/shared/empty" element={<EmptyPage />} />
          <Route path="/shared/validation" element={<ValidationPage />} />
          <Route path="/shared/forbidden" element={<ForbiddenPage />} />
          <Route path="/shared/not-found" element={<NotFoundPage />} />
          <Route path="/shared/upload" element={<UploadStatesPage />} />
          <Route path="/shared/preview" element={<PreviewPage />} />
          <Route path="/shared/conflict" element={<ConflictPage />} />
          <Route path="/shared/cancel" element={<CancelQuotePage />} />
          <Route path="/shared/approve" element={<ApprovePage />} />
          <Route path="/shared/reject" element={<RejectPage />} />
          <Route path="/shared/complete" element={<CompleteTaskPage />} />
          <Route path="/shared/outcome" element={<OutcomePage />} />
          <Route path="/shared/resubmit-reason" element={<ResubmitReasonPage />} />
          <Route path="/shared/deactivate" element={<DeactivatePage />} />
          <Route path="/shared/toasts" element={<ToastPage />} />
          <Route path="*" element={<Navigate to="/shared/not-found" replace />} />
        </Route>
        </Route>
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
