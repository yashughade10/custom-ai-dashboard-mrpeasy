// lib/api/quotations.ts
//
// Matches the fetch + API_BASE_URL pattern already used elsewhere in the app
// (see NewsletterEmailSender). Every endpoint returns { success, data, ... }
// so we check `success` and throw on failure, letting TanStack Query's
// onError handle the toast.
import { API_BASE_URL } from "@/services/api";
import type {
  CompanyOption,
  ContactOption,
  CreateQuotationInput,
  DealOption,
  ProductOption,
  PaginatedResponse,
  Quotation,
  QuotationListFilters,
  SendQuotationInput,
  UpdateQuotationInput,
} from "@/types/quotation";
import { apiFetch } from "./http";

const BASE = `${API_BASE_URL}/sales/quotations`;

// Express/NestJS auto-generates ETags for JSON responses. Combined with the
// browser's HTTP cache, a plain fetch() can get back a 304 with an empty
// body instead of the actual data (especially with DevTools open and
// caching disabled). `cache: "no-store"` forces a full fresh request every
// time and sidesteps this entirely — always use this wrapper instead of the
// raw fetch() for API calls.
// function apiFetch(url: string, init: RequestInit = {}) {
//   return fetch(url, {
//     ...init,
//     cache: "no-store",
//     headers: {
//       ...(init.body ? { "Content-Type": "application/json" } : {}),
//       ...init.headers,
//     },
//   });
// }

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 304) {
    throw new Error(
      "Got a 304 Not Modified with no body — check that API responses aren't being cached/ETag'd on the way to the browser.",
    );
  }
  const data = await res.json();
  
  // Accept both explicit success: true and successful HTTP status codes (200-299, including 201)
  const isSuccess = data.success === true || (res.ok && data.success !== false);
  
  if (!isSuccess) {
    console.error("API Error Response:", {
      status: res.status,
      data,
      message: data.message || "Request failed",
    });
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

function buildQuery(params: Record<string, any>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listQuotations(
  filters: QuotationListFilters = {},
): Promise<PaginatedResponse<Quotation>> {
  const res = await apiFetch(`${BASE}${buildQuery(filters)}`);
  return handleResponse<PaginatedResponse<Quotation>>(res);
}

export async function getQuotation(id: number): Promise<Quotation> {
  const res = await apiFetch(`${BASE}/${id}`);
  const data = await handleResponse<{ success: true; data: Quotation }>(res);
  return data.data;
}

export async function createQuotation(
  payload: CreateQuotationInput,
): Promise<Quotation> {
  const res = await apiFetch(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ success: true; data: Quotation }>(res);
  return data.data;
}

export async function updateQuotation(
  id: number,
  payload: UpdateQuotationInput,
): Promise<Quotation> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ success: true; data: Quotation }>(res);
  return data.data;
}

export async function deleteQuotation(id: number): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  await handleResponse(res);
}

export async function sendQuotation(
  id: number,
  payload: SendQuotationInput,
): Promise<Quotation> {
  const res = await apiFetch(`${BASE}/${id}/send`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ success: true; data: Quotation }>(res);
  return data.data;
}

export async function approveQuotation(id: number): Promise<Quotation> {
  const res = await apiFetch(`${BASE}/${id}/approve`, { method: "POST" });
  const data = await handleResponse<{ success: true; data: Quotation }>(res);
  return data.data;
}

export async function convertQuotation(
  id: number,
): Promise<{ sales_order_id: number; order_number: string }> {
  const res = await apiFetch(`${BASE}/${id}/convert`, { method: "POST" });
  const data = await handleResponse<{
    success: true;
    data: { sales_order_id: number; order_number: string };
  }>(res);
  return data.data;
}

export function getQuotationPdfUrl(id: number): string {
  // Opened directly in a new tab rather than fetched via JS.
  return `${BASE}/${id}/pdf`;
}

// ----- Lookup endpoints used by the create/edit form -----
// Adjust these paths/response shapes to match the real CRM & catalog routes.

export async function listCompanies(search = ""): Promise<CompanyOption[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/crm/companies${buildQuery({ search, limit: 50 })}`,
  );
  const data = await handleResponse<{ success: true; data: CompanyOption[] }>(
    res,
  );
  return data.data;
}

export async function listContacts(search = ""): Promise<ContactOption[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/crm/contacts${buildQuery({ search, limit: 50 })}`,
  );
  const data = await handleResponse<{ success: true; data: ContactOption[] }>(
    res,
  );
  return data.data;
}

export async function listDeals(search = ""): Promise<DealOption[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/crm/deals${buildQuery({ search, limit: 50 })}`,
  );
  const data = await handleResponse<{ success: true; data: DealOption[] }>(
    res,
  );
  return data.data;
}

export async function listProducts(search = ""): Promise<ProductOption[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/products${buildQuery({ search, limit: 50 })}`,
  );
  const data = await handleResponse<{ success: true; data: ProductOption[] }>(
    res,
  );
  return data.data;
}