export const DEFAULT_TABLE_EMPTY_MESSAGE = "Không tìm thấy dữ liệu";

export function TableEmptyRow({
  colSpan,
  message = DEFAULT_TABLE_EMPTY_MESSAGE,
  hint,
}: {
  colSpan: number;
  message?: string;
  hint?: string;
}) {
  return (
    <tr className="border-t border-[var(--color-border)]">
      <td colSpan={colSpan} className="px-6 py-14 text-center" role="status" aria-live="polite">
        <p className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[var(--color-text-strong)]">{message}</p>
        {hint ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">{hint}</p> : null}
      </td>
    </tr>
  );
}
