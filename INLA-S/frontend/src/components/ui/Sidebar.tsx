import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { homeFor, sectionsFor } from "../../auth/cognito";
import { Logo } from "./Logo";

type NavItem =
  | { kind: "single"; id: string; label: string; icon: string; end: boolean; to: string }
  | {
      kind: "group";
      id: string;
      label: string;
      icon: string;
      children: { label: string; to: string }[];
    };

function adminChildIsActive(pathname: string, to: string): boolean {
  if (to === "/admin/sla") return pathname.startsWith("/admin/sla");
  return pathname === "/admin" || (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/sla"));
}

function navItemsForRole(role: string, home: string): NavItem[] {
  const items: NavItem[] = [
    { kind: "single", id: "overview", label: "Tổng quan", icon: "/icons/nav-overview.svg", end: true, to: home },
    { kind: "single", id: "quotations", label: "Báo giá", icon: "/icons/nav-quote.svg", end: false, to: "/quotations" },
    { kind: "single", id: "tasks", label: "Công việc", icon: "/icons/nav-tasks.svg", end: false, to: "/tasks" },
    { kind: "single", id: "customers", label: "Khách hàng", icon: "/icons/nav-customers.svg", end: false, to: "/customers" },
    { kind: "single", id: "reports", label: "Báo cáo", icon: "/icons/nav-reports.svg", end: false, to: "/reports" },
    {
      kind: "group",
      id: "admin",
      label: "Quản trị",
      icon: "/icons/nav-admin.svg",
      children: [
        { label: "Quản lý người dùng", to: "/admin" },
        { label: "Cấu hình SLA", to: "/admin/sla" },
      ],
    },
  ];
  const allowed = new Set(sectionsFor(role));
  return items.filter((item) => allowed.has(item.id));
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(99,53,23,0.25)]",
    isActive
      ? "bg-[var(--color-nav-active)] font-semibold text-[var(--color-brand-primary)]"
      : "font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-background)] hover:text-[var(--color-text-strong)]",
  ].join(" ");

export function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || "SALES";
  const home = homeFor(user?.groups ?? []);
  const location = useLocation();
  const items = navItemsForRole(role, home);

  const adminChildActive = items.some(
    (i) => i.kind === "group" && i.id === "admin" && i.children.some((c) => adminChildIsActive(location.pathname, c.to)),
  );
  const [adminOpen, setAdminOpen] = useState(() => adminChildActive);

  useEffect(() => {
    if (adminChildActive) setAdminOpen(true);
  }, [adminChildActive]);

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-[var(--color-border)] bg-white px-4 pb-6 pt-5">
      <Logo />
      <nav className="mt-2 flex w-full flex-col gap-2" aria-label="Điều hướng chính">
        {items.map((item) => {
          if (item.kind === "single") {
            return (
              <NavLink key={item.id} to={item.to} end={item.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span className="absolute top-2 left-0 h-7 w-1 rounded-r bg-[var(--color-brand-primary)]" />
                    ) : null}
                    <img src={item.icon} alt="" width={20} height={20} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          const groupActive = item.children.some((c) => adminChildIsActive(location.pathname, c.to));

          return (
            <div key={item.id} className="flex flex-col gap-1">
              <button
                type="button"
                aria-expanded={adminOpen}
                aria-controls="sidebar-admin-subnav"
                onClick={() => setAdminOpen((o) => !o)}
                className={[
                  "relative flex h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(99,53,23,0.25)]",
                  groupActive || adminOpen
                    ? "bg-[var(--color-nav-active)] font-semibold text-[var(--color-brand-primary)]"
                    : "font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-background)] hover:text-[var(--color-text-strong)]",
                ].join(" ")}
              >
                {groupActive ? (
                  <span className="absolute top-2 left-0 h-7 w-1 rounded-r bg-[var(--color-brand-primary)]" />
                ) : null}
                <img src={item.icon} alt="" width={20} height={20} />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-[var(--color-text-muted)]" aria-hidden>
                  {adminOpen ? "▾" : "▸"}
                </span>
              </button>
              {adminOpen ? (
                <div id="sidebar-admin-subnav" className="ml-2 flex flex-col gap-1 border-l border-[var(--color-border)] pl-2">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.to === "/admin"}
                      className={({ isActive }) =>
                        [
                          "flex min-h-9 items-center rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(99,53,23,0.25)]",
                          isActive
                            ? "bg-[var(--color-nav-active)] font-semibold text-[var(--color-brand-primary)]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-background)] hover:text-[var(--color-text-strong)]",
                        ].join(" ")
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
