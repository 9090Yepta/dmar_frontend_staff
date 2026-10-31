import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { LuCamera, LuKeyRound, LuUserRound } from "react-icons/lu";
import type { StaffUser } from "../../types/staff";
import { apiAssetUrl } from "../../services/apiClient";
import { showError, showSuccess } from "../../utils/notifications";

export function ForemanAccount({
  user,
  passwordBusy,
  profileImageBusy,
  onChangePassword,
  onUploadProfileImage,
}: {
  user: StaffUser;
  passwordBusy: boolean;
  profileImageBusy: boolean;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  onUploadProfileImage: (
    file: File,
  ) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const profileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!profileFile) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(profileFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileFile]);

  async function saveProfileImage() {
    if (!profileFile) return;
    const result = await onUploadProfileImage(profileFile);
    if (!result.ok) {
      await showError(
        "Foto profil gagal disimpan",
        result.message || "Periksa file foto dan coba lagi.",
      );
      return;
    }
    setProfileFile(null);
    await showSuccess("Foto profil berhasil diganti");
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    if (newPassword !== confirmPassword) {
      setValidationError("Konfirmasi password baru belum sama.");
      return;
    }
    if (currentPassword === newPassword) {
      setValidationError("Password baru harus berbeda dari password saat ini.");
      return;
    }
    if (await onChangePassword(currentPassword, newPassword)) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <section className="grid gap-4" aria-labelledby="foreman-account-title">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          ACCOUNT
        </p>
        <h2 id="foreman-account-title" className="mt-1 text-xl font-bold">
          Settings
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-base-content/60">
          Kelola foto profil, informasi akun, dan keamanan password.
        </p>
      </header>
      <article className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4 border-b border-base-300 pb-4">
            <div className="avatar">
              <div className="size-20 overflow-hidden rounded-full bg-primary/10 text-primary ring ring-base-300 ring-offset-2 ring-offset-base-100">
                {previewUrl || user.profileImageUrl ? (
                  <img
                    src={previewUrl || apiAssetUrl(user.profileImageUrl)}
                    alt={`Foto ${user.name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-2xl font-bold">
                    {initials}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">{user.name}</h3>
              <p className="text-xs text-base-content/60">
                Foto profil dan informasi akun Anda.
              </p>
            </div>
            <LuUserRound className="hidden size-5 text-primary sm:block" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="form-control w-full flex-1">
              <input
                ref={profileInputRef}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Pilih foto profil"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (file && file.size > 5 * 1024 * 1024) {
                    void showError(
                      "Foto terlalu besar",
                      "Ukuran foto maksimal 5 MB.",
                    );
                    setProfileFile(null);
                    return;
                  }
                  setProfileFile(file);
                }}
              />
              <button
                className="btn btn-outline btn-sm w-full sm:w-fit"
                type="button"
                onClick={() => profileInputRef.current?.click()}
              >
                <LuCamera className="size-4" />
                Ganti Foto Profile
              </button>
              <span className="mt-1 text-xs text-base-content/60">
                {profileFile?.name ?? "Maksimal 5 MB"}
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              disabled={!profileFile || profileImageBusy}
              onClick={() => void saveProfileImage()}
            >
              {profileImageBusy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <LuCamera className="size-4" />
              )}
              {profileImageBusy ? "Menyimpan…" : "Simpan foto"}
            </button>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Nama", user.name],
              ["NRPP", user.nrpp],
              ["Jabatan", user.position || "Foreman"],
              ["Job site", user.jobSiteName || "Belum ditentukan"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-box bg-base-200 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/55">
                  {label}
                </dt>
                <dd className="mt-1 wrap-break-word text-sm font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </article>
      <article className="card border border-base-300 bg-base-100 shadow-sm">
        <form
          className="card-body gap-4 p-4 sm:p-6"
          onSubmit={(event) => void submit(event)}
        >
          <div className="flex items-center gap-3 border-b border-base-300 pb-4">
            <span className="grid size-10 place-items-center rounded-lg bg-secondary/10 text-secondary">
              <LuKeyRound className="size-5" />
            </span>
            <div>
              <h3 className="font-bold">Ubah password</h3>
              <p className="text-xs text-base-content/60">
                Masukkan password lama untuk memverifikasi identitas Anda.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1 text-sm font-medium">
                Password saat ini
              </span>
              <input
                className="input input-bordered w-full"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1 text-sm font-medium">
                Password baru
              </span>
              <input
                className="input input-bordered w-full"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              <span className="mt-1 text-xs text-base-content/55">
                Minimal 8 karakter.
              </span>
            </label>
            <label className="form-control">
              <span className="label-text mb-1 text-sm font-medium">
                Konfirmasi password baru
              </span>
              <input
                className="input input-bordered w-full"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          </div>
          {validationError && (
            <p className="alert alert-error py-2 text-sm" role="alert">
              {validationError}
            </p>
          )}
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={passwordBusy}
            >
              {passwordBusy ? (
                <>
                  <span className="loading loading-spinner loading-xs" />{" "}
                  Menyimpan…
                </>
              ) : (
                "Simpan password baru"
              )}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
