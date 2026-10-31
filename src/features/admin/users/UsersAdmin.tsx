import { useMemo, useRef, useState, type SubmitEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  LuCamera,
  LuImage,
  LuInfo,
  LuKeyRound,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
} from "react-icons/lu";
import {
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  saveAdminUser,
} from "../../../services/adminService";
import { DataTable, dataTableFeatures } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { AdminSectionHeading as SectionHeading } from "../components/AdminSectionHeading";
import type { AdminRole, Person } from "../../../types/admin";
import type { StaffUser } from "../../../types/staff";
import { formatAdminRole } from "../../../utils/adminDisplay";
import {
  confirmAction,
  showError,
  showSuccess,
} from "../../../utils/notifications";
import { apiAssetUrl } from "../../../services/apiClient";
export function UsersAdmin({
  csrfToken,
  user,
  role,
}: {
  csrfToken: string;
  user: StaffUser;
  role: AdminRole;
}) {
  const client = useQueryClient();
  const isSuperadmin = user.role === "superadmin";
  const [searchBy, setSearchBy] = useState<"name" | "nrpp" | "position">(
    "name",
  );
  const [appliedSearchBy, setAppliedSearchBy] = useState<
    "name" | "nrpp" | "position"
  >("name");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [filterSiteId, setFilterSiteId] = useState(0);
  const [editing, setEditing] = useState<Person | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [nrpp, setNrpp] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [jobSiteId, setJobSiteId] = useState(user.jobSiteId ?? 0);
  const [jobSiteIds, setJobSiteIds] = useState<number[]>([]);
  const query = useQuery({
    queryKey: [
      "admin-users",
      role,
      appliedSearchBy,
      search,
      filterSiteId,
      page,
      limit,
    ],
    queryFn: () =>
      getAdminUsers(role, search, filterSiteId || null, {
        searchBy: appliedSearchBy,
        limit,
        offset: page * limit,
      }),
  });
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ["admin-users"] });
  const save = useMutation({
    mutationFn: () =>
      saveAdminUser(
        role,
        editing?.id ?? null,
        {
          nrpp,
          name,
          position,
          ...(!editing ? { password } : {}),
          ...(role === "mechanic" && profileImage ? { profileImage } : {}),
          ...(isSuperadmin
            ? role === "foreman"
              ? { jobSiteIds }
              : { jobSiteId: role === "superadmin" ? null : jobSiteId || null }
            : {}),
        },
        csrfToken,
      ),
    onSuccess: async () => {
      showSuccess(
        editing
          ? "Data pengguna berhasil diperbarui"
          : "Data pengguna berhasil ditambahkan",
      );
      setEditing(null);
      setNrpp("");
      setName("");
      setPosition("");
      setPassword("");
      setProfileImage(null);
      setProfileImagePreview("");
      setJobSiteIds([]);
      setFormOpen(false);
      await invalidate();
    },
  });
  const columns = useMemo<ColumnDef<typeof dataTableFeatures, Person>[]>(() => {
    const result: ColumnDef<typeof dataTableFeatures, Person>[] = [
      {
        id: "rowNumber",
        header: "No.",
        cell: ({ row }) => page * limit + row.index + 1,
      },
      { accessorKey: "nrpp", header: "NRPP" },
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => {
          const person = row.original;
          const initials = person.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="size-14 rounded-full bg-primary/10 text-primary">
                  {person.profileImageUrl ? (
                    <img
                      src={apiAssetUrl(person.profileImageUrl)}
                      alt={`Foto ${person.name}`}
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-sm font-bold">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
              <span>{person.name}</span>
            </div>
          );
        },
      },
      { accessorKey: "position", header: "Jabatan" },
      {
        accessorKey: "jobSiteName",
        header: "Job site",
        cell: ({ getValue }) => getValue<string>() || "Lintas site",
      },
    ];
    if (isSuperadmin)
      result.push({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <button
              className="btn btn-ghost btn-xs"
              aria-label="Edit pengguna"
              onClick={() => {
                const item = row.original;
                setEditing(item);
                setNrpp(item.nrpp);
                setName(item.name);
                setPosition(item.position);
                setProfileImage(null);
                setProfileImagePreview(
                  item.profileImageUrl ? apiAssetUrl(item.profileImageUrl) : "",
                );
                setJobSiteId(item.jobSiteId ?? 0);
                setJobSiteIds(item.jobSiteIds ?? []);
                setFormOpen(true);
              }}
            >
              <LuPencil className="size-4" />
            </button>
            <button
              className="btn btn-ghost btn-xs"
              aria-label="Reset password"
              onClick={() => void reset(row.original)}
            >
              <LuKeyRound className="size-4" />
            </button>
            <button
              className="btn btn-ghost btn-xs text-error"
              aria-label="Nonaktifkan pengguna"
              onClick={() => void remove(row.original)}
            >
              <LuTrash2 className="size-4" />
            </button>
          </div>
        ),
      });
    return result;
  }, [role, csrfToken, isSuperadmin, page, limit]);
  async function reset(person: Person) {
    if (
      !(await confirmAction({
        title: "Reset password?",
        text: `Password ${person.name} akan diubah menjadi NRPP akun tersebut (${person.nrpp}).`,
        confirmButtonText: "Reset password",
      }))
    )
      return;
    try {
      await resetAdminUserPassword(role, person.id, csrfToken);
      await showSuccess("Password berhasil direset");
    } catch (error) {
      await showError(
        "Reset password gagal",
        error instanceof Error ? error.message : "Reset password gagal.",
      );
    }
  }
  async function remove(person: Person) {
    if (
      !(await confirmAction({
        title: "Nonaktifkan akun?",
        text: `Akun ${person.name} (${person.nrpp}) tidak dapat login lagi dan tidak tampil di daftar aktif. Riwayat laporan dan foto tetap disimpan.`,
        confirmButtonText: "Nonaktifkan akun",
      }))
    )
      return;
    try {
      await deleteAdminUser(role, person.id, csrfToken);
      await invalidate();
      await showSuccess("Akun berhasil dinonaktifkan");
    } catch (error) {
      await showError(
        "Penghapusan gagal",
        error instanceof Error ? error.message : "Penghapusan gagal.",
      );
    }
  }
  function clearForm() {
    setEditing(null);
    setNrpp("");
    setName("");
    setPosition("");
    setPassword("");
    setProfileImage(null);
    setProfileImagePreview("");
    if (profileImageInputRef.current) profileImageInputRef.current.value = "";
    setJobSiteIds([]);
    setJobSiteId(user.jobSiteId ?? query.data?.jobSites[0]?.id ?? 0);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }
  const sites = query.data?.jobSites ?? [];
  function resetFilters() {
    setSearchBy("name");
    setAppliedSearchBy("name");
    setSearchInput("");
    setSearch("");
    setFilterSiteId(0);
    setPage(0);
  }
  return (
    <>
      {!isSuperadmin && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-200/80 bg-linear-to-r from-sky-50 via-cyan-50/70 to-base-100 px-4 py-3 shadow-sm"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
            <LuInfo className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sky-950">Informasi akses</p>
            <p className="mt-0.5 text-sm leading-5 text-sky-900/80">
              Admin hanya dapat melihat akun mekanik dan foreman di job site{" "}
              <strong>{user.jobSiteName ?? "akun Anda"}</strong>. Pengelolaan akun hanya dapat
              dilakukan Team IT WBK.
            </p>
          </div>
        </div>
      )}
      <SectionHeading
        eyebrow="PENGGUNA"
        title={`Pengguna ${formatAdminRole(role)}`}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <form
            className="join flex w-full sm:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(0);
              setAppliedSearchBy(searchBy);
              setSearch(searchInput.trim());
            }}
          >
            <select
              className="select select-bordered join-item max-w-28"
              aria-label="Cari berdasarkan"
              value={searchBy}
              onChange={(event) =>
                setSearchBy(event.target.value as typeof searchBy)
              }
            >
              <option value="name">Nama</option>
              <option value="nrpp">NRPP</option>
              <option value="position">Jabatan</option>
            </select>
            <input
              className="input input-bordered join-item min-w-0 flex-1 sm:w-52 sm:flex-none"
              type="search"
              placeholder={`Cari ${searchBy === "name" ? "nama" : searchBy === "nrpp" ? "NRPP" : "jabatan"}`}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button
              className="btn btn-primary join-item"
              type="submit"
              aria-label="Cari"
            >
              <LuSearch className="size-4" />
            </button>
          </form>
          <button
            className="btn btn-outline w-full sm:w-auto"
            type="button"
            onClick={resetFilters}
          >
            Reset filter
          </button>
          {isSuperadmin && (
            <select
              className="select select-bordered w-full sm:w-auto"
              value={filterSiteId}
              onChange={(event) => setFilterSiteId(Number(event.target.value))}
            >
              <option value={0}>Semua job site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {isSuperadmin && (
          <button
            className="btn btn-primary w-full sm:ml-auto sm:w-auto"
            type="button"
            onClick={() => {
              clearForm();
              setFormOpen(true);
            }}
          >
            <LuPlus className="size-4" />
            Tambah {formatAdminRole(role)}
          </button>
        )}
      </div>
      <DataTable
        data={query.data?.items ?? []}
        columns={columns}
        loading={query.isFetching}
        error={query.error?.message}
        emptyMessage="Belum ada pengguna."
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-nowrap items-center gap-2">
          <span className="whitespace-nowrap text-sm">Baris</span>
          <select
            className="select select-bordered select-sm"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(0);
            }}
            aria-label="Jumlah baris per halaman"
          >
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="whitespace-nowrap text-sm">
            Total: {query.data?.total ?? 0}
          </span>
        </div>
        <div className="join">
          <button
            className="btn btn-sm join-item"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Sebelumnya
          </button>
          <span className="btn btn-sm join-item no-animation">
            Halaman {query.data?.total ? page + 1 : 0} /{" "}
            {Math.max(1, Math.ceil((query.data?.total ?? 0) / limit))}
          </span>
          <button
            className="btn btn-sm join-item"
            disabled={
              (page + 1) * limit >= (query.data?.total ?? 0) || query.isFetching
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Berikutnya
          </button>
        </div>
      </div>

      <Modal
        open={formOpen}
        title={
          editing ? `Edit ${editing.name}` : `Tambah ${formatAdminRole(role)}`
        }
        onClose={closeForm}
      >
        <form className="space-y-1 p-5" onSubmit={submit}>
          {isSuperadmin && role === "mechanic" && (
            <div className="mb-5 flex h-48 w-full items-center justify-center overflow-hidden rounded-box border border-base-300 bg-base-200 sm:h-56">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt={
                    name
                      ? `Foto profil ${name}`
                      : "Pratinjau foto profil mekanik"
                  }
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-base-content/50">
                  <LuImage className="size-12" aria-hidden="true" />
                  <span className="text-sm font-medium">No image</span>
                </div>
              )}
            </div>
          )}
          <label className="fieldset mb-3">
            <span className="label">NRPP</span>
            <input
              className="input input-bordered w-full"
              maxLength={100}
              required
              value={nrpp}
              onChange={(event) => setNrpp(event.target.value)}
            />
          </label>
          <label className="fieldset mb-3">
            <span className="label">Nama</span>
            <input
              className="input input-bordered w-full"
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="fieldset mb-3">
            <span className="label">Jabatan</span>
            <input
              className="input input-bordered w-full"
              maxLength={25}
              value={position}
              onChange={(event) => setPosition(event.target.value)}
            />
          </label>
          {isSuperadmin && role === "foreman" && (
            <fieldset className="fieldset mb-3">
              <legend className="label">Job site tugas foreman</legend>
              <p className="mb-2 text-xs text-base-content/60">
                Pilih satu atau beberapa site. Mekanik hanya dapat memilih
                foreman yang bertugas di site laporan.
              </p>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-box border border-base-300 p-3">
                {sites.map((site) => (
                  <label
                    key={site.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-base-200"
                  >
                    <input
                      className="checkbox checkbox-primary"
                      type="checkbox"
                      checked={jobSiteIds.includes(site.id)}
                      onChange={(event) =>
                        setJobSiteIds((current) =>
                          event.target.checked
                            ? [...new Set([...current, site.id])]
                            : current.filter((id) => id !== site.id),
                        )
                      }
                    />
                    <span>{site.name}</span>
                  </label>
                ))}
                {sites.length === 0 && (
                  <p className="text-sm text-base-content/60">
                    Belum ada job site aktif.
                  </p>
                )}
              </div>
            </fieldset>
          )}
          {isSuperadmin && role !== "superadmin" && role !== "foreman" && (
            <label className="fieldset mb-3">
              <span className="label">Job site</span>
              <select
                className="select select-bordered w-full"
                required
                value={jobSiteId}
                onChange={(event) => setJobSiteId(Number(event.target.value))}
              >
                <option value={0} disabled>
                  Pilih job site
                </option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isSuperadmin && role === "mechanic" && (
            <div className="fieldset mb-3">
              <span className="label">Foto profil (opsional)</span>
              <input
                ref={profileImageInputRef}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Pilih foto profil mekanik"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (file && file.size > 5 * 1024 * 1024) {
                    void showError(
                      "Foto terlalu besar",
                      "Ukuran foto maksimal 5 MB.",
                    );
                    return;
                  }
                  setProfileImage(file);
                  setProfileImagePreview(
                    file
                      ? URL.createObjectURL(file)
                      : editing?.profileImageUrl
                        ? apiAssetUrl(editing.profileImageUrl)
                        : "",
                  );
                }}
              />
              <button
                className="btn btn-outline btn-sm w-full sm:w-fit"
                type="button"
                onClick={() => profileImageInputRef.current?.click()}
              >
                <LuCamera className="size-4" />
                Ganti Foto Profile
              </button>
              <span className="mt-1 text-xs text-base-content/60">
                {profileImage?.name ??
                  "JPG, PNG, atau WebP. Maksimal 5 MB; dikonversi ke WebP."}
              </span>
            </div>
          )}
          {!isSuperadmin && (
            <p className="mb-3 text-sm opacity-70">
              Pengguna akan ditempatkan di job site{" "}
              {user.jobSiteName ?? "akun Anda"}.
            </p>
          )}
          {isSuperadmin && role === "superadmin" && (
            <p className="mb-3 text-sm opacity-70">
              Superadmin memiliki akses lintas job site.
            </p>
          )}
          {!editing && (
            <label className="fieldset mb-3">
              <span className="label">Password awal (minimal 8 karakter)</span>
              <input
                className="input input-bordered w-full"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          {save.error && (
            <p className="mb-3 text-sm text-error">{save.error.message}</p>
          )}
          <div className="modal-action mt-5">
            <button className="btn btn-ghost" type="button" onClick={closeForm}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                save.isPending ||
                (isSuperadmin &&
                  (role === "foreman"
                    ? jobSiteIds.length === 0
                    : role !== "superadmin" &&
                      (!jobSiteId || sites.length === 0)))
              }
            >
              {save.isPending
                ? "Menyimpan…"
                : editing
                  ? "Simpan perubahan"
                  : "Tambah pengguna"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
