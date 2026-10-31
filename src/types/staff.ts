export type ApiResult<T> = { ok: boolean; data?: T; error?: { message: string } };

export type StaffUser = {
  id: number;
  nrpp: string;
  name: string;
  position: string;
  portal: string;
  role: 'foreman' | 'admin' | 'superadmin';
  jobSiteId: number | null;
  jobSiteName: string | null;
  profileImageUrl?: string | null;
};

export type SessionData = { user: StaffUser; csrfToken: string };
export type SessionPayload = ApiResult<SessionData>;

export type PendingReport = {
  id: number;
  foremanId: number | null;
  jobSiteId: number | null;
  jobSiteName: string | null;
  date: string;
  unitCode: string;
  model: string;
  hm: string;
  problem: string;
  activity: string;
  activities?: string[];
  start: string;
  finish: string;
  codeJob: string;
  unitStatus: number;
  component: string;
  remark: string;
  mechanicNrpp: string;
  mechanicName: string;
  mechanicProfileImageUrl?: string | null;
  foremanName: string;
};

export type ForemanApprovedReport = {
  id: number;
  mechanicNrpp: string;
  mechanicName: string;
  unitCode: string | null;
  model: string | null;
  date: string;
  approvedAt: string | null;
};

export type StaffView = 'dashboard' | 'pending' | 'approved' | 'legacy' | 'users' | 'mechanics' | 'foremen' | 'admins' | 'masters' | 'sites' | 'foreman-history' | 'foreman-account';
