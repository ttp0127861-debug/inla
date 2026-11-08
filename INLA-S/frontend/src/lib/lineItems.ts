import type { LineItem, QuotationDetailResponse } from "../api/quotations";

export type LineItemDraft = {
  lineNumber: number;
  itemCode: string;
  itemName: string;
  fluteType: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  quantity: string;
};

export function defaultSkuCode(lineNumber: number): string {
  return `SKU ${String(lineNumber).padStart(2, "0")}`;
}

export function emptyLineItemDraft(lineNumber: number): LineItemDraft {
  return {
    lineNumber,
    itemCode: defaultSkuCode(lineNumber),
    itemName: "",
    fluteType: "",
    lengthMm: "",
    widthMm: "",
    heightMm: "",
    quantity: "",
  };
}

export function lineItemDraftFromApi(item: LineItem): LineItemDraft {
  return {
    lineNumber: item.lineNumber,
    itemCode: item.itemCode ?? "",
    itemName: item.itemName,
    fluteType: item.fluteType,
    lengthMm: String(item.lengthMm),
    widthMm: String(item.widthMm),
    heightMm: String(item.heightMm),
    quantity: String(item.quantity),
  };
}

export function lineItemsFromDetail(detail: QuotationDetailResponse): LineItemDraft[] {
  if (detail.lineItems?.length) {
    return [...detail.lineItems].sort((a, b) => a.lineNumber - b.lineNumber).map(lineItemDraftFromApi);
  }
  const sales = detail.salesData;
  if (sales && (sales.boxType || sales.fluteType || sales.quantityPieces)) {
    return [
      {
        lineNumber: 1,
        itemCode: "",
        itemName: sales.boxType ?? "",
        fluteType: sales.fluteType ?? "",
        lengthMm: sales.lengthMm != null ? String(sales.lengthMm) : "",
        widthMm: sales.widthMm != null ? String(sales.widthMm) : "",
        heightMm: sales.heightMm != null ? String(sales.heightMm) : "",
        quantity: sales.quantityPieces != null ? String(sales.quantityPieces) : "",
      },
    ];
  }
  return [emptyLineItemDraft(1)];
}

export function lineItemsToInput(drafts: LineItemDraft[]): LineItem[] {
  return drafts.map((row, index) => ({
    lineNumber: index + 1,
    itemCode: row.itemCode.trim() || defaultSkuCode(index + 1),
    itemName: row.itemName.trim(),
    fluteType: row.fluteType.trim(),
    lengthMm: Number(row.lengthMm),
    widthMm: Number(row.widthMm),
    heightMm: Number(row.heightMm),
    quantity: Number.parseInt(row.quantity, 10),
  }));
}

export type LineItemValidation = { lineNumber: number; fields: string[] };

export function validateLineItemDrafts(drafts: LineItemDraft[]): LineItemValidation[] {
  const errors: LineItemValidation[] = [];
  for (const row of drafts) {
    const fields: string[] = [];
    if (!row.itemName.trim()) fields.push("itemName");
    if (!row.fluteType.trim()) fields.push("fluteType");
    if (!row.lengthMm || Number(row.lengthMm) <= 0) fields.push("lengthMm");
    if (!row.widthMm || Number(row.widthMm) <= 0) fields.push("widthMm");
    if (!row.heightMm || Number(row.heightMm) <= 0) fields.push("heightMm");
    if (!row.quantity || Number.parseInt(row.quantity, 10) <= 0) fields.push("quantity");
    if (fields.length) errors.push({ lineNumber: row.lineNumber, fields });
  }
  return errors;
}

export function totalLineItemQuantity(items: Pick<LineItem, "quantity">[]): number {
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

export function formatLineItemsSummary(items: LineItem[]): string {
  if (!items.length) return "—";
  return items
    .slice()
    .sort((a, b) => a.lineNumber - b.lineNumber)
    .map(
      (item) =>
        `${item.lineNumber}. ${item.itemName || "—"} · ${item.fluteType} · ${item.lengthMm}×${item.widthMm}×${item.heightMm} mm · SL ${item.quantity.toLocaleString("vi-VN")}`,
    )
    .join("\n");
}

export function lineItemsExtendedTotal(items: LineItem[]): number | null {
  const priced = items.filter((item) => item.unitPrice != null && item.unitPrice >= 0);
  if (priced.length === 0) return null;
  return priced.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0);
}

export function resolvedLineItems(detail: QuotationDetailResponse): LineItem[] {
  if (detail.lineItems?.length) return detail.lineItems;
  return lineItemsToInput(lineItemsFromDetail(detail));
}
