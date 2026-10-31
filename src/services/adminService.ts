import { apiFetch, requestJson } from "./apiClient";
import type {
  AdminRole,
  AdminUserInput,
  ApprovedReport,
  JobSite,
  LegacyExportRow,
  LegacyReport,
  MasterInput,
  MasterResource,
  MasterRow,
  Person,
} from "../types/admin";
import type { DashboardData } from "../types/dashboard";

export function getSuperadminDashboard() {
  return requestJson<DashboardData>("/api/v1/admin/dashboard");
}

export function getApprovedReports(filters: {
  limit: number;
  offset: number;
  mechanicField: "name" | "nrpp";
  mechanicSearch: string;
  unitCode: string;
  from: string;
  to: string;
  jobSiteId?: number | null;
  foremanId?: number | null;
}) {
  const query = new URLSearchParams({
    limit: String(filters.limit),
    offset: String(filters.offset),
    mechanicField: filters.mechanicField,
    mechanicSearch: filters.mechanicSearch,
    unitCode: filters.unitCode,
    from: filters.from,
    to: filters.to,
  });
  if (filters.jobSiteId) query.set("jobSiteId", String(filters.jobSiteId));
  if (filters.foremanId) query.set("foremanId", String(filters.foremanId));
  return requestJson<{ items: ApprovedReport[]; total: number }>(
    `/api/v1/admin/reports/approved?${query}`,
  );
}

export function getApprovedUnitOptions(jobSiteId?: number | null) {
  const query = jobSiteId
    ? `?jobSiteId=${encodeURIComponent(String(jobSiteId))}`
    : "";
  return requestJson<{ items: string[] }>(
    `/api/v1/admin/reports/approved/unit-options${query}`,
  );
}

export function getLegacyReports(filters: {
  limit: number;
  offset: number;
  mechanicField: "name" | "nrpp";
  mechanicSearch: string;
  foremanId?: number | null;
  from: string;
  to: string;
}) {
  const query = new URLSearchParams({
    limit: String(filters.limit),
    offset: String(filters.offset),
    mechanicField: filters.mechanicField,
    mechanicSearch: filters.mechanicSearch,
    from: filters.from,
    to: filters.to,
  });
  if (filters.foremanId) query.set("foremanId", String(filters.foremanId));
  return requestJson<{ items: LegacyReport[]; total: number }>(
    `/api/v1/admin/reports/legacy?${query}`,
  );
}

export function getLegacyForemen() {
  return requestJson<{ items: { id: number; name: string }[] }>(
    "/api/v1/admin/reports/legacy/foremen",
  );
}

export async function exportLegacyReports(
  ids: number[],
  csrfToken: string,
  format: "csv" | "xlsx",
): Promise<Blob | LegacyExportRow[]> {
  const response = await apiFetch("/api/v1/admin/reports/legacy/export", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ ids, format }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message ?? "Ekspor laporan gagal.");
  }
  if (format === "csv") return response.blob();
  const payload = (await response.json()) as {
    data?: { items?: LegacyExportRow[] };
  };
  if (!Array.isArray(payload.data?.items))
    throw new Error("Data XLSX dari server tidak valid.");
  return payload.data.items;
}

export function getAdminUsers(
  role: AdminRole,
  search: string,
  jobSiteId?: number | null,
  paging: {
    searchBy?: "name" | "nrpp" | "position";
    limit?: number;
    offset?: number;
  } = {},
) {
  const query = new URLSearchParams({
    role,
    search,
    searchBy: paging.searchBy ?? "name",
    limit: String(paging.limit ?? 500),
    offset: String(paging.offset ?? 0),
  });
  if (jobSiteId) query.set("jobSiteId", String(jobSiteId));
  return requestJson<{
    items: Person[];
    total: number;
    jobSites: Pick<JobSite, "id" | "code" | "name">[];
  }>(`/api/v1/admin/users?${query}`);
}

export function saveAdminUser(
  role: AdminRole,
  id: number | null,
  input: AdminUserInput,
  csrfToken: string,
) {
  const path =
    id === null ? "/api/v1/admin/users" : `/api/v1/admin/users/${role}/${id}`;
  if (input.profileImage) {
    const body = new FormData();
    if (id === null) body.append("role", role);
    for (const [key, value] of Object.entries(input)) {
      if (key === "profileImage" || value === undefined || value === null)
        continue;
      body.append(
        key,
        Array.isArray(value) ? JSON.stringify(value) : String(value),
      );
    }
    body.append("profileImage", input.profileImage);
    return requestJson<{ id?: number; updated?: boolean }>(path, {
      // PHP parses multipart form data on POST; use POST for image-bearing updates.
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body,
    });
  }
  return requestJson<{ id?: number; updated?: boolean }>(path, {
    method: id === null ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify(id === null ? { role, ...input } : input),
  });
}

export function resetAdminUserPassword(
  role: AdminRole,
  id: number,
  csrfToken: string,
) {
  return requestJson<{ passwordReset: boolean }>(
    `/api/v1/admin/users/${role}/${id}/password-reset`,
    {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    },
  );
}

export function deleteAdminUser(
  role: AdminRole,
  id: number,
  csrfToken: string,
) {
  return requestJson<{ deleted: boolean }>(
    `/api/v1/admin/users/${role}/${id}`,
    {
      method: "DELETE",
      headers: { "X-CSRF-Token": csrfToken },
    },
  );
}

export function getJobSites() {
  return requestJson<{ items: JobSite[] }>("/api/v1/admin/job-sites");
}

export function saveJobSite(
  id: number | null,
  input: { code: string; name: string; isActive?: boolean },
  csrfToken: string,
) {
  const path =
    id === null ? "/api/v1/admin/job-sites" : `/api/v1/admin/job-sites/${id}`;
  return requestJson<{ id?: number; updated?: boolean }>(path, {
    method: id === null ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify(input),
  });
}

export function getMasterRows(
  resource: MasterResource,
  paging?: {
    searchBy?: "unitCode" | "model" | "brand";
    search?: string;
    limit?: number;
    offset?: number;
  },
) {
  const query = new URLSearchParams();
  if (paging) {
    query.set("searchBy", paging.searchBy ?? "unitCode");
    query.set("search", paging.search ?? "");
    query.set("limit", String(paging.limit ?? 10));
    query.set("offset", String(paging.offset ?? 0));
  }
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return requestJson<{ items: MasterRow[]; total?: number }>(
    `/api/v1/admin/masters/${resource}${suffix}`,
  );
}

export function saveMasterRow(
  resource: MasterResource,
  id: number | null,
  input: MasterInput,
  csrfToken: string,
) {
  const path =
    id === null
      ? `/api/v1/admin/masters/${resource}`
      : `/api/v1/admin/masters/${resource}/${id}`;
  if (input.unitImage) {
    const body = new FormData();
    for (const [key, value] of Object.entries(input)) {
      if (key === "unitImage" || value === undefined || value === null)
        continue;
      body.append(key, String(value));
    }
    body.append("unitImage", input.unitImage);
    return requestJson<{ id?: number; updated?: boolean }>(path, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body,
    });
  }
  return requestJson<{ id?: number; updated?: boolean }>(path, {
    method: id === null ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify(input),
  });
}

export function deleteMasterRow(
  resource: MasterResource,
  id: number,
  csrfToken: string,
) {
  return requestJson<{ deleted: boolean }>(
    `/api/v1/admin/masters/${resource}/${id}`,
    {
      method: "DELETE",
      headers: { "X-CSRF-Token": csrfToken },
    },
  );
}
