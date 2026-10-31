import { useMemo, useState, type SubmitEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { LuPencil, LuPlus } from "react-icons/lu";
import { getJobSites, saveJobSite } from "../../services/adminService";
import { DataTable, dataTableFeatures } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SectionHeading } from "../../components/ui/SectionHeading";
import type { JobSite } from "../../types/admin";
import { showSuccess } from "../../utils/notifications";

export function JobSitesAdmin({ csrfToken }: { csrfToken: string }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-job-sites"],
    queryFn: getJobSites,
  });
  const [editing, setEditing] = useState<JobSite | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const save = useMutation({
    mutationFn: () =>
      saveJobSite(
        editing?.id ?? null,
        { code, name, isActive: active },
        csrfToken,
      ),
    onSuccess: async () => {
      showSuccess(
        editing
          ? "Job site berhasil diperbarui"
          : "Job site berhasil ditambahkan",
      );
      clearForm();
      await client.invalidateQueries({ queryKey: ["admin-job-sites"] });
      await client.invalidateQueries({ queryKey: ["admin-job-sites-options"] });
      await client.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, JobSite>[]>(
    () => [
      { accessorKey: "code", header: "Kode" },
      { accessorKey: "name", header: "Nama job site" },
      { accessorKey: "userCount", header: "Pengguna" },
      { accessorKey: "reportCount", header: "Laporan" },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ getValue }) =>
          Number(getValue()) === 1 ? (
            <span className="badge badge-success badge-outline">Aktif</span>
          ) : (
            <span className="badge badge-ghost">Nonaktif</span>
          ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-xs"
            aria-label={`Edit ${row.original.name}`}
            onClick={() => beginEdit(row.original)}
          >
            <LuPencil className="size-4" />
          </button>
        ),
      },
    ],
    [],
  );

  function clearForm() {
    setEditing(null);
    setCode("");
    setName("");
    setActive(true);
    setFormOpen(false);
  }
  function beginEdit(site: JobSite) {
    setEditing(site);
    setCode(site.code);
    setName(site.name);
    setActive(Number(site.isActive) === 1);
    setFormOpen(true);
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <>
      <SectionHeading
        eyebrow="SUPERADMIN · JOB SITE"
        title="Kelola lokasi kerja"
      />
      <p className="mb-4 max-w-3xl text-sm opacity-70">
        Job site aktif dapat ditetapkan ke mekanik, foreman, dan admin. Site
        yang sudah memiliki pengguna tidak dapat dinonaktifkan sebelum pengguna
        dipindahkan.
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          className="btn btn-primary ml-auto"
          type="button"
          onClick={() => {
            clearForm();
            setFormOpen(true);
          }}
        >
          <LuPlus className="size-4" />
          Tambah job site
        </button>
      </div>
      <DataTable
        data={query.data?.items ?? []}
        columns={columns}
        loading={query.isFetching}
        error={query.error?.message}
        emptyMessage="Belum ada job site."
      />
      <Modal
        open={formOpen}
        title={editing ? `Edit ${editing.name}` : "Tambah job site"}
        onClose={clearForm}
      >
        <form className="space-y-1 p-5" onSubmit={submit}>
          <label className="fieldset mb-3">
            <span className="label">Kode (contoh: SITE-A)</span>
            <input
              className="input input-bordered w-full uppercase"
              maxLength={30}
              pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,29}"
              required
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
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
          {editing && (
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
              <input
                className="toggle toggle-primary"
                type="checkbox"
                checked={active}
                disabled={!active && editing.userCount > 0}
                onChange={(event) => setActive(event.target.checked)}
              />
              Aktif
            </label>
          )}
          {save.error && (
            <p className="mb-3 text-sm text-error">{save.error.message}</p>
          )}
          <div className="modal-action mt-5">
            <button className="btn btn-ghost" type="button" onClick={clearForm}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={save.isPending}
            >
              {save.isPending ? (
                "Menyimpan…"
              ) : editing ? (
                "Simpan perubahan"
              ) : (
                <>
                  <LuPlus className="size-4" />
                  Tambah job site
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
