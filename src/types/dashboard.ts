export type DashboardData = {
  summary: {
    totalReports: number;
    pendingReports: number;
    approvedReports: number;
    otherReports: number;
    unassignedReports: number;
    mechanics: number;
    staff: number;
    superadmins: number;
    activeJobSites: number;
  };
  trend: { month: string; total: number; approved: number; pending: number }[];
  sites: { id: number; name: string; reports: number }[];
};
