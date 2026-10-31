import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LuCircleCheck,
  LuDownload,
  LuFilter,
  LuFileSearch,
  LuRefreshCw,
  LuSearch,
  LuTriangleAlert,
} from "react-icons/lu";
import { PiSealWarningFill } from "react-icons/pi";
import { TbReport } from "react-icons/tb";
import dayjs, { type Dayjs } from "dayjs";
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  rowSelectionFeature,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  getAdminUsers,
  getJobSites,
  getMasterRows,
} from "../../services/adminService";
import type { PendingReport } from "../../types/staff";
import { formatReportDate, formatUnitStatus } from "../../utils/reportDisplay";
import { ReportDetailsContent } from "./ReportDetailsContent";
import { createCsvBlob, createXlsxBlob } from "../../utils/tableExport";
import {
  confirmAction,
  showError,
  showSuccess,
} from "../../utils/notifications";

const pendingTableFeatures = tableFeatures({
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const AntDateRangePicker = lazy(async () => {
  const { DatePicker } = await import("antd");
  return { default: DatePicker.RangePicker };
});

type PendingApprovalsProps = {
  reports: PendingReport[];
  busy: boolean;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onApprove: (id: number) => void;
  isSuperadmin?: boolean;
  canApprove?: boolean;
  role: "foreman" | "admin" | "superadmin";
  jobSiteId?: number | null;
  pendingCount: number;
  scopeLabel: string;
};

export function PendingApprovals({
  reports,
  busy,
  loading,
  refreshing,
  onRefresh,
  onApprove,
  isSuperadmin = false,
  canApprove = false,
  role,
  jobSiteId = null,
  pendingCount,
  scopeLabel,
}: PendingApprovalsProps) {
  const canUseAdminFilters = role === "admin" || role === "superadmin";
  const [mechanicField, setMechanicField] = useState<"name" | "nrpp">("name");
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [foremanSearch, setForemanSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [jobSiteSearch, setJobSiteSearch] = useState("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [appliedFilters, setAppliedFilters] = useState({
    mechanicField: "name" as "name" | "nrpp",
    mechanicSearch: "",
    foremanSearch: "",
    unitSearch: "",
    jobSiteSearch: "",
    from: "",
    to: "",
  });
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(
    null,
  );
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = useState(false);
  const detailsDialogRef = useRef<HTMLDialogElement>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const unitsQuery = useQuery({
    queryKey: ["admin-masters", "units"],
    queryFn: () => getMasterRows("units"),
    enabled: isSuperadmin,
  });
  const jobSitesQuery = useQuery({
    queryKey: ["admin-job-sites-options"],
    queryFn: getJobSites,
    enabled: isSuperadmin,
  });
  const foremenQuery = useQuery({
    queryKey: ["admin-users", "foreman-options"],
    queryFn: () => getAdminUsers("foreman", ""),
    enabled: role !== "foreman",
  });
  const units = useMemo(() => {
    const catalogUnits = (unitsQuery.data?.items ?? []).flatMap((item) =>
      "unitCode" in item ? [item.unitCode] : [],
    );
    return Array.from(
      new Set([
        ...catalogUnits,
        ...reports.map((report) => report.unitCode).filter(Boolean),
      ]),
    ).sort();
  }, [reports, unitsQuery.data]);
  const jobSites = useMemo(() => {
    const sites = (jobSitesQuery.data?.items ?? []).map(
      (site) => [String(site.id), site.name] as [string, string],
    );
    if (!isSuperadmin && jobSiteId !== null) {
      sites.push([String(jobSiteId), scopeLabel]);
    }
    if (reports.some((report) => report.jobSiteId === null)) {
      sites.push(["unassigned", "Belum dipetakan"]);
    }
    return sites;
  }, [isSuperadmin, jobSiteId, jobSitesQuery.data, reports, scopeLabel]);
  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        const mechanicValue =
          appliedFilters.mechanicField === "name"
            ? report.mechanicName
            : report.mechanicNrpp;
        if (
          appliedFilters.mechanicSearch &&
          !mechanicValue
            .toLocaleLowerCase()
            .includes(appliedFilters.mechanicSearch.trim().toLocaleLowerCase())
        )
          return false;
        if (
          appliedFilters.unitSearch &&
          report.unitCode !== appliedFilters.unitSearch
        )
          return false;
        if (
          appliedFilters.foremanSearch &&
          String(report.foremanId ?? "") !== appliedFilters.foremanSearch
        )
          return false;
        const reportSiteId =
          report.jobSiteId === null ? "unassigned" : String(report.jobSiteId);
        if (
          appliedFilters.jobSiteSearch &&
          reportSiteId !== appliedFilters.jobSiteSearch
        )
          return false;
        if (
          appliedFilters.from &&
          dayjs(report.date).isBefore(
            dayjs(appliedFilters.from).startOf("day"),
            "day",
          )
        )
          return false;
        if (
          appliedFilters.to &&
          dayjs(report.date).isAfter(
            dayjs(appliedFilters.to).endOf("day"),
            "day",
          )
        )
          return false;
        return true;
      }),
    [reports, appliedFilters],
  );
  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  }, [appliedFilters]);
  function searchReports() {
    setAppliedFilters((current) => ({
      ...current,
      mechanicField,
      mechanicSearch,
    }));
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  }
  function resetFilters() {
    setMechanicField("name");
    setMechanicSearch("");
    setForemanSearch("");
    setUnitSearch("");
    setJobSiteSearch("");
    setDateRange(null);
    setAppliedFilters({
      mechanicField: "name",
      mechanicSearch: "",
      foremanSearch: "",
      unitSearch: "",
      jobSiteSearch: "",
      from: "",
      to: "",
    });
    setPagination((current) => ({ ...current, pageIndex: 0, pageSize: 50 }));
    setRowSelection({});
  }
  useEffect(() => {
    if (
      selectedReport &&
      detailsDialogRef.current &&
      !detailsDialogRef.current.open
    ) {
      detailsDialogRef.current.showModal();
    }
  }, [selectedReport]);
  const columns = useMemo<
    ColumnDef<typeof pendingTableFeatures, PendingReport>[]
  >(
    () => [
      ...(canUseAdminFilters
        ? ([
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
          ] satisfies ColumnDef<typeof pendingTableFeatures, PendingReport>[])
        : []),
      {
        id: "rowNumber",
        header: "No.",
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "date",
        header: "Tanggal",
        cell: ({ getValue }) => formatReportDate(getValue<string>()),
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
            {row.original.mechanicName}
            <span className="block text-xs opacity-60">
              {row.original.mechanicNrpp}
            </span>
          </>
        ),
      },
      {
        accessorKey: "foremanName",
        header: "Foreman",
        cell: ({ getValue }) => getValue<string>() || "—",
      },
      {
        accessorKey: "jobSiteName",
        header: "Job site",
        cell: ({ getValue }) =>
          getValue<string | null>() || (
            <div className="flex items-center gap-1 text-warning italic">
              <LuTriangleAlert className="size-4" />
              <span>Belum dipetakan</span>
            </div>
          ),
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-xs"
            type="button"
            onClick={() => setSelectedReport(row.original)}
            aria-label={`Lihat detail laporan ${row.original.id}`}
          >
            <LuFileSearch className="size-5" /> Detail
          </button>
        ),
      },
      ...(canApprove
        ? [
            {
              id: "action",
              header: "Tindakan",
              cell: ({ row }: { row: { original: PendingReport } }) => (
                <button
                  className="btn btn-success btn-sm"
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: "Setujui laporan?",
                      text: `Laporan dari ${row.original.mechanicName} akan disetujui.`,
                      confirmButtonText: "Setujui laporan",
                    });
                    if (confirmed) onApprove(row.original.id);
                  }}
                >
                  <LuCircleCheck className="size-4" /> Setujui
                </button>
              ),
            },
          ]
        : []),
    ],
    [busy, onApprove, canApprove, canUseAdminFilters],
  );
  const table = useTable({
    features: pendingTableFeatures,
    data: filteredReports,
    columns,
    state: {
      pagination: {
        ...pagination,
        pageSize: canUseAdminFilters
          ? pagination.pageSize
          : Math.max(reports.length, 1),
      },
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row.id),
  });
  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  async function exportReports() {
    setExporting(true);
    try {
      const headers = [
        "DMAR",
        "Tanggal",
        "Job site",
        "Kode unit",
        "Model",
        "HM",
        "Mekanik",
        "NRPP Mekanik",
        "Foreman",
        "Problem",
        "Aktivitas",
        "Mulai",
        "Selesai",
        "Code Job",
        "Status unit",
        "Component",
        "Remark",
        "Status laporan",
      ];
      const selected = new Set(selectedIds);
      const values = filteredReports
        .filter((report) => selected.has(String(report.id)))
        .map((report) => [
          report.id,
          report.date,
          report.jobSiteName || "Belum dipetakan",
          report.unitCode,
          report.model,
          report.hm,
          report.mechanicName,
          report.mechanicNrpp,
          report.foremanName,
          report.problem,
          report.activities?.length
            ? report.activities.join("\n")
            : report.activity,
          report.start,
          report.finish,
          report.codeJob,
          formatUnitStatus(report.unitStatus),
          report.component,
          report.remark,
          "Pending",
        ]);
      const blob =
        exportFormat === "csv"
          ? createCsvBlob(headers, values)
          : await createXlsxBlob(
              "DMAR Pending",
              headers,
              values,
              [
                12, 14, 24, 16, 18, 12, 24, 18, 24, 36, 42, 14, 14, 18, 16, 24,
                42, 18,
              ],
            );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dmar-pending-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-1 rounded-box border border-base-300 bg-base-100 p-2 shadow-sm sm:px-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <TbReport className="size-5" />
          </span>

          <div>
            <p className="font-semibold">Laporan menunggu persetujuan</p>

            <p className="text-sm text-base-content/60">
              {role === "superadmin"
                ? "Kelola data dan akses untuk seluruh job site."
                : `Kelola laporan untuk job site ${scopeLabel}.`}
            </p>
          </div>
        </div>

        <span className="badge badge-warning badge-outline">
          {pendingCount} laporan menunggu
        </span>
      </div>

      {canUseAdminFilters && (
        <>
          <section
            className="mb-4 overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm"
            aria-label="Filter laporan pending"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/35 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <LuFilter className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">Filter laporan</h2>
                  <p className="text-xs text-base-content/55">
                    Cari mekanik dan sesuaikan daftar laporan.
                  </p>
                </div>
              </div>
              <span className="badge badge-ghost whitespace-nowrap">
                {pendingCount} pending
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
                value={foremanSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setForemanSearch(value);
                  setAppliedFilters((current) => ({
                    ...current,
                    foremanSearch: value,
                  }));
                }}
                disabled={foremenQuery.isLoading || foremenQuery.isError}
              >
                <option value="">Semua foreman</option>
                {foremenQuery.isLoading && (
                  <option disabled>Memuat daftar foreman…</option>
                )}
                {foremenQuery.isError && (
                  <option disabled>Gagal memuat daftar foreman</option>
                )}
                {(foremenQuery.data?.items ?? []).map((foreman) => (
                  <option key={foreman.id} value={foreman.id}>
                    {foreman.name}
                  </option>
                ))}
              </select>

              <select
                className="select select-sm select-bordered w-full min-w-0 xl:col-span-1"
                aria-label="Filter unit"
                value={unitSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setUnitSearch(value);
                  setAppliedFilters((current) => ({
                    ...current,
                    unitSearch: value,
                  }));
                }}
              >
                <option value="">All Unit</option>
                {unitsQuery.isLoading ? (
                  <option disabled>Memuat...</option>
                ) : unitsQuery.isError ? (
                  <option disabled>Gagal</option>
                ) : (
                  units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))
                )}
              </select>

              {isSuperadmin ? (
                <select
                  className="select select-sm select-bordered w-full min-w-0 xl:col-span-2"
                  aria-label="Filter job site"
                  value={jobSiteSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setJobSiteSearch(value);
                    setAppliedFilters((current) => ({
                      ...current,
                      jobSiteSearch: value,
                    }));
                  }}
                >
                  <option value="">All site</option>
                  {jobSitesQuery.isLoading ? (
                    <option disabled>Memuat...</option>
                  ) : jobSitesQuery.isError ? (
                    <option disabled>Gagal</option>
                  ) : (
                    jobSites.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <div className="flex min-h-8 items-center gap-2 justify-center xl:col-span-2">
                  <span className="text-xs text-base-content/60">Job site</span>
                  <span className="badge badge-outline">{scopeLabel}</span>
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
                      setAppliedFilters((current) => ({
                        ...current,
                        from: value?.[0]?.format("YYYY-MM-DD") ?? "",
                        to: value?.[1]?.format("YYYY-MM-DD") ?? "",
                      }));
                    }}
                    disabledDate={(current) => current.isAfter(dayjs(), "day")}
                    placeholder={["Start date", "End Date"]}
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
                onClick={onRefresh}
                disabled={refreshing}
              >
                <LuRefreshCw
                  className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                />{" "}
                Muat ulang
              </button>
            </div>
          </section>
        </>
      )}
      {loading && reports.length === 0 ? (
        <section className="empty-state">Memuat antrean laporan…</section>
      ) : (
        <>
          {canUseAdminFilters && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-sm text-base-content/60">
              <span>
                Hasil : <b>{filteredReports.length}</b> dari{" "}
                <b>{reports.length}</b> laporan
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <span>{selectedIds.length} dipilih</span>
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
                    disabled={
                      exporting ||
                      loading ||
                      refreshing ||
                      selectedIds.length === 0
                    }
                    onClick={() => void exportReports()}
                  >
                    <LuDownload className="size-4" />
                    {exporting
                      ? `Menyiapkan ${exportFormat.toUpperCase()}…`
                      : `Ekspor ${exportFormat.toUpperCase()}`}
                  </button>
                </div>
                <label className="flex items-center gap-2">
                  Baris
                  <select
                    className="select select-bordered select-sm"
                    value={pagination.pageSize}
                    onChange={(event) => {
                      table.setPageSize(Number(event.target.value));
                      setRowSelection({});
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </label>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
            <table
              className="table table-xs table-zebra whitespace-nowrap"
              aria-busy={refreshing || loading}
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
                {refreshing || loading
                  ? Array.from({ length: 8 }, (_, index) => (
                      <tr key={`loading-${index}`} aria-hidden="true">
                        {table
                          .getHeaderGroups()
                          .flatMap((group) => group.headers)
                          .map((header) => (
                            <td key={header.id}>
                              <div
                                className={`skeleton h-5 ${header.id === "select" ? "w-4" : "w-20"}`}
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
            {refreshing && (
              <div className="p-3 text-xs opacity-60">Memperbarui data…</div>
            )}
            {!refreshing && filteredReports.length === 0 && (
              <div className="m-4 rounded-box border border-dashed border-gray-300">
                <div className="flex items-center justify-center gap-2 p-4">
                  <PiSealWarningFill className="size-6 text-warning" />
                  <span className="text-base-content/60 italic">
                    {canUseAdminFilters
                      ? "Laporan tidak ditemukan!"
                      : "Tidak ada laporan pending yang ditugaskan kepada Anda"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {canUseAdminFilters && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="btn btn-info btn-sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Prev
                </button>
                <span className="text-xs opacity-60">
                  Page {table.getPageCount() ? pagination.pageIndex + 1 : 0} /{" "}
                  {table.getPageCount()}
                </span>
                <button
                  className="btn btn-info btn-sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <dialog
        ref={detailsDialogRef}
        className="modal"
        onClose={() => setSelectedReport(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            detailsDialogRef.current?.close();
        }}
      >
        {selectedReport && (
          <ReportDetailsContent report={selectedReport} status="pending" />
        )}
      </dialog>
    </>
  );
}
