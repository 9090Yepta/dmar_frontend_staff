import { Alert } from "./components/ui/Alert";
import { AccessCard } from "./features/auth/AccessCard";
import AdminPanel from "./features/admin/AdminPanel";
import { SuperadminDashboard } from "./features/dashboard/SuperadminDashboard";
import { PendingApprovals } from "./features/reports/PendingApprovals";
import { useStaffWorkspace } from "./contexts/StaffWorkspaceContext";
import { LoginLayout } from "./layouts/LoginLayout";
import { MainLayout } from "./layouts/MainLayout";
import { AdminWorkspaceLayout } from "./layouts/AdminWorkspaceLayout";
import type { StaffView } from "./types/staff";
import { ForemanHome } from "./features/foreman/ForemanHome";
import { ForemanHistory } from "./features/foreman/ForemanHistory";
import { ForemanAccount } from "./features/foreman/ForemanAccount";
import { ForemanWorkspaceLayout } from "./features/foreman/ForemanWorkspaceLayout";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export default function App({ view }: { view: StaffView }) {
  const workspace = useStaffWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  useEffect(() => {
    if (
      workspace.user?.role === "foreman" &&
      ![
        "/admin/foremen",
        "/admin/foremen/history",
        "/admin/foremen/account",
      ].includes(pathname)
    ) {
      void navigate({ to: "/admin/foremen", replace: true });
    }
  }, [navigate, pathname, workspace.user?.role]);
  const canManage =
    workspace.user?.role === "admin" || workspace.user?.role === "superadmin";
  const isSuperadmin = workspace.user?.role === "superadmin";
  const activeView: StaffView =
    view === "dashboard" && !isSuperadmin ? "pending" : view;
  const canOpenView =
    canManage &&
    activeView !== "dashboard" &&
    ((activeView !== "masters" &&
      activeView !== "sites" &&
      activeView !== "admins") ||
      isSuperadmin);
  const accessCard = (
    <AccessCard
      user={workspace.user}
      nrpp={workspace.nrpp}
      password={workspace.password}
      rememberMe={workspace.rememberMe}
      busy={workspace.busy}
      onNrppChange={workspace.setNrpp}
      onPasswordChange={workspace.setPassword}
      onRememberMeChange={workspace.setRememberMe}
      onSignIn={workspace.signIn}
      onSignOut={workspace.signOut}
    />
  );

  if (!workspace.user) {
    if (workspace.api === "loading") {
      return (
        <main className="grid min-h-svh place-items-center bg-base-200 p-4">
          <section
            className="card w-full max-w-sm border border-base-300 bg-base-100 shadow-xl"
            aria-live="polite"
          >
            <div className="card-body items-center gap-4 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-xl font-black text-primary-content">
                D
              </span>
              <span
                className="loading loading-spinner loading-md text-primary"
                aria-hidden="true"
              />
              <div>
                <h1 className="font-semibold">Memeriksa sesi</h1>
                <p className="mt-1 text-sm text-base-content/60">
                  Mohon tunggu sebentar…
                </p>
              </div>
            </div>
          </section>
        </main>
      );
    }
    return (
      <LoginLayout>
        {accessCard}
        {workspace.error && <Alert kind="error">{workspace.error}</Alert>}
        {workspace.notice && <Alert kind="success">{workspace.notice}</Alert>}
      </LoginLayout>
    );
  }

  if (workspace.user.role === "foreman") {
    return (
      <ForemanWorkspaceLayout
        user={workspace.user}
        pendingCount={workspace.reports.length}
        onSignOut={() => void workspace.signOut()}
      >
        {workspace.error && <Alert kind="error">{workspace.error}</Alert>}
        {workspace.notice && <Alert kind="success">{workspace.notice}</Alert>}
        {view === "foreman-history" ? (
          <ForemanHistory />
        ) : view === "foreman-account" ? (
          <ForemanAccount
            user={workspace.user}
            passwordBusy={workspace.passwordBusy}
            profileImageBusy={workspace.profileImageBusy}
            onChangePassword={workspace.changePassword}
            onUploadProfileImage={workspace.uploadProfileImage}
          />
        ) : (
          <ForemanHome
            reports={workspace.reports}
            loading={workspace.pendingLoading}
            refreshing={workspace.pendingRefreshing}
            busy={workspace.busy}
            onApprove={workspace.approve}
          />
        )}
      </ForemanWorkspaceLayout>
    );
  }

  const workspaceContent = (
    <>
      {workspace.error && <Alert kind="error">{workspace.error}</Alert>}
      {workspace.notice && <Alert kind="success">{workspace.notice}</Alert>}
      {activeView === "dashboard" && isSuperadmin ? (
        <SuperadminDashboard />
      ) : activeView !== "dashboard" &&
        activeView !== "pending" &&
        canOpenView ? (
        <AdminPanel
          tab={activeView}
          csrfToken={workspace.csrfToken}
          user={workspace.user}
        />
      ) : activeView !== "pending" ? (
        <section className="empty-state">
          Halaman ini tidak tersedia untuk role akun Anda.
        </section>
      ) : (
        <PendingApprovals
          reports={workspace.reports}
          busy={workspace.busy}
          loading={workspace.pendingLoading}
          refreshing={workspace.pendingRefreshing}
          onRefresh={() => void workspace.refreshPending()}
          onApprove={(id) => void workspace.approve(id)}
          isSuperadmin={isSuperadmin}
          canApprove={isSuperadmin}
          role={workspace.user.role}
          jobSiteId={workspace.user.jobSiteId}
          pendingCount={workspace.reports.length}
          scopeLabel={
            isSuperadmin
              ? "Lintas job site"
              : (workspace.user.jobSiteName ?? "Job site akun")
          }
        />
      )}
    </>
  );

  if (canManage) {
    return (
      <AdminWorkspaceLayout
        role={isSuperadmin ? "superadmin" : "admin"}
        api={workspace.api}
        pendingCount={workspace.reports.length}
        view={activeView}
        user={workspace.user}
        onSignOut={workspace.signOut}
      >
        {() => workspaceContent}
      </AdminWorkspaceLayout>
    );
  }

  return (
    <MainLayout api={workspace.api} pendingCount={workspace.reports.length}>
      {accessCard}
      {workspaceContent}
    </MainLayout>
  );
}
