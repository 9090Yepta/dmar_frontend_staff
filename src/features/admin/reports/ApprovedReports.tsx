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
import { LuDownload, LuFilter, LuRefreshCw, LuSearch } from "react-icons/lu";
import { PiSealWarningFill } from "react-icons/pi";
import { HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2";
import {
  getAdminUsers,
  getApprovedReports,
  getApprovedUnitOptions,
  getJobSites,
} from "../../../services/adminService";
import type { ApprovedReport } from "../../../types/admin";
import { createCsvBlob, createXlsxBlob } from "../../../utils/tableExport";
import {
  formatReportDate,
  formatUnitStatus,
} from "../../../utils/reportDisplay";
import { Modal } from "../../../components/ui/Modal";
import { showError, showSuccess } from "../../../utils/notifications";
import { ReportDetailsContent } from "../../reports/ReportDetailsContent";

const approvedTableFeatures = tableFeatures({ rowSelectionFeature });
const AntDateRangePicker = lazy(async () => {
  const { DatePicker } = await import("antd");
  return { default: DatePicker.RangePicker };
});

export function ApprovedReports({
  isSuperadmin,
  jobSiteName,
}: {
  isSuperadmin: boolean;
  jobSiteName?: string | null;
}) {
  const [mechanicField, setMechanicField] = useState<"name" | "nrpp">("name");
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [offset, setOffset] = useState(0);
  const [jobSiteId, setJobSiteId] = useState(0);
  const [foremanId, setForemanId] = useState(0);
  const [limit, setLimit] = useState(50);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detailsReport, setDetailsReport] = useState<ApprovedReport | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [appliedFilters, setAppliedFilters] = useState({
    mechanicField: "name" as "name" | "nrpp",
    mechanicSearch: "",
    unitCode: "",
    from: "",
    to: "",
    jobSiteId: 0,
    foremanId: 0,
  });
  const sitesQuery = useQuery({
    queryKey: ["admin-job-sites-options"],
    queryFn: getJobSites,
    enabled: isSuperadmin,
  });
  const foremenQuery = useQuery({
    queryKey: ["admin-approved-foremen", isSuperadmin, jobSiteId],
    queryFn: () => getAdminUsers("foreman", "", jobSiteId || null),
  });
  const unitsQuery = useQuery({
    queryKey: ["admin-approved-unit-options", jobSiteId],
    queryFn: () => getApprovedUnitOptions(jobSiteId || null),
  });
  const query = useQuery({
    queryKey: [
      "admin-approved",
      appliedFilters.mechanicField,
      appliedFilters.mechanicSearch,
      appliedFilters.unitCode,
      appliedFilters.from,
      appliedFilters.to,
      offset,
      appliedFilters.jobSiteId,
      appliedFilters.foremanId,
      limit,
    ],
    queryFn: () =>
      getApprovedReports({
        limit,
        offset,
        mechanicField: appliedFilters.mechanicField,
        mechanicSearch: appliedFilters.mechanicSearch,
        unitCode: appliedFilters.unitCode,
        from: appliedFilters.from,
        to: appliedFilters.to,
        jobSiteId: appliedFilters.jobSiteId || null,
        foremanId: appliedFilters.foremanId || null,
      }),
  });
  useEffect(() => setRowSelection({}), [appliedFilters, limit]);
  function searchReports() {
    setAppliedFilters((current) => ({
      ...current,
      mechanicField,
      mechanicSearch,
    }));
    setOffset(0);
    setRowSelection({});
  }
  function resetFilters() {
    setMechanicField("name");
    setMechanicSearch("");
    setUnitCode("");
    setDateRange(null);
    setJobSiteId(0);
    setForemanId(0);
    setOffset(0);
    setLimit(50);
    setAppliedFilters({
      mechanicField: "name",
      mechanicSearch: "",
      unitCode: "",
      from: "",
      to: "",
      jobSiteId: 0,
      foremanId: 0,
    });
    setRowSelection({});
  }
  const columns = useMemo<
    ColumnDef<typeof approvedTableFeatures, ApprovedReport>[]
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
            className="checkbox checkbox-xs checkbox-primary"
            type="checkbox"
            aria-label={`Pilih laporan ${row.original.id}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: "rowNumber",
        header: "No.",
        cell: ({ row }) => offset + row.index + 1,
      },
      {
        accessorKey: "date",
        header: "Tanggal",
        cell: ({ getValue }) => formatReportDate(getValue<string>()),
      },
      {
        accessorKey: "jobSiteName",
        header: "Job site",
        cell: ({ getValue }) => getValue<string>() || "Belum dipetakan",
      },
      {
        accessorKey: "unitCode",
        header: "Unit",
        cell: ({ row }) => (
          <>
            <strong>{row.original.unitCode || "—"}</strong>
            <span className="block text-xs opacity-60">
              {row.original.model}
            </span>
          </>
        ),
      },
      {
        accessorKey: "mechanicName",
        header: "Mekanik",
        cell: ({ row }) => (
          <>
            {row.original.mechanicName ?? "—"}
            <span className="block text-xs opacity-60">
              {row.original.mechanicNrpp ?? ""}
            </span>
          </>
        ),
      },
      { accessorKey: "foremanName", header: "Foreman" },
      {
        accessorKey: "activity",
        header: "Aktivitas",
        cell: ({ row }) => {
          const activities = row.original.activities?.length
            ? row.original.activities
            : row.original.activity
              ? [row.original.activity]
              : [];
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="block max-w-56 truncate"
                title={activities[0] || undefined}
              >
                {activities.length ? `1. ${activities[0]}` : "—"}
              </span>
              {activities.length > 1 && (
                <span
                  className="badge badge-outline badge-info badge-xs shrink-0"
                  title={`${activities.length - 1} aktivitas lainnya tersedia pada detail laporan`}
                >
                  {activities.length - 1} more..
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "workTime",
        header: "Waktu",
        cell: ({ row }) => {
          const start = row.original.start?.slice(0, 5);
          const finish = row.original.finish?.slice(0, 5);
          return start && finish ? `${start}-${finish}` : "—";
        },
      },
      {
        accessorKey: "unitStatus",
        header: "Status Unit",
        cell: ({ getValue }) => {
          const status = Number(getValue());
          const className =
            status === 1
              ? "badge-success"
              : status === 2
                ? "badge-warning"
                : "badge-neutral";
          return (
            <span className={`badge badge-soft badge-sm ${className}`}>
              {formatUnitStatus(status)}
            </span>
          );
        },
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label={`Lihat detail laporan ${row.original.id}`}
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
    features: approvedTableFeatures,
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
  async function exportReports() {
    setExporting(true);
    try {
      const pageSize = 500;
      const first = await getApprovedReports({
        limit: pageSize,
        offset: 0,
        mechanicField: appliedFilters.mechanicField,
        mechanicSearch: appliedFilters.mechanicSearch,
        unitCode: appliedFilters.unitCode,
        from: appliedFilters.from,
        to: appliedFilters.to,
        jobSiteId: appliedFilters.jobSiteId || null,
        foremanId: appliedFilters.foremanId || null,
      });
      const allRows = [...first.items];
      for (
        let pageOffset = pageSize;
        pageOffset < first.total;
        pageOffset += pageSize
      ) {
        const page = await getApprovedReports({
          limit: pageSize,
          offset: pageOffset,
          mechanicField: appliedFilters.mechanicField,
          mechanicSearch: appliedFilters.mechanicSearch,
          unitCode: appliedFilters.unitCode,
          from: appliedFilters.from,
          to: appliedFilters.to,
          jobSiteId: appliedFilters.jobSiteId || null,
          foremanId: appliedFilters.foremanId || null,
        });
        allRows.push(...page.items);
      }
      const selectedSet = new Set(selectedIds);
      const rows = allRows.filter((row) => selectedSet.has(row.id));
      const headers = [
        "Tanggal",
        "Job site",
        "Kode unit",
        "Model",
        "HM",
        "Mekanik",
        "NRPP",
        "foremen",
        "Problem",
        "Aktivitas",
        "start",
        "end",
        "Code Job",
        "Status unit",
        "status laporan",
        "Component",
        "Remark",
      ];
      const values = rows.map((row) => [
        formatReportDate(row.date),
        row.jobSiteName,
        row.unitCode,
        row.model,
        row.hm,
        row.mechanicName,
        row.mechanicNrpp,
        row.foremanName,
        row.problem,
        row.activities?.length ? row.activities.join("\n") : row.activity,
        row.start,
        row.finish,
        row.codeJob,
        row.unitStatus,
        "Approved",
        row.component,
        row.remark,
      ]);
      const blob =
        exportFormat === "csv"
          ? createCsvBlob(headers, values)
          : await createXlsxBlob(
              "DMAR Approved",
              headers,
              values,
              [
                14, 24, 16, 18, 12, 24, 18, 18, 36, 42, 14, 14, 18, 16, 20,
                24, 42,
              ],
            );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dmar-approved${appliedFilters.jobSiteId ? `-site-${appliedFilters.jobSiteId}` : ""}${appliedFilters.foremanId ? `-foreman-${appliedFilters.foremanId}` : ""}-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      link.click();
      URL.revokeObjectURL(url);
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
      <section
        className="mb-4 overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm"
        aria-label="Filter laporan approved"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/35 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <LuFilter className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Filter laporan</h2>
              <p className="text-xs text-base-content/55">
                Cari mekanik dan sesuaikan daftar laporan approved.
              </p>
            </div>
          </div>
          <span className="badge badge-ghost whitespace-nowrap">
            {query.data?.total ?? 0} hasil
          </span>
        </div>
        <div className="grid grid-cols-1 items-center gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12">
          <form
            className="join w-full xl:col-span-3"
            onSubmit={(event) => {
              event.preventDefault();
              searchReports();
            }}
          >
            <select
              className="join-item select select-sm select-bordered w-24 shrink-0"
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
              placeholder={`Cari ${mechanicField === "name" ? "Nama" : "NRPP"}`}
              value={mechanicSearch}
              onChange={(event) => setMechanicSearch(event.target.value)}
            />
            <button
              className="join-item btn btn-info btn-sm"
              type="submit"
              aria-label="Cari mekanik"
            >
              <LuSearch className="size-4" />
            </button>
          </form>
          <select
            className="select select-sm select-bordered w-full min-w-0 xl:col-span-3"
            aria-label="Filter foreman"
            value={foremanId}
            onChange={(event) => {
              const value = Number(event.target.value);
              setForemanId(value);
              setOffset(0);
              setAppliedFilters((current) => ({
                ...current,
                foremanId: value,
              }));
            }}
            disabled={foremenQuery.isLoading || foremenQuery.isError}
          >
            <option value={0}>Semua foreman</option>
            {(foremenQuery.data?.items ?? []).map((foreman) => (
              <option key={foreman.id} value={foreman.id}>
                {foreman.name}
              </option>
            ))}
          </select>
          <select
            className="select select-sm select-bordered w-full min-w-0 xl:col-span-1"
            aria-label="Filter unit"
            value={unitCode}
            onChange={(event) => {
              const value = event.target.value;
              setUnitCode(value);
              setOffset(0);
              setAppliedFilters((current) => ({ ...current, unitCode: value }));
            }}
            disabled={unitsQuery.isLoading || unitsQuery.isError}
          >
            <option value="">All Unit</option>
            {(unitsQuery.data?.items ?? []).map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {isSuperadmin ? (
            <select
              className="select select-sm select-bordered w-full min-w-0 xl:col-span-2"
              aria-label="Filter job site"
              value={jobSiteId}
              onChange={(event) => {
                const value = Number(event.target.value);
                setJobSiteId(value);
                setForemanId(0);
                setUnitCode("");
                setOffset(0);
                setAppliedFilters((current) => ({
                  ...current,
                  jobSiteId: value,
                  foremanId: 0,
                  unitCode: "",
                }));
              }}
            >
              <option value={0}>All site</option>
              {(sitesQuery.data?.items ?? []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex min-h-8 items-center justify-center gap-2 xl:col-span-2">
              <span className="text-xs text-base-content/60">Job site</span>
              <span className="badge badge-outline">
                {jobSiteName || "Site akun"}
              </span>
            </div>
          )}
          <div className="w-full xl:col-span-3">
            <Suspense
              fallback={<div className="skeleton h-8 w-full rounded-lg" />}
            >
              <AntDateRangePicker
                className="h-8 w-full min-w-0"
                allowClear
                format="DD-MMM-YY"
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setOffset(0);
                  setAppliedFilters((current) => ({
                    ...current,
                    from: value?.[0]?.format("YYYY-MM-DD") ?? "",
                    to: value?.[1]?.format("YYYY-MM-DD") ?? "",
                  }));
                }}
                disabledDate={(current) => current.isAfter(dayjs(), "day")}
                placeholder={["Start date", "End date"]}
              />
            </Suspense>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-300/70 bg-base-200/20 px-4 py-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm border border-base-300"
            onClick={resetFilters}
          >
            Reset filter
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <LuRefreshCw
              className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
            Muat ulang
          </button>
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
              onClick={() => void exportReports()}
            >
              <LuDownload className="size-4" />
              {exporting
                ? `Menyiapkan ${exportFormat.toUpperCase()}…`
                : `Ekspor ${exportFormat.toUpperCase()}`}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            Baris
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
              ? Array.from({ length: 8 }, (_, index) => (
                  <tr key={`loading-${index}`} aria-hidden="true">
                    {skeletonHeaders.map((header) => (
                      <td key={header.id}>
                        <div
                          className={`skeleton h-5 ${header.id === "select" ? "w-4" : header.id === "details" ? "w-8" : "w-20"}`}
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
            <div className="m-4 rounded-box border border-dashed border-gray-300">
              <div className="flex items-center justify-center gap-2 p-4">
                <PiSealWarningFill className="size-6 text-warning" />
                <span className="text-base-content/60 italic">
                  "Laporan tidak ditemukan!"
                </span>
              </div>
            </div>
          )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          className="btn btn-info btn-sm"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Prev
        </button>
        <span className="text-xs opacity-60">
          Page {query.data?.total ? Math.floor(offset / limit) + 1 : 0} /{" "}
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
        title="Detail laporan approved"
        onClose={() => setDetailsReport(null)}
        headerless
      >
        {detailsReport && (
          <ReportDetailsContent report={detailsReport} status="approved" />
        )}
      </Modal>
    </>
  );
}
