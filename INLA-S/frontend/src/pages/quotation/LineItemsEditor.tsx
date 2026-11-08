import { Button } from "../../components/ui/Button";
import { CircleIconButton } from "../../components/ui/CollapsibleSection";
import { emptyLineItemDraft, type LineItemDraft, type LineItemValidation } from "../../lib/lineItems";

const inputClass =
  "h-9 w-full min-w-0 rounded border border-[#d1d5db] px-2 text-sm disabled:bg-[#f9fafb] disabled:text-[#6b7280]";
const errorClass = "border-[#ef4444] bg-[#fef2f2]";

type LineItemsEditorProps = {
  rows: LineItemDraft[];
  onChange: (rows: LineItemDraft[]) => void;
  disabled?: boolean;
  validation?: LineItemValidation[];
};

function rowHasError(validation: LineItemValidation[] | undefined, lineNumber: number, field: string): boolean {
  return Boolean(validation?.some((v) => v.lineNumber === lineNumber && v.fields.includes(field)));
}

export function LineItemsEditor({ rows, onChange, disabled, validation }: LineItemsEditorProps) {
  const updateRow = (index: number, patch: Partial<LineItemDraft>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([...rows, emptyLineItemDraft(rows.length + 1)]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange(
      rows
        .filter((_, i) => i !== index)
        .map((row, i) => ({
          ...row,
          lineNumber: i + 1,
          itemCode: emptyLineItemDraft(i + 1).itemCode,
        })),
    );
  };

  return (
    <div className="space-y-3">
      <div className="max-h-[min(70vh,520px)] overflow-auto rounded border border-[var(--color-border)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#faf7f4] text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_1px_0_0_var(--color-border)]">
            <tr>
              <th className="border-b px-2 py-2">#</th>
              <th className="border-b px-2 py-2">Tên SP *</th>
              <th className="border-b px-2 py-2">Sóng *</th>
              <th className="border-b px-2 py-2">D (mm) *</th>
              <th className="border-b px-2 py-2">R (mm) *</th>
              <th className="border-b px-2 py-2">C (mm) *</th>
              <th className="border-b px-2 py-2">SL *</th>
              {!disabled ? <th className="border-b px-2 py-2 w-16" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.lineNumber} className="border-b border-[var(--color-border)]">
                <td className="px-2 py-2 font-medium">{row.lineNumber}</td>
                <td className="p-1">
                  <input
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "itemName") ? errorClass : ""}`}
                    value={row.itemName}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { itemName: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "fluteType") ? errorClass : ""}`}
                    value={row.fluteType}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { fluteType: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "lengthMm") ? errorClass : ""}`}
                    value={row.lengthMm}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { lengthMm: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "widthMm") ? errorClass : ""}`}
                    value={row.widthMm}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { widthMm: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "heightMm") ? errorClass : ""}`}
                    value={row.heightMm}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { heightMm: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className={`${inputClass} ${rowHasError(validation, row.lineNumber, "quantity") ? errorClass : ""}`}
                    value={row.quantity}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  />
                </td>
                {!disabled ? (
                  <td className="p-1 text-center">
                    <Button type="button" variant="text" disabled={rows.length <= 1} onClick={() => removeRow(index)}>
                      Xóa
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled ? (
        <div className="flex justify-end">
          <CircleIconButton label="Thêm dòng SKU" variant="add" onClick={addRow} />
        </div>
      ) : null}
    </div>
  );
}
