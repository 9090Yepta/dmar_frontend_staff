import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LuBuilding2,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardCheck,
  LuHouse,
  LuLogOut,
  LuMapPin,
  LuMenu,
  LuActivity,
  LuX,
} from "react-icons/lu";
import { MdSupervisorAccount } from "react-icons/md";
import { FaUsersGear, FaRegFileZipper } from "react-icons/fa6";
import { GrUserAdmin } from "react-icons/gr";
import { TbReport, TbDatabaseCog } from "react-icons/tb";
import { apiAssetUrl } from "../services/apiClient";
import type { StaffView, StaffUser } from "../types/staff";

type ApiState = "loading" | "online" | "offline";

type Props = {
  role: "admin" | "superadmin";
  api: ApiState;
  pendingCount: number;
  view: StaffView;
  user: StaffUser;
  children: (data: {
    role: "admin" | "superadmin";
    pendingCount: number;
  }) => ReactNode;
  onSignOut: () => void;
};

const items: {
  view: StaffView;
  label: string;
  to:
    | "/"
    | "/admin/reports-pending"
    | "/admin/reports-approved"
    | "/admin/reports-legacy"
    | "/admin/users"
    | "/admin/mechanics"
    | "/admin/foremen"
    | "/admin/admin-users"
    | "/admin/sites"
    | "/admin/masters";
  icon: typeof LuHouse;
}[] = [
  { view: "dashboard", label: "Dashboard", to: "/", icon: LuHouse },
  {
    view: "pending",
    label: "Pending reports",
    to: "/admin/reports-pending",
    icon: TbReport,
  },
  {
    view: "approved",
    label: "DMAR approved",
    to: "/admin/reports-approved",
    icon: LuClipboardCheck,
  },
  {
    view: "legacy",
    label: "Old Archives",
    to: "/admin/reports-legacy",
    icon: FaRegFileZipper,
  },
  {
    view: "mechanics",
    label: "Mechanics",
    to: "/admin/mechanics",
    icon: FaUsersGear,
  },
  {
    view: "foremen",
    label: "Foreman",
    to: "/admin/foremen",
    icon: MdSupervisorAccount,
  },
  {
    view: "admins",
    label: "User admin",
    to: "/admin/admin-users",
    icon: GrUserAdmin,
  },
  { view: "sites", label: "Job site", to: "/admin/sites", icon: LuMapPin },
  {
    view: "masters",
    label: "Data master",
    to: "/admin/masters",
    icon: TbDatabaseCog,
  },
];

const titles: Record<StaffView, string> = {
  dashboard: "Dashboard",
  pending: "Laporan pending",
  approved: "DMAR approved",
  legacy: "Arsip laporan lama",
  users: "Manajemen pengguna",
  mechanics: "Pengguna mekanik",
  foremen: "Pengguna foreman",
  admins: "Pengguna admin",
  sites: "Pengelolaan job site",
  masters: "Data master",
  "foreman-history": "Riwayat foreman",
  "foreman-account": "Account foreman",
};

export function AdminWorkspaceLayout({
  role,
  api,
  pendingCount,
  view,
  user,
  children,
  onSignOut,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const apiLabel =
    api === "loading"
      ? "Menghubungkan API"
      : api === "online"
        ? "API tersambung"
        : "API belum aktif";
  const visibleItems =
    role === "superadmin"
      ? items
      : items.filter(({ view: itemView }) =>
          ["pending", "approved", "legacy", "mechanics", "foremen"].includes(
            itemView,
          ),
        );
  const roleLabel = role === "superadmin" ? "Superadmin" : "Admin";
  const scopeLabel =
    role === "superadmin"
      ? "Lintas job site"
      : (user.jobSiteName ?? "Job site akun");

  return (
    <div
      className={`drawer min-h-screen bg-base-200 ${mobileOpen ? "drawer-open" : ""} lg:drawer-open`}
    >
      <input
        id="superadmin-mobile-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={mobileOpen}
        onChange={(event) => setMobileOpen(event.target.checked)}
        aria-label={`Buka menu ${roleLabel.toLowerCase()}`}
      />

      <div className="drawer-content flex min-h-screen min-w-0 flex-col">
        <header className="navbar sticky top-0 z-20 min-h-16 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur lg:px-8">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="superadmin-mobile-drawer"
              className="btn btn-square btn-ghost"
              aria-label="Buka navigasi"
            >
              {mobileOpen ? (
                <LuX className="size-5" />
              ) : (
                <LuMenu className="size-5" />
              )}
            </label>
          </div>
          <div className="min-w-0 flex-1 px-2">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-base-content/55">
              {roleLabel} · {scopeLabel}
            </p>
            <h1 className="truncate text-lg font-bold text-base-content">
              {titles[view]}
            </h1>
          </div>
          <div className="flex-none">
            <span
              className={`badge ${api === "online" ? "badge-success" : api === "offline" ? "badge-error" : "badge-ghost"} badge-outline gap-1.5`}
            >
              <span
                className={`size-2 rounded-full ${api === "online" ? "bg-success" : api === "offline" ? "bg-error" : "bg-base-content/30"}`}
              />
              <span className="hidden sm:inline">{apiLabel}</span>
              <span className="sm:hidden" aria-label={apiLabel}>
                API
              </span>
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4">
          {children({ role, pendingCount })}
        </main>
        <footer className="flex items-center justify-center gap-2 border-t border-base-300/70 px-5 py-3 text-[11px] text-base-content/50 lg:justify-start lg:px-8">
          <LuActivity
            className="size-3.5 shrink-0 text-primary/70"
            aria-hidden="true"
          />
          <span className="truncate">
            DMAR <span className="px-1 opacity-50">·</span>
            {role === "superadmin"
              ? "Superadmin lintas job site"
              : `Admin · ${scopeLabel}`}
          </span>
        </footer>
      </div>

      <div className="drawer-side z-30">
        <label
          htmlFor="superadmin-mobile-drawer"
          aria-label="Tutup menu"
          className="drawer-overlay"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`flex min-h-full w-72 flex-col border-r border-base-300/70 bg-base-100 p-3 shadow-sm transition-[width] duration-200 sm:p-4 lg:min-h-screen ${collapsed ? "lg:w-20" : "lg:w-72"}`}
        >
          <div
            className={`mb-7 flex items-center rounded-2xl ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-3 overflow-hidden ${collapsed ? "lg:hidden" : ""}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-primary to-primary/75 text-primary-content shadow-lg shadow-primary/20">
                <LuBuilding2 className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                  DMAR
                </span>
                <span className="block truncate text-sm font-bold">
                  {roleLabel}
                </span>
                <span className="block truncate text-[10px] text-base-content/45">
                  {role === "superadmin" ? "Global workspace" : scopeLabel}
                </span>
              </span>
            </div>
            <span
              className={`hidden size-11 place-items-center rounded-2xl bg-linear-to-br from-primary to-primary/75 text-primary-content shadow-lg shadow-primary/20 ${collapsed ? "lg:grid" : ""}`}
              title={`DMAR ${roleLabel}`}
            >
              <LuBuilding2 className="size-6" />
            </span>
            <button
              type="button"
              className="btn btn-square btn-ghost btn-sm hidden rounded-xl text-base-content/55 hover:bg-base-200 hover:text-base-content lg:inline-flex"
              aria-label={collapsed ? "Perbesar navigasi" : "Perkecil navigasi"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? (
                <LuChevronRight className="size-5" />
              ) : (
                <LuChevronLeft className="size-5" />
              )}
            </button>
          </div>

          <div
            className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-base-content/40 ${collapsed ? "lg:sr-only" : ""}`}
          >
            Navigasi utama
          </div>
          <ul className="menu flex-1 gap-1.5 p-0">
            {visibleItems.map(({ view: itemView, label, to, icon: Icon }) => {
              const active = view === itemView;
              return (
                <li key={itemView}>
                  <Link
                    to={to}
                    title={collapsed ? label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`group min-h-11 rounded-xl px-3 transition-all duration-150 ${collapsed ? "lg:justify-center lg:px-0" : ""} ${active ? "bg-primary font-semibold text-primary-content shadow-md shadow-primary/20 hover:bg-primary/90" : "text-base-content/65 hover:bg-base-200/80 hover:text-base-content"}`}
                  >
                    <Icon
                      className={`size-4.5 shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-105"}`}
                    />
                    <span className={collapsed ? "lg:sr-only" : ""}>
                      {label}
                    </span>
                    {itemView === "pending" && pendingCount > 0 && (
                      <span
                        className={`badge badge-sm min-w-6 border-0 font-bold ${active ? "bg-primary-content text-primary" : "bg-amber-100 text-amber-800"} ${collapsed ? "lg:hidden" : "ml-auto"}`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            className={`my-4 border-t border-base-300 ${collapsed ? "lg:mx-1" : ""}`}
          />
          <div
            className={`mb-2 flex min-w-0 items-center gap-3 rounded-2xl border border-base-300/70 bg-base-200/45 p-3 shadow-sm ${collapsed ? "lg:justify-center lg:px-1.5" : ""}`}
          >
            <span className="avatar shrink-0">
              <span className="size-10 overflow-hidden rounded-full bg-linear-to-br from-primary/20 to-secondary/20 text-primary ring-2 ring-base-100">
                {user.profileImageUrl ? (
                  <img
                    src={apiAssetUrl(user.profileImageUrl)}
                    alt={`Foto ${user.name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-sm font-bold">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-base-content/55">
                {user.nrpp}{" "}
                <span className="px-0.5 text-base-content/30">·</span>{" "}
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm justify-start border border-error/15 bg-error/5 text-error shadow-none hover:border-error/25 hover:bg-error/10 ${collapsed ? "lg:btn-square lg:mx-auto lg:justify-center lg:px-0" : "w-full"}`}
            onClick={onSignOut}
            title={collapsed ? "Keluar" : undefined}
          >
            <LuLogOut className="size-4 shrink-0" />
            <span className={collapsed ? "lg:sr-only" : ""}>Keluar</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
