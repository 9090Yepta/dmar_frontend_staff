export type AdminRole = "mechanic" | "foreman" | "admin" | "superadmin";
export type MasterResource = "units" | "job-codes" | "components";

export type Person = {
  id: number;
  nrpp: string;
  name: string;
  position: string;
  levelAccess: number;
  jobSiteId: number | null;
  jobSiteName: string | null;
  profileImageUrl?: string | null;
  jobSiteIds?: number[];
  jobSiteNames?: string[];
};
export type JobSite = {
  id: number;
  code: string;
  name: string;
  isActive: number;
  userCount: number;
  reportCount: number;
};
export type Unit = {
  id: number;
  unitCode: string;
  model: string;
  brand: string;
  imageUrl?: string | null;
};
export type JobCode = { id: number; description: string; groupCode: number };
export type Component = { id: number; description: string; groupCode: number };
export type MasterRow = Unit | JobCode | Component;
export type ApprovedReport = {
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
  foremanName: string;
};
export type LegacyReport = Omit<ApprovedReport, "jobSiteId" | "jobSiteName"> & {
  mechanicId: number | null;
  status: number;
  createdAt: string;
};
export type LegacyExportRow = {
  tanggal: string | null;
  nrpp: string | null;
  nama: string | null;
  foremen: string | null;
  unit_code: string | null;
  model: string | null;
  hm: string | null;
  problem: string | null;
  activity: string | null;
  start: string | null;
  end: string | null;
  code_job: string | null;
  component: string | null;
  remark: string | null;
  status_unit: string;
  "status laporan": string;
};

export type AdminUserInput = {
  nrpp: string;
  name: string;
  position: string;
  password?: string;
  jobSiteId?: number | null;
  jobSiteIds?: number[];
  profileImage?: File | null;
};
export type MasterInput = {
  unitCode?: string;
  model?: string;
  brand?: string;
  description?: string;
  groupCode?: number;
  unitImage?: File | null;
};
