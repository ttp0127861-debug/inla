import type { LineItem } from "../../api/quotations";

const inputClass =
  "h-9 w-full min-w-0 rounded border border-[#d1d5db] px-2 text-sm disabled:bg-[#f9fafb]";

type LinePriceState = { unitPrice: string; lineRemark: string };

type PriceFormatGridProps = {
  items: LineItem[];
  customerName: string;
  printingPlateCost?: number | null;
  dieCost?: number | null;
  prices: Record<number, LinePriceState>;
  onPriceChange: (lineNumber: number, patch: Partial<LinePriceState>) => void;
  editable?: boolean;
};

export function PriceFormatGrid({
  items,
  customerName,
  printingPlateCost,
  dieCost,
  prices,
  onPriceChange,
  editable,
}: PriceFormatGridProps) {
  const sorted = [...items].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="overflow-x-auto rounded border border-[var(--color-border)]">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-[#faf7f4] text-xs font-semibold text-[var(--color-text-muted)]">
          <tr>
            <th className="border-b px-2 py-2">Tên SP</th>
            <th className="border-b px-2 py-2">Khách hàng</th>
            <th className="border-b px-2 py-2">Sóng</th>
            <th className="border-b px-2 py-2">D×R×C (mm)</th>
            <th className="border-b px-2 py-2">Price (VNĐ) *</th>
            <th className="border-b px-2 py-2">Chi phí bản in</th>
            <th className="border-b px-2 py-2">Chi phí khuôn</th>
            <th className="border-b px-2 py-2">Qty</th>
            <th className="border-b px-2 py-2">Remark</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const state = prices[item.lineNumber] ?? { unitPrice: "", lineRemark: "" };
            return (
              <tr key={item.lineNumber} className="border-b border-[var(--color-border)]">
                <td className="px-2 py-2">{item.itemName}</td>
                <td className="px-2 py-2 text-[var(--color-text-muted)]">{customerName}</td>
                <td className="px-2 py-2">{item.fluteType}</td>
                <td className="px-2 py-2">
                  {item.lengthMm}×{item.widthMm}×{item.heightMm}
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className={inputClass}
                    value={state.unitPrice}
                    disabled={!editable}
                    onChange={(e) => onPriceChange(item.lineNumber, { unitPrice: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 text-[var(--color-text-muted)]">
                  {printingPlateCost != null ? printingPlateCost.toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-2 py-2 text-[var(--color-text-muted)]">
                  {dieCost != null ? dieCost.toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-2 py-2">{item.quantity.toLocaleString("vi-VN")}</td>
                <td className="p-1">
                  <input
                    className={inputClass}
                    value={state.lineRemark}
                    disabled={!editable}
                    onChange={(e) => onPriceChange(item.lineNumber, { lineRemark: e.target.value })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function pricesFromLineItems(items: LineItem[]): Record<number, { unitPrice: string; lineRemark: string }> {
  return Object.fromEntries(
    items.map((item) => [
      item.lineNumber,
      {
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : "",
        lineRemark: item.lineRemark ?? "",
      },
    ]),
  );
}

export function consolidationLinePayload(
  items: LineItem[],
  prices: Record<number, { unitPrice: string; lineRemark: string }>,
) {
  return items.map((item) => ({
    lineNumber: item.lineNumber,
    unitPrice: Number(prices[item.lineNumber]?.unitPrice ?? item.unitPrice ?? 0),
    lineRemark: prices[item.lineNumber]?.lineRemark?.trim() || null,
  }));
}
