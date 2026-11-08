import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { canAccessReportTab } from "../../auth/cognito";
import { Badge, statusTone } from "../../components/ui/Badge";
import { CycleTypeBadge } from "../../components/ui/CycleTypeBadge";
import { DataTable } from "../../components/ui/DataTable";
import { SlaIndicatorBadge } from "../../components/ui/SlaIndicatorBadge";
import { WorkflowStatusBadge } from "../../components/ui/WorkflowStatusBadge";
import type { OpsDetailRow } from "./reportMappers";
import { TabRow } from "../../components/ui/Tabs";
import { REPORT_NAV } from "./reportConstants";

export function ReportNav() {
  const { user } = useAuth();
  const role = user?.role ?? "SALES";
  const tabs = REPORT_NAV.filter((tab) => canAccessReportTab(role, tab.to));
  return (
    <div className="mb-6">
      <TabRow tabs={tabs} />
    </div>
  );
}

export function ReportTableFooter({ summary, page = 1, totalPages = 4 }: { summary: string; page?: number; totalPages?: number }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-muted)]">
      <p>{summary}</p>
      <div className="flex items-center gap-2">
        <span>
          Trang {page} / {totalPages}
        </span>
        <div className="flex gap-1">
          <span className="rounded border border-[var(--color-border)] px-2 py-1 opacity-50">‹</span>
          <span className="rounded border border-[var(--color-action-primary)] bg-[#eff6ff] px-2 py-1 font-semibold text-[var(--color-action-primary)]">
            {page}
          </span>
          {totalPages > 1 ? (
            <span className="rounded border border-[var(--color-border)] px-2 py-1">2</span>
          ) : null}
          <span className="rounded border border-[var(--color-border)] px-2 py-1 opacity-50">›</span>
        </div>
      </div>
    </div>
  );
}

export function ReportLoadingBlock() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[#efe7e0]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[#efe7e0]" />
        <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[#efe7e0]" />
      </div>
      <p className="text-sm font-semibold tracking-wide text-[var(--color-text-muted)]">ĐANG TẢI DỮ LIỆU</p>
    </div>
  );
}

export function ReportEmptyState({ hint }: { hint?: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white text-center">
      <div>
        <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold">Không có dữ liệu</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {hint ?? "Không có bản ghi trong khoảng thời gian đã chọn."}
        </p>
      </div>
    </div>
  );
}

export function ReportErrorBanner({ message }: { message: string }) {
  return <p className="mb-4 rounded-[var(--radius-sm)] border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{message}</p>;
}

export function QuoteCodeLink({ code }: { code: string }) {
  return (
    <Link to={`/quotations/${encodeURIComponent(code)}`} className="font-semibold text-[var(--color-action-primary)] hover:underline">
      {code}
    </Link>
  );
}

export function StatusBadge({ label }: { label: string }) {
  if (/hạn|sla/i.test(label)) {
    return <SlaIndicatorBadge state={label} />;
  }
  return <Badge tone={statusTone(label)}>{label}</Badge>;
}

export function OperationsDetailTable({ rows, loading }: { rows: OpsDetailRow[]; loading?: boolean }) {
  return (
    <DataTable
      loading={loading}
      skeletonCells={["link", "barWide", "barNarrow", "pill", "pill", "barNarrow"]}
      columns={["Mã Báo giá", "Khách hàng", "Loại vòng", "Trạng thái workflow", "Trạng thái SLA", "Thời gian đã xử lý"]}
      rows={rows.map((row) => [
        <QuoteCodeLink code={row.code} />,
        row.customerName,
        <CycleTypeBadge cycleType={row.cycleType} />,
        <WorkflowStatusBadge status={row.workflowStatus} />,
        <SlaIndicatorBadge state={row.slaState} />,
        row.processedLabel,
      ])}
    />
  );
}

type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const gradient = segments
    .map((segment) => {
      const start = (cursor / total) * 100;
      cursor += segment.value;
      const end = (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-wrap items-center gap-8">
      <div
        className="relative size-44 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label={centerLabel}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <p className="text-2xl font-bold text-[var(--color-text-strong)]">{centerValue}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{centerLabel}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-[var(--color-text-strong)]">{segment.label}</span>
            <span className="text-[var(--color-text-muted)]">
              {segment.value} · {((segment.value / total) * 100).toFixed(1).replace(".", ",")}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VerticalBarChart({ bars, maxHeight = 192 }: { bars: { label: string; value: number }[]; maxHeight?: number }) {
  const peak = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <div className="flex h-52 items-end gap-4 md:gap-6">
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-sm font-semibold">{bar.value}</span>
          <div
            className="w-full rounded-t bg-[var(--color-brand-primary)]"
            style={{ height: `${Math.max(8, (bar.value / peak) * maxHeight)}px` }}
          />
          <span className="text-center text-xs text-[var(--color-text-muted)]">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueBarChart({ points }: { points: { label: string; value: number }[] }) {
  const peak = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex h-52 items-end gap-3">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold">{point.value} tr</span>
          <div
            className="w-full rounded-t bg-[var(--color-brand-primary)]"
            style={{ height: `${(point.value / peak) * 160}px` }}
          />
          <span className="text-xs text-[var(--color-text-muted)]">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineTrendChart({ points }: { points: { label: string; rate: number }[] }) {
  if (points.length === 0) return null;
  const width = 640;
  const height = 200;
  const max = Math.max(...points.map((point) => point.rate), 1);
  const coords = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * (width - 40) + 20;
    const y = height - 30 - (point.rate / max) * (height - 50);
    return { x, y, ...point };
  });
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[520px] w-full" role="img" aria-label="Biểu đồ tỷ lệ re-submit">
        <defs>
          <linearGradient id="resubmitFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#resubmitFill)"
          points={`${coords[0]?.x ?? 0},${height - 24} ${polyline} ${coords[coords.length - 1]?.x ?? 0},${height - 24}`}
        />
        <polyline fill="none" stroke="#1d4ed8" strokeWidth="2.5" points={polyline} />
        {coords.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#1d4ed8" />
            <text x={point.x} y={point.y - 10} textAnchor="middle" className="fill-[#111827] text-[11px]">
              {point.rate}%
            </text>
            <text x={point.x} y={height - 6} textAnchor="middle" className="fill-[#756e68] text-[11px]">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SlaDepartmentBars({
  departments,
}: {
  departments: { name: string; actualHours: number; slaHours: number; overSla?: boolean }[];
}) {
  const scaleMax = 5;
  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const widthPct = Math.min(100, (dept.actualHours / scaleMax) * 100);
        const markerPct = Math.min(100, (dept.slaHours / scaleMax) * 100);
        return (
          <div
            key={dept.name}
            className={`rounded-[var(--radius-sm)] px-3 py-2 ${dept.overSla ? "bg-[#fef2f2]" : ""}`}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">{dept.name}</span>
              <span className="text-[var(--color-text-muted)]">
                {dept.actualHours.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} giờ /{" "}
                {dept.slaHours.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} giờ SLA
              </span>
              {dept.overSla ? <Badge tone="danger">Vượt định mức</Badge> : null}
            </div>
            <div className="relative h-3 rounded-full bg-[#efe7e0]">
              <div
                className={`h-3 rounded-full ${dept.overSla ? "bg-[#ef4444]" : "bg-[var(--color-brand-primary)]"}`}
                style={{ width: `${widthPct}%` }}
              />
              <div
                className="absolute top-[-4px] h-5 w-0.5 bg-[#f97316]"
                style={{ left: `${markerPct}%` }}
                aria-hidden
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ok" | "danger" | "neutral";
}) {
  const border =
    tone === "ok"
      ? "border-[#047857]/40 bg-[#ecfdf5]/30"
      : tone === "danger"
        ? "border-[#b91c1c]/40 bg-[#fef2f2]/30"
        : "border-[var(--color-border)] bg-white";
  return (
    <article className={`rounded-[var(--radius-md)] border p-5 shadow-[var(--shadow-card)] ${border}`}>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-serif)] text-[32px] font-bold leading-none text-[var(--color-text-strong)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--color-text-body)]">{hint}</p>
    </article>
  );
}

export function ReportSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
      <header className="border-b border-[var(--color-border)] px-6 py-5">
        <h2 className="text-base font-semibold text-[var(--color-text-strong)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
