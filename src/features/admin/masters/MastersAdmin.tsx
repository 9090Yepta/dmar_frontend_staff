import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { LuImage, LuPencil, LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
} from "@tanstack/react-table";
import {
  deleteMasterRow,
  getMasterRows,
  saveMasterRow,
} from "../../../services/adminService";
import { Modal } from "../../../components/ui/Modal";
import { AdminSectionHeading as SectionHeading } from "../components/AdminSectionHeading";
import type { MasterResource, MasterRow } from "../../../types/admin";
import {
  confirmAction,
  showError,
  showSuccess,
} from "../../../utils/notifications";
import { apiAssetUrl } from "../../../services/apiClient";

const clientMasterTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export function MastersAdmin({ csrfToken }: { csrfToken: string }) {
  const client = useQueryClient();
  const [resource, setResource] = useState<MasterResource>("units");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [unitSearchBy, setUnitSearchBy] = useState<
    "unitCode" | "model" | "brand"
  >("unitCode");
  const [unitSearchInput, setUnitSearchInput] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [unitPage, setUnitPage] = useState(0);
  const [unitLimit, setUnitLimit] = useState(10);
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [unitCode, setUnitCode] = useState("");
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [unitImage, setUnitImage] = useState<File | null>(null);
  const [unitImagePreview, setUnitImagePreview] = useState("");
  const [unitImageUrl, setUnitImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [groupCode, setGroupCode] = useState(1);
  const query = useQuery({
    queryKey: [
      "admin-masters",
      resource,
      unitSearchBy,
      unitSearch,
      unitPage,
      unitLimit,
    ],
    queryFn: () =>
      getMasterRows(
        resource,
        resource === "units"
          ? {
              searchBy: unitSearchBy,
              search: unitSearch,
              limit: unitLimit,
              offset: unitPage * unitLimit,
            }
          : undefined,
      ),
  });
  useEffect(() => {
    if (!unitImage) {
      setUnitImagePreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(unitImage);
    setUnitImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [unitImage]);
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ["admin-masters"] });
  const save = useMutation({
    mutationFn: () =>
      saveMasterRow(
        resource,
        editing?.id ?? null,
        resource === "units"
          ? { unitCode, model, brand, ...(unitImage ? { unitImage } : {}) }
          : resource === "job-codes"
            ? { description, groupCode }
            : { description },
        csrfToken,
      ),
    onSuccess: async () => {
      showSuccess(
        editing
          ? "Data master berhasil diperbarui"
          : "Data master berhasil ditambahkan",
      );
      clearForm();
      await invalidate();
    },
  });
  const columns = useMemo<
    ColumnDef<typeof clientMasterTableFeatures, MasterRow>[]
  >(() => {
    const base: ColumnDef<typeof clientMasterTableFeatures, MasterRow>[] = [
      {
        id: "rowNumber",
        header: "No.",
        cell: ({ row }) =>
          resource === "units"
            ? unitPage * unitLimit + row.index + 1
            : row.index + 1,
      },
    ];
    if (resource === "units") {
      base.push({
        id: "unitImage",
        header: "Gambar",
        cell: ({ row }) => {
          if (!("unitCode" in row.original)) return "—";
          const unit = row.original;
          const initials =
            unit.model
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || unit.unitCode.slice(0, 2);
          return (
            <div className="grid size-16 place-items-center overflow-hidden rounded-box border border-base-300 bg-base-200/40 p-1">
              {unit.imageUrl ? (
                <img
                  src={apiAssetUrl(unit.imageUrl)}
                  alt={`${unit.unitCode} ${unit.model}`}
                  className="h-full w-full object-contain"
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
              ) : (
                <span className="grid size-full place-items-center text-xs font-bold text-primary">
                  {initials}
                </span>
              )}
            </div>
          );
        },
      });
      base.push(
        { accessorKey: "unitCode", header: "Kode unit" },
        { accessorKey: "model", header: "Model" },
        { accessorKey: "brand", header: "Brand" },
      );
    } else
      base.push(
        { accessorKey: "description", header: "Deskripsi" },
        ...(resource === "job-codes"
          ? [
              {
                accessorKey: "groupCode",
                header: "Kelompok",
              } as ColumnDef<typeof clientMasterTableFeatures, MasterRow>,
            ]
          : []),
      );
    base.push({
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button
            className="btn btn-ghost btn-xs"
            aria-label="Edit"
            onClick={() => beginEdit(row.original)}
          >
            <LuPencil className="size-4" />
          </button>
          <button
            className="btn btn-ghost btn-xs text-error"
            aria-label={
              resource === "units" ? "Nonaktifkan unit" : "Hapus data"
            }
            onClick={() => void remove(row.original)}
          >
            <LuTrash2 className="size-4" />
          </button>
        </div>
      ),
    });
    return base;
  }, [resource, csrfToken, unitPage, unitLimit]);
  function clearForm() {
    setIsModalOpen(false);
    setEditing(null);
    setUnitCode("");
    setModel("");
    setBrand("");
    setUnitImage(null);
    setUnitImageUrl("");
    setDescription("");
    setGroupCode(1);
  }
  function beginEdit(row: MasterRow) {
    setEditing(row);
    if (resource === "units" && "unitCode" in row) {
      setUnitCode(row.unitCode);
      setModel(row.model);
      setBrand(row.brand);
      setUnitImage(null);
      setUnitImageUrl(row.imageUrl ? apiAssetUrl(row.imageUrl) : "");
      setIsModalOpen(true);
    } else if ("description" in row) {
      setDescription(row.description);
      if ("groupCode" in row) setGroupCode(row.groupCode);
      setIsModalOpen(true);
    }
  }
  async function remove(row: MasterRow) {
    if (
      !(await confirmAction({
        title:
          resource === "units" ? "Nonaktifkan unit?" : "Hapus data master?",
        text:
          resource === "units"
            ? "Unit tidak akan muncul pada pilihan laporan baru. Data unit, gambar, dan laporan lama tetap disimpan."
            : "Item yang dipakai laporan DMAR tidak dapat dihapus.",
        confirmButtonText:
          resource === "units" ? "Nonaktifkan unit" : "Hapus data",
      }))
    )
      return;
    try {
      await deleteMasterRow(resource, row.id, csrfToken);
      await invalidate();
      await showSuccess(
        resource === "units"
          ? "Unit berhasil dinonaktifkan"
          : "Data master berhasil dihapus",
      );
    } catch (error) {
      await showError(
        "Penghapusan gagal",
        error instanceof Error ? error.message : "Penghapusan gagal.",
      );
    }
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }
  return (
    <>
      <SectionHeading
        eyebrow="DATA MASTER"
        title="Kelola populasi dan referensi pekerjaan"
      />
      <div
        role="tablist"
        aria-label="Jenis data master"
        className="tabs tabs-boxed mb-5 grid w-full max-w-2xl grid-cols-3 gap-1 p-1"
      >
        {(
          [
            ["units", "Populasi unit"],
            ["job-codes", "Code Job"],
            ["components", "Component"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={resource === value}
            className={`tab min-w-0 whitespace-nowrap px-2 text-xs font-medium sm:text-sm ${resource === value ? "tab-active bg-primary text-primary-content shadow-sm" : ""}`}
            onClick={() => {
              setResource(value);
              setClientPagination({ pageIndex: 0, pageSize: 10 });
              clearForm();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {resource === "units" ? (
          <form
            className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              setUnitPage(0);
              setUnitSearch(unitSearchInput.trim());
            }}
          >
            <div className="join flex w-full sm:w-auto">
              <select
                className="select select-bordered join-item max-w-32"
                value={unitSearchBy}
                onChange={(event) =>
                  setUnitSearchBy(event.target.value as typeof unitSearchBy)
                }
                aria-label="Cari unit berdasarkan"
              >
                <option value="unitCode">Kode unit</option>
                <option value="model">Model</option>
                <option value="brand">Brand</option>
              </select>
              <input
                className="input input-bordered join-item min-w-0 flex-1 sm:w-52 sm:flex-none"
                type="search"
                value={unitSearchInput}
                onChange={(event) => setUnitSearchInput(event.target.value)}
                placeholder={`Cari ${unitSearchBy === "unitCode" ? "kode unit" : unitSearchBy}`}
              />
              <button
                className="btn btn-primary join-item"
                type="submit"
                aria-label="Cari unit"
              >
                <LuSearch className="size-4" />
              </button>
            </div>
            <button
              className="btn btn-outline w-full sm:w-auto"
              type="button"
              onClick={() => {
                setUnitSearchBy("unitCode");
                setUnitSearchInput("");
                setUnitSearch("");
                setUnitPage(0);
              }}
            >
              Reset filter
            </button>
          </form>
        ) : (
          <div />
        )}
        <button
          className="btn btn-primary w-full sm:w-auto xl:ml-auto"
          type="button"
          onClick={() => {
            clearForm();
            setIsModalOpen(true);
          }}
        >
          <LuPlus className="size-4" />
          Tambah{" "}
          {resource === "units"
            ? "unit"
            : resource === "job-codes"
              ? "Code Job"
              : "component"}
        </button>
      </div>

      {resource === "units" ? (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-base-content/70">
              Hasil: {query.data?.total ?? 0}
            </span>
            <label className="flex items-center gap-2 text-sm">
              Baris
              <select
                className="select select-bordered select-sm"
                value={unitLimit}
                onChange={(event) => {
                  setUnitLimit(Number(event.target.value));
                  setUnitPage(0);
                }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <MasterDataTable
            data={query.data?.items ?? []}
            columns={columns}
            loading={query.isFetching}
            error={query.error?.message}
            pagination={{ pageIndex: 0, pageSize: unitLimit }}
            emptyMessage="Belum ada populasi unit."
          />
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              className="btn btn-sm"
              disabled={unitPage === 0 || query.isFetching}
              onClick={() => setUnitPage((current) => Math.max(0, current - 1))}
            >
              Sebelumnya
            </button>
            <span className="px-2 text-sm">
              Halaman {query.data?.total ? unitPage + 1 : 0} /{" "}
              {Math.max(1, Math.ceil((query.data?.total ?? 0) / unitLimit))}
            </span>
            <button
              className="btn btn-sm"
              disabled={
                (unitPage + 1) * unitLimit >= (query.data?.total ?? 0) ||
                query.isFetching
              }
              onClick={() => setUnitPage((current) => current + 1)}
            >
              Berikutnya
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm text-base-content/70">
              Hasil: {query.data?.items.length ?? 0}
            </span>
            <label className="flex items-center gap-2 text-sm">
              Baris
              <select
                className="select select-bordered select-sm"
                value={clientPagination.pageSize}
                onChange={(event) =>
                  setClientPagination({
                    pageIndex: 0,
                    pageSize: Number(event.target.value),
                  })
                }
              >
                {[10, 25].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <MasterDataTable
            data={query.data?.items ?? []}
            columns={columns}
            loading={query.isFetching}
            error={query.error?.message}
            pagination={clientPagination}
            onPaginationChange={setClientPagination}
            emptyMessage="Belum ada data master."
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              className="btn btn-sm"
              disabled={clientPagination.pageIndex === 0 || query.isFetching}
              onClick={() =>
                setClientPagination((current) => ({
                  ...current,
                  pageIndex: Math.max(0, current.pageIndex - 1),
                }))
              }
            >
              Sebelumnya
            </button>
            <span className="px-2 text-sm">
              Halaman{" "}
              {query.data?.items.length ? clientPagination.pageIndex + 1 : 0} /{" "}
              {Math.max(
                1,
                Math.ceil(
                  (query.data?.items.length ?? 0) / clientPagination.pageSize,
                ),
              )}
            </span>
            <button
              className="btn btn-sm"
              disabled={
                (clientPagination.pageIndex + 1) * clientPagination.pageSize >=
                  (query.data?.items.length ?? 0) || query.isFetching
              }
              onClick={() =>
                setClientPagination((current) => ({
                  ...current,
                  pageIndex: current.pageIndex + 1,
                }))
              }
            >
              Berikutnya
            </button>
          </div>
        </>
      )}

      <Modal
        open={isModalOpen}
        title={
          editing
            ? `Edit ${resource === "units" ? "unit populasi" : resource === "job-codes" ? "Code Job" : "component"}`
            : `Tambah ${resource === "units" ? "unit populasi" : resource === "job-codes" ? "Code Job" : "component"}`
        }
        onClose={clearForm}
      >
        <form className="space-y-1 p-5" onSubmit={submit}>
          {resource === "units" ? (
            <>
              <div className="mb-5 flex h-48 w-full items-center justify-center overflow-hidden rounded-box border border-base-300 bg-base-200 sm:h-56">
                {unitImagePreview || unitImageUrl ? (
                  <img
                    src={unitImagePreview || unitImageUrl}
                    alt={unitCode ? `Gambar unit ${unitCode}` : "Gambar unit"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-base-content/50">
                    <LuImage className="size-12" aria-hidden="true" />
                    <span className="text-sm font-medium">No image</span>
                  </div>
                )}
              </div>
              <label className="fieldset mb-3">
                <span className="label">Kode unit</span>
                <input
                  className="input input-bordered w-full"
                  required
                  maxLength={10}
                  value={unitCode}
                  onChange={(event) =>
                    setUnitCode(event.target.value.toUpperCase())
                  }
                />
              </label>
              <label className="fieldset mb-3">
                <span className="label">Model</span>
                <input
                  className="input input-bordered w-full"
                  required
                  maxLength={25}
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </label>
              <label className="fieldset mb-3">
                <span className="label">Brand</span>
                <input
                  className="input input-bordered w-full"
                  required
                  maxLength={30}
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                />
              </label>
              <label className="fieldset mb-3">
                <span className="label">Gambar unit (opsional)</span>
                <input
                  className="file-input file-input-bordered w-full"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      void showError(
                        "Gambar terlalu besar",
                        "Ukuran gambar maksimal 5 MB.",
                      );
                      event.target.value = "";
                      setUnitImage(null);
                      return;
                    }
                    setUnitImage(file);
                  }}
                />
                <span className="mt-1 text-xs text-base-content/60">
                  JPG, PNG, atau WebP. Gambar otomatis dikonversi ke WebP.
                </span>
              </label>
            </>
          ) : (
            <>
              <label className="fieldset mb-3">
                <span className="label">Deskripsi</span>
                <input
                  className="input input-bordered w-full"
                  required
                  maxLength={50}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
              {resource === "job-codes" && (
                <label className="fieldset mb-3">
                  <span className="label">Kelompok Code Job</span>
                  <select
                    className="select select-bordered w-full"
                    value={groupCode}
                    onChange={(event) =>
                      setGroupCode(Number(event.target.value))
                    }
                  >
                    <option value={1}>Technical Job</option>
                    <option value={2}>Non Technical Job</option>
                  </select>
                </label>
              )}
            </>
          )}
          {save.error && (
            <p className="mb-3 text-sm text-error">{save.error.message}</p>
          )}
          <div className="modal-action">
            <button className="btn btn-ghost" type="button" onClick={clearForm}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={save.isPending}
            >
              <LuPlus className="size-4" />
              {save.isPending
                ? "Menyimpan…"
                : editing
                  ? "Simpan perubahan"
                  : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function MasterDataTable({
  data,
  columns,
  loading,
  error,
  pagination,
  onPaginationChange,
  emptyMessage,
}: {
  data: MasterRow[];
  columns: ColumnDef<typeof clientMasterTableFeatures, MasterRow>[];
  loading: boolean;
  error?: string;
  pagination: PaginationState;
  onPaginationChange?: (
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) => void;
  emptyMessage: string;
}) {
  const table = useTable({
    features: clientMasterTableFeatures,
    data,
    columns,
    state: { pagination },
    onPaginationChange,
  });

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table
        className="table table-zebra whitespace-nowrap"
        aria-busy={loading}
      >
        <thead>
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
          {loading
            ? Array.from({ length: 5 }, (_, rowIndex) => (
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
      {error && <p className="p-4 text-sm text-error">{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="empty-state m-4">{emptyMessage}</p>
      )}
    </div>
  );
}
