import type { ReactNode } from "react";
import { DataTableSkeleton } from "./DataTableSkeleton";
import type { SkeletonPreset } from "./Skeleton";
import { DEFAULT_TABLE_EMPTY_MESSAGE, TableEmptyRow } from "./TableEmptyState";
import { tableShellClass, TableHead } from "./tableShell";

export function DataTable({
  columns,
  rows,
  loading,
  skeletonRows = 6,
  skeletonCells,
  emptyMessage = DEFAULT_TABLE_EMPTY_MESSAGE,
  emptyHint,
}: {
  columns: string[];
  rows: ReactNode[][];
  loading?: boolean;
  skeletonRows?: number;
  skeletonCells?: SkeletonPreset[];
  emptyMessage?: string;
  emptyHint?: string;
}) {
  if (loading) {
    return <DataTableSkeleton columns={columns} rowCount={skeletonRows} cellLayout={skeletonCells} />;
  }

  return (
    <div className={tableShellClass()}>
      <table className="w-full min-w-[760px] border-collapse text-left">
        <TableHead columns={columns} />
        <tbody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={columns.length} message={emptyMessage} hint={emptyHint} />
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--color-border)] text-sm">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 align-middle text-sm leading-5 text-[var(--color-text-strong)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  aside,
}: {
  kicker?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? (
          <p className="text-xs font-semibold tracking-[0.8px] text-[var(--color-text-muted)] uppercase">{kicker}</p>
        ) : null}
        {title ? (
          <h1 className="font-[family-name:var(--font-serif)] text-2xl leading-8 font-bold text-[var(--color-brand-primary)]">
            {title}
          </h1>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm leading-5 text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-serif)] text-[32px] leading-none font-bold text-[var(--color-text-strong)]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-[var(--color-text-body)]">{hint}</p> : null}
    </article>
  );
}
