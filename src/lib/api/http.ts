// lib/api/http.ts
//
// Shared by every module's API layer (quotations, inventory, email...).
// `cache: "no-store"` avoids the ETag/304-with-empty-body issue we hit on
// the quotations list — always use this instead of raw fetch().
import { API_BASE_URL } from "@/services/api";

export async function apiFetch(url: string, init: RequestInit = {}) {
  let token = null;
  if (typeof window !== "undefined") {
    const authStr = localStorage.getItem("auth");
    if (authStr) {
      try {
        token = JSON.parse(authStr).token;
      } catch (e) {}
    }
  }

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // Auto-logout on 401
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 304) {
    throw new Error(
      "Got a 304 Not Modified with no body — check API responses aren't being cached/ETag'd.",
    );
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export function buildQuery(
  params: Record<string, any>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}