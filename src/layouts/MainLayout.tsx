import type { ReactNode } from "react";
import { LuActivity } from "react-icons/lu";

type ApiState = "loading" | "online" | "offline";

type MainLayoutProps = {
  api: ApiState;
  pendingCount: number;
  children: ReactNode;
  navigation?: ReactNode;
  footer?: ReactNode;
};

export function MainLayout({
  api,
  pendingCount,
  children,
  navigation,
  footer = "DMAR · Persetujuan dibatasi pada laporan yang ditugaskan kepada foreman.",
}: MainLayoutProps) {
  const apiLabel =
    api === "loading"
      ? "menghubungkan"
      : api === "online"
        ? "tersambung"
        : "belum aktif";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">D</div>
        <div>
          <p className="eyebrow">DMAR · WORKSPACE</p>
          <h1>Staff</h1>
        </div>
        <span className={`api-badge api-${api}`}>
          <span className="api-dot" /> API {apiLabel}
        </span>
      </header>
      <section className="welcome-card">
        <div className="welcome-copy">
          <p className="eyebrow">RUANG KERJA FOREMAN & ADMIN</p>
          <h2>Kelola laporan dengan alur yang jelas.</h2>
          <p>
            Periksa pekerjaan yang masuk dan setujui laporan yang sudah sesuai.
          </p>
        </div>
        <div className="stat-panel">
          <span className="stat-label">MENUNGGU PERSETUJUAN</span>
          <strong>{pendingCount}</strong>
          <span className="stat-sub">Laporan di antrean Anda</span>
        </div>
      </section>
      {navigation}
      {children}
      <footer className="mt-6 flex items-center justify-center gap-2 border-t border-base-300/70 py-3 text-[11px] text-base-content/50">
        <LuActivity className="size-3.5 text-primary/70" aria-hidden="true" />
        <span>DMAR <span className="px-1 opacity-50">·</span> {footer}</span>
      </footer>
    </main>
  );
}
