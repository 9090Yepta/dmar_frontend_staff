import { useQuery } from "@tanstack/react-query";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  LuActivity,
  LuCircleCheck,
  LuClock3,
  LuClipboardList,
  LuMapPin,
  LuMapPinOff,
  LuRefreshCw,
  LuShieldCheck,
  LuUsersRound,
  LuWrench,
} from "react-icons/lu";
import { getSuperadminDashboard } from "../../services/adminService";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const numberFormat = new Intl.NumberFormat("id-ID");
const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "2-digit",
});
const chartColors = {
  emerald: "#10b981",
  teal: "#14b8a6",
  amber: "#f59e0b",
  slate: "#94a3b8",
  grid: "rgba(148, 163, 184, 0.18)",
  ink: "#334155",
};

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return monthFormat.format(new Date(year, month - 1, 1));
}

const tooltipOptions = {
  backgroundColor: "#0f172a",
  titleColor: "#fff",
  bodyColor: "#e2e8f0",
  padding: 12,
  cornerRadius: 10,
  displayColors: true,
};

export function SuperadminDashboard() {
  const query = useQuery({
    queryKey: ["superadmin-dashboard"],
    queryFn: getSuperadminDashboard,
  });
  const dashboard = query.data;
  const summary = dashboard?.summary;

  const axisOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 18,
          color: chartColors.ink,
          font: { size: 11, weight: 600 },
        },
      },
      tooltip: tooltipOptions,
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#64748b", font: { size: 11, weight: 500 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false, dash: [4, 4] },
        grid: { color: chartColors.grid },
        ticks: {
          precision: 0,
          color: "#94a3b8",
          padding: 10,
          font: { size: 10 },
        },
      },
    },
  };

  const monthlyData = {
    labels: (dashboard?.trend ?? []).map(({ month }) => formatMonth(month)),
    datasets: [
      {
        label: "Approved",
        data: (dashboard?.trend ?? []).map(({ approved }) => approved),
        backgroundColor: chartColors.emerald,
        borderRadius: 7,
        borderSkipped: false,
        maxBarThickness: 26,
      },
      {
        label: "Pending",
        data: (dashboard?.trend ?? []).map(({ pending }) => pending),
        backgroundColor: chartColors.amber,
        borderRadius: 7,
        borderSkipped: false,
        maxBarThickness: 26,
      },
    ],
  };
  const siteData = {
    labels: (dashboard?.sites ?? []).map(({ name }) => name),
    datasets: [
      {
        label: "Laporan",
        data: (dashboard?.sites ?? []).map(({ reports }) => reports),
        backgroundColor: [
          "#14b8a6",
          "#6366f1",
          "#0ea5e9",
          "#8b5cf6",
          "#f59e0b",
          "#10b981",
          "#ec4899",
          "#64748b",
        ],
        borderRadius: 7,
        borderSkipped: false,
        barThickness: 18,
      },
    ],
  };
  const donutData = {
    labels: [
      "Disetujui",
      "Menunggu",
      ...(summary?.otherReports ? ["Status lainnya"] : []),
    ],
    datasets: [
      {
        data: [
          summary?.approvedReports ?? 0,
          summary?.pendingReports ?? 0,
          ...(summary?.otherReports ? [summary.otherReports] : []),
        ],
        backgroundColor: [
          chartColors.emerald,
          chartColors.amber,
          ...(summary?.otherReports ? [chartColors.slate] : []),
        ],
        hoverBackgroundColor: [
          "#059669",
          "#d97706",
          ...(summary?.otherReports ? ["#64748b"] : []),
        ],
        borderColor: "#fff",
        borderWidth: 4,
        hoverOffset: 7,
        borderRadius: 6,
        spacing: 2,
      },
    ],
  };

  const stats = [
    {
      label: "Total laporan",
      value: summary?.totalReports,
      note: "Seluruh laporan DMAR",
      Icon: LuClipboardList,
      tone: "text-indigo-700",
      tile: "bg-indigo-50",
      dot: "bg-indigo-500",
      glow: "from-indigo-500/10",
    },
    {
      label: "Laporan pending",
      value: summary?.pendingReports,
      note: "Menunggu persetujuan",
      Icon: LuClock3,
      tone: "text-amber-700",
      tile: "bg-amber-50",
      dot: "bg-amber-500",
      glow: "from-amber-500/10",
    },
    {
      label: "Mekanik",
      value: summary?.mechanics,
      note: "Akun mekanik terdaftar",
      Icon: LuWrench,
      tone: "text-sky-700",
      tile: "bg-sky-50",
      dot: "bg-sky-500",
      glow: "from-sky-500/10",
    },
    {
      label: "Staff",
      value: summary?.staff,
      note: "Foreman dan admin",
      Icon: LuUsersRound,
      tone: "text-violet-700",
      tile: "bg-violet-50",
      dot: "bg-violet-500",
      glow: "from-violet-500/10",
    },
    {
      label: "Approved",
      value: summary?.approvedReports,
      note: "Laporan disetujui",
      Icon: LuCircleCheck,
      tone: "text-emerald-700",
      tile: "bg-emerald-50",
      dot: "bg-emerald-500",
      glow: "from-emerald-500/10",
    },
    {
      label: "Job site aktif",
      value: summary?.activeJobSites,
      note: "Lokasi operasional aktif",
      Icon: LuMapPin,
      tone: "text-teal-700",
      tile: "bg-teal-50",
      dot: "bg-teal-500",
      glow: "from-teal-500/10",
    },
    {
      label: "Superadmin",
      value: summary?.superadmins,
      note: "Akun akses global",
      Icon: LuShieldCheck,
      tone: "text-fuchsia-700",
      tile: "bg-fuchsia-50",
      dot: "bg-fuchsia-500",
      glow: "from-fuchsia-500/10",
    },
    {
      label: "Tanpa job site",
      value: summary?.unassignedReports,
      note: "Laporan belum dipetakan",
      Icon: LuMapPinOff,
      tone: "text-rose-700",
      tile: "bg-rose-50",
      dot: "bg-rose-500",
      glow: "from-rose-500/10",
    },
  ];

  return (
    <section className="space-y-6 lg:space-y-8">
      <div className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-24 -z-10 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 size-60 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-100 backdrop-blur">
              <LuActivity className="size-3.5" /> Ringkasan global
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard DMAR
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Pantau aktivitas laporan dan pengguna dari seluruh job site dalam
              satu tampilan.
            </p>
          </div>
          <button
            className="btn btn-sm border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <LuRefreshCw
              className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
            Perbarui data
          </button>
        </div>
      </div>

      {query.error && (
        <div role="alert" className="alert alert-error rounded-2xl">
          <span>{query.error.message}</span>
        </div>
      )}

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(
              ({ label, value, note, Icon, tone, tile, dot, glow }) => (
                <article
                  key={label}
                  className={`card card-border overflow-hidden border-base-300/70 bg-linear-to-br ${glow} via-base-100 to-base-100 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="card-body gap-5 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-base-content/60">
                          {label}
                        </p>
                        <p
                          className={`mt-2 text-3xl font-bold tracking-tight ${tone}`}
                        >
                          {numberFormat.format(value ?? 0)}
                        </p>
                      </div>
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tile} ${tone}`}
                      >
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-t border-base-300/60 pt-3 text-xs text-base-content/50">
                      <span className={`size-1.5 rounded-full ${dot}`} />
                      {note}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            <article className="card card-border border-base-300/70 bg-base-100 shadow-sm xl:col-span-3">
              <div className="card-body p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="card-title text-base sm:text-lg">
                      Aktivitas laporan
                    </h3>
                    <p className="mt-1 text-sm text-base-content/55">
                      Tren laporan approved dan pending · 6 bulan terakhir
                    </p>
                  </div>
                  <span className="badge badge-ghost">Per bulan</span>
                </div>
                <div className="h-72 sm:h-80">
                  <Bar
                    data={monthlyData}
                    options={{
                      ...axisOptions,
                      scales: {
                        ...axisOptions.scales,
                        x: { ...axisOptions.scales?.x, stacked: true },
                        y: { ...axisOptions.scales?.y, stacked: true },
                      },
                    }}
                  />
                </div>
              </div>
            </article>

            <article className="card card-border border-base-300/70 bg-base-100 shadow-sm xl:col-span-2">
              <div className="card-body p-4 sm:p-6">
                <div>
                  <h3 className="card-title text-base sm:text-lg">
                    Status laporan
                  </h3>
                  <p className="mt-1 text-sm text-base-content/55">
                    Komposisi laporan yang tercatat
                  </p>
                </div>
                <div className="relative mx-auto h-64 w-full max-w-sm">
                  <Doughnut
                    data={donutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "74%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            boxWidth: 8,
                            boxHeight: 8,
                            padding: 18,
                            color: chartColors.ink,
                            font: { size: 11, weight: 600 },
                          },
                        },
                        tooltip: tooltipOptions,
                      },
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 translate-y-[-65%] text-center">
                    <p className="text-xs font-medium text-base-content/50">
                      Total laporan
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      {numberFormat.format(summary?.totalReports ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className="card card-border border-base-300/70 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="card-title text-base sm:text-lg">
                    Laporan per job site
                  </h3>
                  <p className="mt-1 text-sm text-base-content/55">
                    Perbandingan maksimal delapan site dengan laporan terbanyak
                  </p>
                </div>
                <span className="badge badge-ghost">Lintas site</span>
              </div>
              {dashboard.sites.length ? (
                <div className="h-80 sm:h-96">
                  <Bar
                    data={siteData}
                    options={{
                      ...axisOptions,
                      indexAxis: "y",
                      plugins: {
                        ...axisOptions.plugins,
                        legend: { display: false },
                        tooltip: tooltipOptions,
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          border: { display: false },
                          grid: { color: chartColors.grid },
                          ticks: { precision: 0, color: "#94a3b8", padding: 8 },
                        },
                        y: {
                          grid: { display: false },
                          border: { display: false },
                          ticks: {
                            color: "#475569",
                            font: { size: 11, weight: 600 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-base-300 bg-base-200/30 text-center">
                  <p className="text-sm text-base-content/55">
                    Belum ada data job site untuk ditampilkan.
                  </p>
                </div>
              )}
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
