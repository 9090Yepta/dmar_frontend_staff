import { useEffect, useRef, useState } from "react";
import {
  LuCalendarDays,
  LuClock3,
  LuFileSearch,
  LuMapPin,
  LuWrench,
} from "react-icons/lu";
import { GiMineTruck } from "react-icons/gi";
import type { PendingReport } from "../../types/staff";
import { apiAssetUrl } from "../../services/apiClient";
import { formatReportDate } from "../../utils/reportDisplay";
import { ReportDetailsContent } from "../reports/ReportDetailsContent";
import { SlideToConfirm } from "../../components/ui/SlideToConfirm";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ForemanHome({
  reports,
  loading,
  refreshing,
  busy,
  onApprove,
}: {
  reports: PendingReport[];
  loading: boolean;
  refreshing: boolean;
  busy: boolean;
  onApprove: (id: number) => Promise<void>;
}) {
  const [selected, setSelected] = useState<PendingReport | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected && detailDialog.current && !detailDialog.current.open)
      detailDialog.current.showModal();
  }, [selected]);

  return (
    <section
      className="grid min-w-0 gap-4"
      aria-labelledby="foreman-home-title"
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          HOME
        </p>
        <h2 id="foreman-home-title" className="mt-1 text-xl font-bold">
          Approval Pending
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-base-content/60">
          Periksa ringkasan pekerjaan lalu 'slide' untuk menyetujui.
        </p>
      </header>

      {loading && reports.length === 0 ? (
        <div className="grid gap-3" aria-label="Memuat laporan">
          {[0, 1, 2].map((item) => (
            <div key={item} className="card border border-base-300 bg-base-100">
              <div className="card-body gap-4 p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="skeleton size-12 shrink-0 rounded-full" />
                  <div className="grid flex-1 content-center gap-2">
                    <span className="skeleton h-4 w-2/5" />
                    <span className="skeleton h-3 w-1/3" />
                  </div>
                </div>
                <span className="skeleton h-4 w-4/5" />
                <span className="skeleton h-4 w-3/5" />
                <span className="skeleton h-10 w-full rounded-box" />
              </div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
            <LuWrench className="size-6" />
          </span>
          <h3 className="font-semibold">Tidak ada laporan pending</h3>
          <p className="mt-1 text-sm text-base-content/60">
            Laporan mekanik yang ditugaskan kepada Anda akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {reports.map((report) => {
            const activities = report.activities?.length
              ? report.activities
              : report.activity
                ? [report.activity]
                : [];
            return (
              <article
                key={report.id}
                className="min-w-0 card bg-base-100 text-base-content border border-base-300 shadow-sm "
              >
                <div className="card bg-base-100 text-base-content"></div>
                <div className="card-body gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="avatar shrink-0">
                      <div className="size-12 overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-base-300">
                        {report.mechanicProfileImageUrl ? (
                          <img
                            src={apiAssetUrl(report.mechanicProfileImageUrl)}
                            alt={`Foto ${report.mechanicName}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-sm font-bold">
                            {initials(report.mechanicName)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">
                        {report.mechanicName}
                      </h3>
                      <p className="truncate text-xs text-base-content/60">
                        {report.mechanicNrpp}
                      </p>
                    </div>
                    <span className="badge badge-info badge-outline text-xs">
                      <LuCalendarDays className="size-4 shrink-0 text-primary" />{" "}
                      {formatReportDate(report.date)}
                    </span>
                  </div>
                  <div className="grid gap-2 rounded-box bg-base-200/70 p-3 text-sm sm:grid-cols-2">
                    <div className="flex justify-between">
                      <div className="flex items-center w-full gap-2">
                        <LuClock3 className="size-4 shrink-0 text-primary" />
                        <span>
                          {report.start?.slice(0, 5) || "—"}-
                          {report.finish?.slice(0, 5) || "—"}
                        </span>
                      </div>
                      <div className="flex items-center w-full gap-2">
                        <LuMapPin className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {report.jobSiteName || "Job site belum dipetakan"}
                        </span>
                      </div>
                    </div>
                    <p className="flex items-center gap-2">
                      <GiMineTruck className="size-4 shrink-0 text-primary" />
                      <span className="truncate">
                        {report.unitCode || "-"} /{" "}
                        <span className="italic text-xs">
                          {report.model || "-"}
                        </span>
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Aktivitas</p>
                    {activities.length ? (
                      <ol className="list-inside list-decimal space-y-1 text-xs text-base-content/80">
                        {activities.slice(0, 3).map((activity, index) => (
                          <li
                            key={`${report.id}-${index}`}
                            className="wrap-break-word"
                          >
                            {activity}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-base-content/55">
                        Belum ada aktivitas.
                      </p>
                    )}
                    {activities.length > 3 && (
                      <p className="mt-2 text-xs text-base-content/55">
                        +{activities.length - 3} aktivitas lain tersedia di
                        detail laporan.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => setSelected(report)}
                    >
                      <LuFileSearch className="size-4" /> Detail laporan
                    </button>
                  </div>
                  <div className="aura aura-dual text-teal-600">
                    <div className="card bg-base-100">
                      <div className="card-body rounded-box border border-success/25 bg-success/5 p-3">
                        <SlideToConfirm
                          label={`Geser untuk menyetujui laporan`}
                          completedLabel="Memproses persetujuan..."
                          disabled={busy || refreshing}
                          threshold={0.9}
                          resetAfter={1200}
                          onConfirm={() => onApprove(report.id)}
                        />
                        <p className="mt-1 text-center text-[11px] text-base-content/55">
                          Laporan #{report.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {refreshing && !loading && (
        <p className="text-center text-xs text-base-content/50">
          Memperbarui laporan…
        </p>
      )}
      <dialog
        ref={detailDialog}
        className="modal"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            detailDialog.current?.close();
        }}
      >
        {selected && (
          <ReportDetailsContent report={selected} status="pending" />
        )}
      </dialog>
    </section>
  );
}
