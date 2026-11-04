import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import dayjs, { type Dayjs } from "dayjs";
import { LuDownload, LuFilter, LuSearch } from "react-icons/lu";
import { FaRegFileZipper } from "react-icons/fa6";
import { HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2";
import {
  exportLegacyReports,
  getLegacyForemen,
  getLegacyReports,
} from "../../../services/adminService";
import type { LegacyReport } from "../../../types/admin";
import { formatReportDate } from "../../../utils/reportDisplay";
import { createXlsxBlob } from "../../../utils/tableExport";
import { Modal } from "../../../components/ui/Modal";
import { showError, showSuccess } from "../../../utils/notifications";
import { ReportDetailsContent } from "../../reports/ReportDetailsContent";

const legacyTableFeatures = tableFeatures({ rowSelectionFeature });
const AntDateRangePicker = lazy(async () => {
  const { DatePicker } = await import("antd");
  return { default: DatePicker.RangePicker };
});

function timeFormat(time: string | null | undefined): string {
  if (!time) return ""; // Mencegah error jika kosong/null
  return time.slice(0, 5);
}

export function LegacyReports({ csrfToken }: { csrfToken: string }) {
  const [mechanicField, setMechanicField] = useState<"name" | "nrpp">("name");
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [foremanId, setForemanId] = useState(0);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [offset, setOffset] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detailsReport, setDetailsReport] = useState<LegacyReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [limit, setLimit] = useState(50);
  const [appliedFilters, setAppliedFilters] = useState({
    mechanicField: "name" as "name" | "nrpp",
    mechanicSearch: "",
    foremanId: 0,
    from: "",
    to: "",
  });
  const from = dateRange?.[0]?.format("YYYY-MM-DD") ?? "";
  const to = dateRange?.[1]?.format("YYYY-MM-DD") ?? "";
  const foremenQuery = useQuery({
    queryKey: ["admin-legacy-foremen"],
    queryFn: getLegacyForemen,
  });
  const query = useQuery({
    queryKey: [
      "admin-legacy-reports",
      appliedFilters.mechanicField,
      appliedFilters.mechanicSearch,
      appliedFilters.foremanId,
      appliedFilters.from,
      appliedFilters.to,
      offset,
      limit,
    ],
    queryFn: () =>
      getLegacyReports({
        limit,
        offset,
        mechanicField: appliedFilters.mechanicField,
        mechanicSearch: appliedFilters.mechanicSearch,
        foremanId: appliedFilters.foremanId || null,
        from: appliedFilters.from,
        to: appliedFilters.to,
      }),
  });
  const columns = useMemo<
    ColumnDef<typeof legacyTableFeatures, LegacyReport>[]
  >(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            className="checkbox checkbox-xs checkbox-primary"
            type="checkbox"
            aria-label="Pilih semua laporan pada halaman ini"
            checked={table.getIsAllPageRowsSelected()}
            ref={(element) => {
              if (element)
                element.indeterminate = table.getIsSomePageRowsSelected();
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            className="checkbox checkbox-xs checkbox-info"
            type="checkbox"
            aria-label={`Pilih laporan nomor ${offset + row.index + 1}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: "serial",
        header: "No.",
        cell: ({ row }) => offset + row.index + 1,
      },
      {
        accessorKey: "date",
        header: "Tanggal",
        cell: ({ getValue }) => formatReportDate(getValue<string>()),
      },
      {
        id: "mechanic",
        header: "Mekanik",
        cell: ({ row }) => (
          <>
            <span>{row.original.mechanicName || "—"}</span>
            <span className="block text-xs text-base-content/60">
              {row.original.mechanicNrpp || "—"}
            </span>
          </>
        ),
      },
      {
        accessorKey: "foremanName",
        header: "Foreman",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        id: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <>
            <strong>{row.original.unitCode || "—"}</strong>
            <span className="block text-xs text-base-content/60">
              {row.original.model || "—"}
            </span>
          </>
        ),
      },
      {
        accessorKey: "status",
        header: "Approval",
        cell: ({ getValue }) => {
          const approved = Number(getValue()) === 1;
          return (
            <span
              className={`badge badge-xs ${approved ? "badge-success" : "badge-neutral"} badge-outline`}
            >
              {approved ? "Approved" : "Pending"}
            </span>
          );
        },
      },
      {
        accessorKey: "unitStatus",
        header: "Status Unit",
        cell: ({ getValue }) => {
          const status = Number(getValue());
          return (
            <div className="flex items-center gap-1">
              <span
                className={` ${status === 1 ? "status status-lg status-success" : status === 2 ? "status status-lg status-warning" : "-"}`}
              ></span>
              <span>
                {status === 1 ? "Ready" : status === 2 ? "Continue" : "-"}
              </span>
            </div>
          );
        },
      },
      {
        id: "_start",
        header: "Start",
        cell: ({ row }) => {
          return timeFormat(row.original.start);
        },
      },
      {
        id: "_finish",
        header: "Finish",
        cell: ({ row }) => {
          return timeFormat(row.original.finish);
        },
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label={`Lihat detail laporan tanggal ${row.original.date}`}
            onClick={() => setDetailsReport(row.original)}
          >
            <HiOutlineDocumentMagnifyingGlass className="size-4" />
          </button>
        ),
      },
    ],
    [offset],
  );
  const table = useTable({
    features: legacyTableFeatures,
    data: query.data?.items ?? [],
    columns,
    getRowId: (row) => String(row.id),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).map(Number).filter(Number.isSafeInteger),
    [rowSelection],
  );
  const skeletonHeaders = table
    .getHeaderGroups()
    .flatMap((group) => group.headers);

  useEffect(() => {
    setRowSelection({});
  }, [appliedFilters, limit]);

  function searchReports() {
    setAppliedFilters({ mechanicField, mechanicSearch, foremanId, from, to });
    setOffset(0);
    setRowSelection({});
  }

  function resetFilters() {
    setMechanicField("name");
    setMechanicSearch("");
    setForemanId(0);
    setDateRange(null);
    setOffset(0);
    setLimit(50);
    setAppliedFilters({
      mechanicField: "name",
      mechanicSearch: "",
      foremanId: 0,
      from: "",
      to: "",
    });
    setRowSelection({});
  }

  async function exportSelected() {
    setExporting(true);
    try {
      const result = await exportLegacyReports(
        selectedIds,
        csrfToken,
        exportFormat,
      );
      let blob: Blob;
      if (exportFormat === "csv") {
        if (!(result instanceof Blob))
          throw new Error("Data CSV dari server tidak valid.");
        blob = result;
      } else {
        if (result instanceof Blob)
          throw new Error("Data XLSX dari server tidak valid.");
        const headers = [
          "tanggal",
          "nrpp",
          "nama",
          "foremen",
          "unit_code",
          "model",
          "hm",
          "problem",
          "activity",
          "start",
          "end",
          "code_job",
          "component",
          "remark",
          "status_unit",
          "status laporan",
        ];
        const rows = result.map((row) =>
          headers.map((key) => row[key as keyof typeof row]),
        );
        blob = await createXlsxBlob(
          "Legacy Reports",
          headers,
          rows,
          [14, 16, 28, 28, 16, 18, 12, 36, 42, 14, 14, 18, 24, 42, 18, 18],
        );
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dmar-legacy-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showSuccess("Laporan berhasil diekspor");
    } catch (error) {
      showError(
        "Ekspor laporan gagal",
        error instanceof Error ? error.message : "Silakan coba lagi.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div
        role="status"
        className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-50 via-orange-50/60 to-base-100 px-4 py-3 shadow-sm"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <FaRegFileZipper className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-amber-950">
            Laporan DMAR versi lama
          </p>
          <p className="mt-0.5 text-sm leading-5 text-amber-950/70">
            Arsip laporan lama yang belum memiliki job site. Data di halaman ini
            hanya dapat dilihat.
          </p>
        </div>
      </div>
      <section
        className="mb-4 overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm"
        aria-label="Filter laporan lama"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/35 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <LuFilter className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Filter laporan</h2>
              <p className="text-xs text-base-content/55">
                Cari berdasarkan mekanik, foreman, atau tanggal.
              </p>
            </div>
          </div>
          <span className="badge badge-ghost whitespace-nowrap">
            {query.data?.total ?? 0} hasil
          </span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <label className="fieldset min-w-0">
            <span className="label text-xs font-semibold text-base-content/65">
              Mekanik
            </span>
            <div className="join w-full">
              <select
                className="select select-bordered select-sm join-item w-28 shrink-0"
                value={mechanicField}
                onChange={(event) => {
                  setMechanicField(event.target.value as "name" | "nrpp");
                }}
                aria-label="Cari mekanik berdasarkan"
              >
                <option value="name">Nama</option>
                <option value="nrpp">NRPP</option>
              </select>
              <input
                className="input input-bordered input-sm join-item flex-1"
                type="search"
                placeholder={
                  mechanicField === "name" ? "Nama Mekanik" : "NRPP Mekanik"
                }
                value={mechanicSearch}
                onChange={(event) => {
                  setMechanicSearch(event.target.value);
                }}
              />
            </div>
          </label>
          <label className="fieldset min-w-0">
            <span className="label text-xs font-semibold text-base-content/65">
              Foreman
            </span>
            <select
              className="select select-bordered select-sm w-full"
              value={foremanId}
              onChange={(event) => {
                setForemanId(Number(event.target.value));
              }}
            >
              <option value={0}>Semua foreman</option>
              {(foremenQuery.data?.items ?? []).map((foreman) => (
                <option key={foreman.id} value={foreman.id}>
                  {foreman.name}
                </option>
              ))}
            </select>
          </label>
          <div className="fieldset min-w-0">
            <span className="label text-xs font-semibold text-base-content/65">
              Rentang tanggal
            </span>
            <Suspense fallback={<div className="skeleton h-9 w-full" />}>
              <AntDateRangePicker
                className="h-9 w-full min-w-0"
                allowClear
                format="DD-MMM-YY"
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                }}
                disabledDate={(current) => current.isAfter(dayjs(), "day")}
                placeholder={["Tanggal awal", "Tanggal akhir"]}
              />
            </Suspense>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300/70 bg-base-200/20 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={searchReports}
            >
              <LuSearch className="size-4" />
              Cari
            </button>
            <button
              className="btn btn-ghost btn-sm border border-base-300"
              type="button"
              onClick={resetFilters}
            >
              Reset filter
            </button>
          </div>
          <p className="text-xs text-base-content/55">
            Menampilkan{" "}
            <span className="font-semibold text-base-content">
              {query.data?.total ?? 0}
            </span>{" "}
            laporan arsip
          </p>
        </div>
      </section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-base-content/60">
          {selectedIds.length} laporan dipilih
        </span>
        <div className="flex items-center gap-3">
          <div className="join">
            <select
              className="select select-bordered select-sm join-item"
              aria-label="Format ekspor"
              value={exportFormat}
              disabled={exporting}
              onChange={(event) =>
                setExportFormat(event.target.value as "csv" | "xlsx")
              }
            >
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </select>
            <button
              className="btn btn-primary btn-sm join-item"
              type="button"
              disabled={exporting || selectedIds.length === 0}
              onClick={() => void exportSelected()}
            >
              <LuDownload className="size-4" />
              {exporting
                ? `Menyiapkan ${exportFormat.toUpperCase()}…`
                : `Ekspor ${exportFormat.toUpperCase()}`}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span>Baris</span>
            <select
              className="select select-bordered select-sm"
              value={limit}
              aria-label="Jumlah baris per halaman"
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setOffset(0);
                setRowSelection({});
              }}
            >
              {[50, 100, 250, 500, 1000].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table
          className="table table-xs table-zebra whitespace-nowrap"
          aria-busy={query.isFetching}
        >
          <thead className="bg-amber-300">
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
              ? Array.from({ length: 10 }, (_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`} aria-hidden="true">
                    {skeletonHeaders.map((header) => (
                      <td key={header.id}>
                        <div
                          className={`skeleton h-6 ${header.id === "select" ? "w-4" : header.id === "details" ? "w-8" : "w-20"}`}
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
        {query.error && (
          <p className="p-4 text-sm text-error">{query.error.message}</p>
        )}
        {!query.isFetching &&
          !query.error &&
          (query.data?.items.length ?? 0) === 0 && (
            <p className="empty-state m-4">
              Tidak ada laporan lama tanpa job site.
            </p>
          )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="text-sm">Result : {query.data?.total ?? 0}</span>
        <button
          className="btn btn-info btn-sm"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Prev
        </button>
        <span className="text-xs opacity-60">
          Page {query.data?.total ? Math.floor(offset / limit) + 1 : 0}
          {" / "}
          {Math.ceil((query.data?.total ?? 0) / limit)}
        </span>
        <button
          className="btn btn-info btn-sm"
          disabled={offset + limit >= (query.data?.total ?? 0)}
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </button>
      </div>

      <Modal
        open={detailsReport !== null}
        title="Detail Report"
        onClose={() => setDetailsReport(null)}
        headerless
      >
        {detailsReport && (
          <ReportDetailsContent
            report={detailsReport}
            status={Number(detailsReport.status) === 1 ? "approved" : "pending"}
          />
        )}
      </Modal>
    </>
  );
}
