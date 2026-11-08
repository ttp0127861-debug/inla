import { skeletonCell, type SkeletonPreset } from "./Skeleton";
import { tableShellClass, TableHead } from "./tableShell";

export function DataTableSkeleton({
  columns,
  rowCount = 6,
  cellLayout,
}: {
  columns: string[];
  rowCount?: number;
  cellLayout?: SkeletonPreset[];
}) {
  const layout = cellLayout ?? columns.map(() => "bar" as SkeletonPreset);

  return (
    <div className={tableShellClass()} aria-busy="true" aria-label="Đang tải bảng">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <TableHead columns={columns} />
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[var(--color-border)]">
              {columns.map((column, cellIndex) => (
                <td key={column} className="px-6 py-4 align-middle">
                  {skeletonCell(layout[cellIndex] ?? "bar")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
