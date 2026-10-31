import type { ReactNode } from "react";
import {
  LuCalendarDays,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuFileText,
  LuMapPin,
  LuTruck,
  LuUserRound,
  LuWrench,
  LuX,
} from "react-icons/lu";
import dayjs from "dayjs";
import { formatReportDate, formatUnitStatus } from "../../utils/reportDisplay";

type ReportDetails = {
  id: number;
  date: string;
  createdAt?: string | null;
  jobSiteName?: string | null;
  unitCode: string | null;
  model: string | null;
  hm: string | null;
  problem: string | null;
  activity: string | null;
  activities?: string[];
  start: string | null;
  finish: string | null;
  codeJob: string | null;
  unitStatus: number | null;
  component: string | null;
  remark: string | null;
  mechanicNrpp: string | null;
  mechanicName: string | null;
  foremanName: string | null;
};

export function ReportDetailsContent({
  report,
  status,
}: {
  report: ReportDetails;
  status: "pending" | "approved";
}) {
  const activities = report.activities?.filter(Boolean) ?? [];
  const statusLabel =
    status === "pending" ? "Menunggu persetujuan" : "Disetujui";
  const unitStatus = formatUnitStatus(Number(report.unitStatus ?? 0));
  const unitStatusClass =
    unitStatus === "Ready"
      ? "bg-emerald-100 text-emerald-800"
      : unitStatus === "Continue"
        ? "bg-amber-100 text-amber-800"
        : "bg-base-200 text-base-content/70";
  const submittedAt =
    report.createdAt && dayjs(report.createdAt).isValid()
      ? dayjs(report.createdAt).locale("en").format("DD MMM YYYY · HH:mm")
      : "—";

  return (
    <div className="modal-box max-h-[90dvh] max-w-3xl overflow-y-auto rounded-3xl border border-emerald-100 bg-base-100 p-0 shadow-2xl">
      <header className="relative overflow-hidden rounded-t-3xl border-b border-emerald-100 bg-linear-to-br from-emerald-50 via-base-100 to-teal-50 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-emerald-200/30 blur-2xl" />
        <form method="dialog" className="absolute right-4 top-4 z-10">
          <button
            className="btn btn-circle btn-ghost btn-sm"
            aria-label="Tutup detail"
          >
            <LuX className="size-5" />
          </button>
        </form>
        <div className="relative flex flex-wrap items-start justify-between gap-4 pr-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Ringkasan pekerjaan
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-base-content">
              Laporan #{report.id}
            </h3>
            <p className="mt-1 text-sm text-base-content/60">
              Detail laporan mekanik
            </p>
          </div>
          <span
            className={`badge badge-lg gap-1.5 border-0 ${status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
          >
            {status === "approved" ? (
              <LuCircleCheck className="size-4" />
            ) : (
              <LuCircleAlert className="size-4" />
            )}
            {statusLabel}
          </span>
        </div>
        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<LuCalendarDays className="size-5" />}
            tone="bg-emerald-100 text-emerald-700"
            label="Tanggal"
            value={formatReportDate(report.date)}
          />
          <SummaryCard
            icon={<LuUserRound className="size-5" />}
            tone="bg-teal-100 text-teal-700"
            label="Foreman"
            value={report.foremanName || "—"}
          />
          <SummaryCard
            icon={<LuTruck className="size-5" />}
            tone="bg-lime-100 text-lime-700"
            label="Unit"
            value={report.unitCode || "Tanpa unit"}
            detail={report.model || "—"}
          />
        </div>
      </header>

      <div className="grid gap-4 p-5 sm:p-7">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
          <SectionTitle
            icon={<LuClock3 className="size-5" />}
            title="Waktu & kondisi unit"
            tone="bg-emerald-100 text-emerald-700"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile
              label="Mulai - selesai"
              value={`${report.start?.slice(0, 5) || "—"} - ${report.finish?.slice(0, 5) || "—"}`}
            />
            <InfoTile label="Hours meter" value={report.hm || "—"} />
            <div className="rounded-xl bg-base-200/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                Status unit
              </p>
              <span className={`badge mt-1 border-0 ${unitStatusClass}`}>
                {unitStatus}
              </span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoTile
              label="Job site"
              value={report.jobSiteName || "Belum dipetakan"}
              icon={<LuMapPin className="size-4" />}
            />
            <InfoTile
              label="Mekanik"
              value={report.mechanicName || "—"}
              detail={report.mechanicNrpp || "—"}
            />
            {report.createdAt && (
              <InfoTile
                label="Tanggal submit"
                value={submittedAt}
                icon={<LuCalendarDays className="size-4" />}
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
          <SectionTitle
            icon={<LuWrench className="size-5" />}
            title="Detail pekerjaan"
            tone="bg-pink-100 text-pink-700"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-base-200/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                Problem
              </p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm">
                {report.problem || "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Code Job" value={report.codeJob || "—"} />
              <InfoTile label="Component" value={report.component || "—"} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
          <SectionTitle
            icon={<LuFileText className="size-5" />}
            title="Aktivitas & catatan"
            tone="bg-lime-100 text-lime-700"
          />
          {activities.length ? (
            <ol className="grid list-inside list-decimal gap-2 rounded-xl bg-base-200/60 p-4 text-sm">
              {activities.map((activity, index) => (
                <li key={`${index}-${activity}`} className="wrap-break-word">
                  {activity}
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl bg-base-200/60 p-4 whitespace-pre-wrap wrap-break-word text-sm">
              {report.activity || "Belum ada aktivitas."}
            </p>
          )}
          <div className="mt-3 rounded-xl bg-base-200/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
              Remark
            </p>
            <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm">
              {report.remark || "—"}
            </p>
          </div>
        </section>
        <div className="flex justify-end">
          <form method="dialog">
            <button className="btn btn-outline rounded-xl px-6">Tutup</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
        {detail && (
          <p className="truncate text-xs text-base-content/55">{detail}</p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  tone,
}: {
  icon: ReactNode;
  title: string;
  tone: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        {icon}
      </span>
      <h4 className="font-bold">{title}</h4>
    </div>
  );
}

function InfoTile({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-base-200/60 p-3">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-base-content/50">
        {icon}
        {label}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-semibold">{value}</p>
      {detail && <p className="text-xs text-base-content/55">{detail}</p>}
    </div>
  );
}
