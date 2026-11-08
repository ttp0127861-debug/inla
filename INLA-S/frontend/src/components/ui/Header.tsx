import { Link } from "react-router-dom";
import { useSignOutAction } from "../../auth/AuthContext";
import { roleDisplayLabel } from "../../lib/roleLabels";

type HeaderProps = {
  crumb: string;
  role: string;
  name: string;
  initials: string;
};

export function Header({ crumb, role, name, initials }: HeaderProps) {
  const signOut = useSignOutAction();

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b-[0.84px] border-[var(--color-border)] bg-white px-6">
      <p className="truncate text-sm leading-5 text-[var(--color-text-muted)]">
        Hệ thống quản lý báo giá thùng carton INLA-S / {crumb}
      </p>
      <div className="flex items-center gap-4">
        <span className="inline-flex h-6 items-center rounded-[4px] bg-[#f5ebe6] px-2 text-xs leading-4 font-semibold tracking-[0.36px] text-[var(--color-brand-primary)]">
          {roleDisplayLabel(role)}
        </span>
        <Link to="/profile" className="flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] p-1 hover:bg-[var(--color-text-button-hover)] focus-visible:bg-[var(--color-text-button-focus)] focus-visible:outline-none">
          <span className="grid size-9 place-items-center rounded-full bg-[var(--color-avatar)] text-xs leading-[18px] font-bold text-[var(--color-brand-primary)]">
            {initials}
          </span>
          <span className="text-sm leading-5 font-semibold whitespace-nowrap text-[var(--color-text-strong)]">{name}</span>
          <img src="/icons/chevron.svg" alt="" width={18} height={18} />
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border-[0.84px] border-[var(--color-border)] bg-white px-3 text-sm leading-5 font-medium whitespace-nowrap text-[var(--color-brand-primary)] transition-colors hover:bg-[var(--color-secondary-hover)] focus-visible:bg-white focus-visible:shadow-[0px_0px_0px_3px_rgba(99,53,23,0.25)] focus-visible:outline-none active:bg-[var(--color-secondary-hover)] disabled:cursor-not-allowed disabled:bg-white disabled:opacity-50 disabled:shadow-none disabled:hover:bg-white disabled:active:bg-white"
        >
          <img src="/icons/logout.svg" alt="" width={18} height={18} />
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
