import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table';
import type { RowData } from '@tanstack/table-core';

export const dataTableFeatures = tableFeatures({});

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: ColumnDef<typeof dataTableFeatures, TData>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
};

export function DataTable<TData extends RowData>({ data, columns, loading = false, error, emptyMessage = 'Belum ada data.' }: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, data, columns });

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table table-zebra whitespace-nowrap" aria-busy={loading}>
        <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</th>)}</tr>)}</thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} aria-hidden="true">
                  {table.getHeaderGroups().flatMap((group) => group.headers).map((header, columnIndex) => (
                    <td key={`${rowIndex}-${header.id}`}>
                      <div className={`skeleton h-4 ${columnIndex === 0 ? "w-10" : "w-24"}`} />
                    </td>
                  ))}
                </tr>
              ))
            : table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getAllCells().map((cell) => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}</tr>)}
        </tbody>
      </table>
      {error && <p className="p-4 text-sm text-error">{error}</p>}
      {!loading && !error && data.length === 0 && <p className="empty-state m-4">{emptyMessage}</p>}
    </div>
  );
}
