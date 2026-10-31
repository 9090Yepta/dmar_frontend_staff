import { apiFetch, requestJson } from "./apiClient";
import type {
  ApiResult,
  SessionPayload,
  SessionData,
  StaffUser,
} from "../types/staff";

export async function getStaffSession(
  signal: AbortSignal,
): Promise<SessionData | null> {
  const response = await apiFetch("/api/v1/auth/me", { signal });
  if (response.status === 401) return null;
  const payload = (await response.json()) as SessionPayload;
  if (!response.ok || !payload.data) throw new Error("API response is not OK");
  return payload.data;
}

export function loginStaff(
  nrpp: string,
  password: string,
  rememberMe: boolean,
) {
  return requestJson<{ user: StaffUser; csrfToken: string }>(
    "/api/v1/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal: "staff", nrpp, password, rememberMe }),
    },
  ).then(async (login) => {
    const session = await getStaffSession(new AbortController().signal);
    if (!session || session.user.id !== login.user.id) {
      throw new Error(
        "Login diterima, tetapi sesi tidak tersimpan. Periksa cookie sesi lalu coba lagi.",
      );
    }
    return session;
  });
}

export async function logoutStaff(csrfToken: string): Promise<void> {
  const response = await apiFetch("/api/v1/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (response.ok) return;
  const payload = (await response.json()) as ApiResult<unknown>;
  throw new Error(
    payload.error?.message ??
      "Logout gagal. Muat ulang halaman lalu coba lagi.",
  );
}

export function changeStaffPassword(
  currentPassword: string,
  newPassword: string,
  csrfToken: string,
) {
  return requestJson<{ changed: boolean; csrfToken: string }>(
    "/api/v1/auth/password-change",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    },
  );
}

export function uploadStaffProfileImage(file: File, csrfToken: string) {
  const body = new FormData();
  body.append("profileImage", file);
  return requestJson<{ profileImageUrl: string }>(
    "/api/v1/account/profile-image",
    {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body,
    },
  );
}
