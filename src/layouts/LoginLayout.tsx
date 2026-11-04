import { useState, type ReactNode } from "react";

export function LoginLayout({ children }: { children: ReactNode }) {
  const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-[#17212b] bg-[url('/img/bg-login-staff.webp')] bg-cover bg-position-[center_48%] text-white max-md:bg-position-[20%_center]">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/10 via-black/15 to-black/60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/10"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-360 grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-x-14 gap-y-6 px-[clamp(1.5rem,5vw,4.75rem)] py-7.5 md:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] md:gap-y-7">
        <header className="col-span-full flex items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[14px] border border-white/30 bg-amber-400 text-gray-800 shadow-lg shadow-black/20">
              <span className="text-lg font-black" aria-hidden="true">
                D
              </span>
            </span>
            <span className="grid gap-0.5">
              <small className="text-[9px] font-bold tracking-[.19em] text-white/75">
                WORKSPACE
              </small>
              <strong className="text-base font-bold text-white">
                PORTAL DMAR-Staff
              </strong>
            </span>
          </div>
        </header>

        <section
          className="col-span-full w-full self-end md:col-start-2 md:row-start-2 md:self-center"
          aria-label="Login Staff"
        >
          <div
            id="mobile-login-form"
            className={isMobileLoginOpen ? "block" : "hidden md:block"}
          >
            {children}
          </div>
          <button
            className={`mx-auto mt-3 flex min-h-12 w-full max-w-80 items-center justify-center rounded-xl px-6 text-sm font-bold shadow-[0_8px_18px_rgba(0,0,0,0.25)] transition md:hidden ${isMobileLoginOpen ? "border border-white/60 bg-white/15 text-white backdrop-blur-md hover:bg-white/25" : "bg-linear-to-br from-[#f0c44f] to-[#ffdc70] text-gray-800 hover:-translate-y-px hover:shadow-[0_11px_23px_rgba(0,0,0,0.3)]"}`}
            type="button"
            aria-expanded={isMobileLoginOpen}
            aria-controls="mobile-login-form"
            onClick={() => setIsMobileLoginOpen((isOpen) => !isOpen)}
          >
            {isMobileLoginOpen ? "Tutup" : "Masuk"}
          </button>
          <p className="mt-3 text-center text-[10px] text-white/85 [text-shadow:0_1px_7px_rgba(0,0,0,0.4)]">
            Akses aman untuk pengguna terdaftar.
          </p>
        </section>

        <footer className="col-span-full flex flex-col gap-1 text-center text-[8px] font-semibold tracking-widest text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)] md:flex-row md:justify-between md:text-left md:text-[9px]">
          <span>DMAR · WORKSPACE STAFF</span>
          <span>Kelola laporan anggota Anda dan dukung keandalan unit.</span>
        </footer>
      </div>
    </main>
  );
}
