import type { ReactNode } from "react";
import { LuActivity, LuLogOut } from "react-icons/lu";
import { TiInfoLarge } from "react-icons/ti";
import type { StaffUser } from "../../types/staff";
import { apiAssetUrl } from "../../services/apiClient";
import { ForemanNavigation } from "./ForemanNavigation";

export function ForemanWorkspaceLayout({
  user,
  pendingCount,
  onSignOut,
  children,
}: {
  user: StaffUser;
  pendingCount: number;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto box-border min-h-svh w-full min-w-0 max-w-6xl px-3 pb-24 pt-3 sm:px-6 sm:pt-6 md:pb-8">
      <section
        className="mb-5 flex min-w-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm sm:gap-4 sm:p-5"
        aria-label="Informasi akun aktif"
      >
        <div className="avatar shrink-0">
          <div className="size-12 overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-base-300 sm:size-14">
            {user.profileImageUrl ? (
              <img
                src={apiAssetUrl(user.profileImageUrl)}
                alt={`Foto ${user.name}`}
                className="size-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center font-bold">
                {initials}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold sm:text-xl">
            Halo, {user.name}
          </h1>
          <p className="mt-1 truncate text-xs text-base-content/60 sm:text-sm">
            {user.nrpp} · {user.position || "Foreman"}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-xs shrink-0 px-2 sm:btn-sm sm:px-3"
          type="button"
          onClick={onSignOut}
        >
          <LuLogOut className="size-4" /> Sign Out
        </button>
      </section>
      <ForemanNavigation />
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-box border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <div className="flex items-center gap-1">
            <TiInfoLarge className="size-6 text-warning" aria-hidden="true" />
            <span className="font-medium">Report awaiting approval</span>
          </div>

          <span className="badge badge-warning">{pendingCount}</span>
        </div>
      )}
      {children}
      <footer className="mt-6 flex items-center justify-center gap-2 border-t border-base-300/70 py-3 text-[11px] text-base-content/50">
        <LuActivity className="size-3.5 text-primary/70" aria-hidden="true" />
        <span>
          DMAR <span className="px-1 opacity-50">·</span> Portal staff
        </span>
      </footer>
    </main>
  );
}
