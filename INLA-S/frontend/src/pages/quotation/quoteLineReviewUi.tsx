import type { LineItem } from "../../api/quotations";

export function lineContextSubtitle(line: LineItem): string {
  const dims = `${line.lengthMm}×${line.widthMm}×${line.heightMm} mm`;
  const qty = line.quantity.toLocaleString("vi-VN");
  return `${dims} · SL ${qty}`;
}

export function lineContextTitle(line: LineItem): string {
  const name = line.itemName?.trim() || "—";
  const code = line.itemCode?.trim() ?? "";
  return code ? `${code}: ${name}` : name;
}

export function LineContextHeading({ line }: { line: LineItem }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h3 className="text-base font-semibold text-[var(--color-text-strong)]">{lineContextTitle(line)}</h3>
      <span className="rounded border border-[var(--color-border)] bg-[#f9fafb] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
        {line.fluteType || "—"}
      </span>
      <span className="text-sm text-[var(--color-text-muted)]">{lineContextSubtitle(line)}</span>
    </div>
  );
}

export function LineItemsSummaryTable({ lines }: { lines: LineItem[] }) {
  return (
    <div className="mb-6 max-h-[min(40vh,280px)] overflow-auto rounded border border-[var(--color-border)]">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#faf7f4] text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_1px_0_0_var(--color-border)]">
          <tr>
            <th className="border-b px-3 py-2">#</th>
            <th className="border-b px-3 py-2">Mã</th>
            <th className="border-b px-3 py-2">Tên SP</th>
            <th className="border-b px-3 py-2">Sóng</th>
            <th className="border-b px-3 py-2">D/R/C (mm)</th>
            <th className="border-b px-3 py-2">SL</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((row) => (
            <tr key={row.lineNumber} className="border-b border-[var(--color-border)]">
              <td className="px-3 py-2 font-medium">{row.lineNumber}</td>
              <td className="px-3 py-2 text-[var(--color-text-muted)]">{row.itemCode?.trim() || "—"}</td>
              <td className="px-3 py-2">{row.itemName}</td>
              <td className="px-3 py-2">{row.fluteType}</td>
              <td className="px-3 py-2 tabular-nums">
                {row.lengthMm}×{row.widthMm}×{row.heightMm}
              </td>
              <td className="px-3 py-2 tabular-nums">{row.quantity.toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
