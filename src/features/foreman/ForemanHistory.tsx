import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";
import { getForemanApprovedReports } from "../../services/reportService";
import type { ForemanApprovedReport } from "../../types/staff";
import { formatReportDate } from "../../utils/reportDisplay";
import { FaSearch } from "react-icons/fa";
import { PiSealWarningFill } from "react-icons/pi";
import { VscThinking } from "react-icons/vsc";

const historyTableFeatures = tableFeatures({});

export function ForemanHistory() {
  const [mechanicField, setMechanicField] = useState<"name" | "nrpp">("name");
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState({
    field: "name" as "name" | "nrpp",
    value: "",
  });
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: [
      "foreman-approved",
      offset,
      limit,
      appliedSearch.field,
      appliedSearch.value,
    ],
    queryFn: () =>
      getForemanApprovedReports(
        limit,
        offset,
        appliedSearch.field,
        appliedSearch.value,
      ),
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const columns = useMemo<
    ColumnDef<typeof historyTableFeatures, ForemanApprovedReport>[]
  >(
    () => [
      {
        id: "rowNumber",
        header: "No.",
        cell: ({ row }) => offset + row.index + 1,
      },
      { accessorKey: "mechanicNrpp", header: "NRPP" },
      { accessorKey: "mechanicName", header: "Nama" },
      {
        accessorKey: "unitCode",
        header: "Unit / model",
        cell: ({ row }) => (
          <>
            <span className="font-semibold">
              {row.original.unitCode || "—"}
            </span>
            <span className="block text-xs text-base-content/60">
              {row.original.model || "—"}
            </span>
          </>
        ),
      },
      {
        accessorKey: "date",
        header: "Tanggal laporan",
        cell: ({ getValue }) => formatReportDate(getValue<string>()),
      },
      {
        accessorKey: "approvedAt",
        header: "Tanggal disetujui",
        cell: ({ getValue }) => formatReportDate(getValue<string | null>()),
      },
    ],
    [offset],
  );
  const table = useTable({
    features: historyTableFeatures,
    data: items,
    columns,
    getRowId: (row) => String(row.id),
  });

  function searchReports() {
    setAppliedSearch({ field: mechanicField, value: mechanicSearch.trim() });
    setOffset(0);
  }

  function changeLimit(value: number) {
    setLimit(value);
    setOffset(0);
  }

  const rangeStart = total ? offset + 1 : 0;
  const rangeEnd = Math.min(offset + limit, total);

  return (
    <section
      className="grid min-w-0 gap-4"
      aria-labelledby="foreman-history-title"
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          RIWAYAT
        </p>
        <h2 id="foreman-history-title" className="mt-1 text-xl font-bold">
          Approval History
        </h2>
        <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
          Riwayat laporan mekanik yang telah Anda setujui.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="join w-full sm:max-w-lg">
          <select
            className="join-item select select-sm select-bordered w-22 shrink-0"
            aria-label="Kolom pencarian mekanik"
            value={mechanicField}
            onChange={(event) =>
              setMechanicField(event.target.value as "name" | "nrpp")
            }
          >
            <option value="name">Nama</option>
            <option value="nrpp">NRPP</option>
          </select>
          <input
            className="join-item input input-sm input-bordered w-full min-w-0"
            type="search"
            placeholder={`Cari ${mechanicField === "name" ? "Nama" : "NRPP"} Mekanik`}
            value={mechanicSearch}
            onChange={(event) => setMechanicSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") searchReports();
            }}
          />
          <button
            className="join-item btn btn-primary btn-sm"
            type="button"
            onClick={searchReports}
          >
            <FaSearch className="size-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs sm:ml-auto">
          Baris
          <select
            className="select select-bordered select-xs w-16"
            value={limit}
            aria-label="Jumlah baris per halaman"
            onChange={(event) => changeLimit(Number(event.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {query.error && (
        <div className="alert alert-error" role="alert">
          {query.error.message}
        </div>
      )}
      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm">
        <table
          className="table table-xs whitespace-nowrap sm:table-sm"
          aria-busy={query.isFetching}
        >
          <thead className="bg-warning/70">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {query.isFetching
              ? Array.from({ length: Math.min(limit, 6) }, (_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} aria-hidden="true">
                    {table
                      .getHeaderGroups()
                      .flatMap((group) => group.headers)
                      .map((header, columnIndex) => (
                        <td key={`${rowIndex}-${header.id}`}>
                          <div
                            className={`skeleton h-4 ${columnIndex === 0 ? "w-8" : "w-24"}`}
                          />
                        </td>
                      ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!query.isFetching && !query.error && items.length === 0 && (
          <div className="flex items-center justify-center gap-2 p-4">
            {appliedSearch.value ? (
              <>
                <PiSealWarningFill className="size-6 text-warning" />
                <span className="text-base-content/60 italic">
                  Laporan Tidak Ditemukan!
                </span>
              </>
            ) : (
              <>
                <span className="text-base-content/60 italic">
                  Belum ada laporan yang disetujui.
                </span>
                <VscThinking className="size-6 text-info" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-base-content/60">
          Hasil: {total} · {rangeStart}-{rangeEnd}
        </span>
        <div className="join ml-auto">
          <button
            className="btn btn-ghost btn-sm join-item"
            type="button"
            disabled={offset === 0 || query.isFetching}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Prev
          </button>
          <span className="join-item inline-flex min-w-28 items-center justify-center border border-base-300 bg-base-100 px-3 text-sm text-base-content/70">
            Halaman {total ? Math.floor(offset / limit) + 1 : 0} /{" "}
            {Math.ceil(total / limit)}
          </span>
          <button
            className="btn btn-ghost btn-sm join-item"
            type="button"
            disabled={offset + limit >= total || query.isFetching}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
