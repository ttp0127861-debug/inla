import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

function crumbFor(path: string): string {
  if (path.startsWith("/admin")) return "Quản trị";
  if (path.startsWith("/reports")) return "Báo cáo";
  if (path.startsWith("/customers")) return "Khách hàng";
  if (path.startsWith("/tasks")) return "Công việc";
  if (path.startsWith("/quotations")) return "Báo giá";
  return "Tổng quan";
}

export function AppShell() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const role = user?.role || "";

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[var(--color-surface-background)]">
      <div className="print-hide contents">
        <Sidebar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="print-hide">
          <Header crumb={crumbFor(pathname)} role={role} name={user?.name ?? ""} initials={user?.initials ?? ""} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 pb-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
