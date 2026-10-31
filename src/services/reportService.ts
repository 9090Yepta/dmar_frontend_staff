import { apiFetch, requestJson } from "./apiClient";
import type {
  ApiResult,
  ForemanApprovedReport,
  PendingReport,
} from "../types/staff";

export async function getPendingReports(): Promise<PendingReport[]> {
  const response = await apiFetch("/api/v1/reports/pending");
  const payload = (await response.json()) as ApiResult<{
    items: PendingReport[];
  }>;
  if (!response.ok || !payload.data)
    throw new Error(
      payload.error?.message ?? "Gagal memuat antrean persetujuan",
    );
  return payload.data.items;
}

export function approveReport(id: number, csrfToken: string) {
  return requestJson<{ approved: boolean }>(`/api/v1/reports/${id}/approve`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
}

export function getForemanApprovedReports(
  limit: number,
  offset: number,
  searchBy: "name" | "nrpp" = "name",
  search = "",
) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    searchBy,
    search,
  });
  return requestJson<{ items: ForemanApprovedReport[]; total: number }>(
    `/api/v1/reports/approved?${query}`,
  );
}
