import { useState, type SubmitEvent } from 'react';
import { LuBuilding2, LuEye, LuEyeOff, LuLockKeyhole, LuUserRound } from 'react-icons/lu';
import { Card } from '../../components/ui/Card';
import type { StaffUser } from '../../types/staff';

type AccessCardProps = {
  user: StaffUser | null;
  nrpp: string;
  password: string;
  rememberMe: boolean;
  busy: boolean;
  onNrppChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onSignIn: (event: SubmitEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
};

export function AccessCard({ user, nrpp, password, rememberMe, busy, onNrppChange, onPasswordChange, onRememberMeChange, onSignIn, onSignOut }: AccessCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  if (user) {
    return (
      <Card aria-label="Akses staff">
        <div className="signed-in">
          <div>
            <p className="eyebrow">SESI AKTIF · {user.role.toUpperCase()}</p>
            <h2>Halo, {user.name}</h2>
            <p>{user.nrpp} · {user.position || user.role}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onSignOut}>Keluar</button>
        </div>
      </Card>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/40 text-[#17212b] shadow-[0_26px_90px_rgba(0,0,0,0.3)] backdrop-blur-2xl [box-shadow:0_26px_90px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.68)] [-webkit-backdrop-filter:blur(20px)_saturate(145%)] [backdrop-filter:blur(20px)_saturate(145%)]" aria-label="Akses staff">
      <form className="grid gap-4.5 p-[clamp(26px,4vw,38px)] max-[650px]:gap-4 max-[650px]:px-5.75 max-[650px]:py-6.75 max-[380px]:px-4.75 max-[380px]:py-6" onSubmit={onSignIn}>
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[14px] border border-white/50 bg-amber-300 text-gray-800 shadow-lg shadow-black/10">
              <LuBuilding2 className="size-5.5" aria-hidden="true" />
            </span>
            <span className="grid gap-0.5">
              <small className="text-[9px] font-bold tracking-[.19em] text-[#68746f]">WORKSPACE</small>
              <strong className="text-sm font-bold text-[#385677]">PORTAL DMAR-Staff</strong>
            </span>
          </div>
          <p className="mb-1 text-[10px] font-bold tracking-[.16em] text-[#748196]">MASUK KE WORKSPACE</p>
          <h2 className="m-0 font-inter text-xl font-bold">Login Staff</h2>
          <p className="mb-0 mt-1.5 text-[13px] text-[#78847b]">Masuk untuk mengelola laporan dan persetujuan.</p>
        </div>

        <label className="grid gap-1.75 text-[11px] font-bold text-[#48584c]" htmlFor="staff-nrpp">
          NRPP
          <span className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/80 bg-white/35 px-3.25 shadow-inner transition focus-within:border-[#719b6c] focus-within:bg-white/85 focus-within:shadow-[0_0_0_4px_rgba(106,151,101,0.13)]">
            <LuUserRound className="size-4.5 shrink-0 text-[#829185]" aria-hidden="true" />
            <input id="staff-nrpp" className="h-11 w-full min-w-0 bg-transparent text-[13px] font-medium text-[#1c2d21] outline-none placeholder:text-[#a0aaa1]" autoComplete="username" value={nrpp} onChange={(event) => onNrppChange(event.target.value)} placeholder="Masukkan NRPP" required />
          </span>
        </label>

        <div className="grid gap-1.75 text-[11px] font-bold text-[#48584c]">
          <label htmlFor="staff-password">Password</label>
          <span className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/80 bg-white/35 px-3.25 shadow-inner transition focus-within:border-[#719b6c] focus-within:bg-white/85 focus-within:shadow-[0_0_0_4px_rgba(106,151,101,0.13)]">
            <LuLockKeyhole className="size-4.5 shrink-0 text-[#829185]" aria-hidden="true" />
            <input id="staff-password" className="h-11 w-full min-w-0 bg-transparent text-[13px] font-medium text-[#1c2d21] outline-none placeholder:text-[#a0aaa1]" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Masukkan password" required />
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[#68746f] transition hover:bg-white/50 hover:text-[#385677] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719b6c]"
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <LuEyeOff className="size-4.5" aria-hidden="true" /> : <LuEye className="size-4.5" aria-hidden="true" />}
            </button>
          </span>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-[11px] font-semibold text-[#637166]">
          <input className="size-4 cursor-pointer accent-[#2e6039] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d8252]" type="checkbox" checked={rememberMe} onChange={(event) => onRememberMeChange(event.target.checked)} />
          Ingat saya selama 30 hari
        </label>

        <button className="mt-px flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-linear-to-br from-[#e4b944] to-[#ffda70] px-4.5 text-[13px] font-bold text-gray-700 shadow-[0_8px_18px_rgba(37,62,84,0.18)] transition hover:-translate-y-px hover:shadow-[0_11px_23px_rgba(37,62,84,0.25)] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={busy}>
          {busy ? 'Memeriksa akses…' : 'Masuk ke workspace'}
          {!busy && <span className="text-lg leading-none" aria-hidden="true">→</span>}
        </button>
      </form>
    </section>
  );
}
