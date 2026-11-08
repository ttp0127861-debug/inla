import { SkeletonBar } from "./Skeleton";
import { DEFAULT_TABLE_EMPTY_MESSAGE } from "./TableEmptyState";

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4" aria-busy="true" aria-label="Đang tải danh sách">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded border border-[var(--color-border)] px-3 py-3">
          <SkeletonBar preset="barWide" className="mb-2" />
          <SkeletonBar preset="barNarrow" />
        </div>
      ))}
    </div>
  );
}

export function ListEmptyState({
  message = DEFAULT_TABLE_EMPTY_MESSAGE,
  hint,
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div
      className="mt-4 grid min-h-[160px] place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div>
        <p className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[var(--color-text-strong)]">{message}</p>
        {hint ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">{hint}</p> : null}
      </div>
    </div>
  );
}

export function QuotationLayoutSkeleton() {
  return (
    <section className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]" aria-busy="true" aria-label="Đang tải báo giá">
      <SkeletonBar preset="barWide" className="mb-3 h-7 w-56" />
      <SkeletonBar preset="barWide" className="mb-4 w-full max-w-xl" />
      <div className="flex gap-2">
        <SkeletonBar preset="pill" />
        <SkeletonBar preset="pill" />
      </div>
    </section>
  );
}

const CUSTOMER_TAB_PLACEHOLDERS = ["w-24", "w-36", "w-32", "w-20", "w-32"] as const;

export function CustomerLayoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải khách hàng">
      <section className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBar preset="barNarrow" className="h-3.5 w-40" />
          <SkeletonBar preset="barWide" className="h-8 w-full max-w-md" />
          <SkeletonBar preset="pill" className="mt-1" />
        </div>
        <div className="flex shrink-0 gap-2">
          <SkeletonBar preset="actions" />
          <SkeletonBar preset="actions" className="w-32" />
        </div>
      </section>
      <div className="flex gap-6 overflow-x-auto border-b border-[var(--color-border)] pb-px">
        {CUSTOMER_TAB_PLACEHOLDERS.map((width, index) => (
          <SkeletonBar key={index} preset="bar" className={`mb-3 h-4 ${width}`} />
        ))}
      </div>
      <div className="pt-6">
        <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
          <SkeletonBar preset="barWide" className="mb-5 h-5 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex h-11 items-center gap-2 rounded border border-[var(--color-border)] px-3">
                <SkeletonBar preset="icon" />
                <SkeletonBar preset="barWide" className="h-4 flex-1 max-w-none" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
