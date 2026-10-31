import { ApprovedReports } from "./reports/ApprovedReports";
import { LegacyReports } from "./reports/LegacyReports";
import { MastersAdmin } from "./masters/MastersAdmin";
import { UsersAdmin } from "./users/UsersAdmin";
import { JobSitesAdmin } from "./JobSitesAdmin";
import type { StaffUser, StaffView } from "../../types/staff";

type AdminPanelProps = {
  tab: StaffView;
  csrfToken: string;
  user: StaffUser;
};

export default function AdminPanel({
  tab,
  csrfToken,
  user,
}: AdminPanelProps) {
  if (tab === "approved") {
    return <ApprovedReports isSuperadmin={user.role === "superadmin"} jobSiteName={user.jobSiteName} />;
  }

  if (tab === "legacy") {
    return <LegacyReports csrfToken={csrfToken} />;
  }

  if (tab === "users" || tab === "mechanics") {
    return <UsersAdmin csrfToken={csrfToken} user={user} role="mechanic" />;
  }

  if (tab === "foremen") {
    return <UsersAdmin csrfToken={csrfToken} user={user} role="foreman" />;
  }

  if (tab === "admins" && user.role === "superadmin") {
    return <UsersAdmin csrfToken={csrfToken} user={user} role="admin" />;
  }

  if (tab === "sites" && user.role === "superadmin") {
    return <JobSitesAdmin csrfToken={csrfToken} />;
  }

  if (tab === "masters" && user.role === "superadmin") {
    return <MastersAdmin csrfToken={csrfToken} />;
  }

  return (
    <section className="empty-state">
      Halaman ini tidak tersedia untuk role akun Anda.
    </section>
  );
}
