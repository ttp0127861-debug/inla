export function tableShellClass(): string {
  return "overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]";
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-[#faf7f4] text-xs leading-4 font-semibold text-[var(--color-text-muted)]">
      <tr>
        {columns.map((column) => (
          <th key={column} className="px-6 py-3 font-semibold">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}
