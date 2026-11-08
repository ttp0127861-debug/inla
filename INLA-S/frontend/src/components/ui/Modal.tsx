import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Modal({
  title,
  children,
  closeTo,
  width = "max-w-[560px]",
}: {
  title: string;
  children: ReactNode;
  closeTo: string;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-6">
      <section className={`w-full ${width} rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)]`}>
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-brand-primary)]">
            {title}
          </h2>
          <Link to={closeTo} className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-xl text-[var(--color-text-muted)]" aria-label="Đóng">
            ×
          </Link>
        </header>
        <div className="max-h-[min(720px,calc(100vh-8rem))] overflow-auto px-6 py-5">{children}</div>
      </section>
    </div>
  );
}

export function Drawer({
  title,
  children,
  closeTo,
}: {
  title: string;
  children: ReactNode;
  closeTo: string;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40">
      <aside className="absolute top-0 right-0 flex h-full w-[400px] max-w-full flex-col bg-white shadow-[var(--shadow-lg)]">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-text-strong)]">{title}</h2>
          <Link to={closeTo} className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-xl" aria-label="Đóng">
            ×
          </Link>
        </header>
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}
