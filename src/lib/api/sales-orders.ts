// lib/api/sales-orders.ts
import { API_BASE_URL } from "@/services/api";
import { apiFetch, handleResponse, buildQuery } from "./http";
import type {
  ApiResponse,
  CreateSalesOrderInput,
  PaginatedResponse,
  SalesOrder,
  SalesOrderListFilters,
  UpdateSalesOrderInput,
} from "@/types/sales-order";

const BASE = `${API_BASE_URL}/sales/orders`;

export async function listSalesOrders(
  filters: SalesOrderListFilters = {},
): Promise<PaginatedResponse<SalesOrder>> {
  const res = await apiFetch(`${BASE}${buildQuery(filters)}`);
  return handleResponse<PaginatedResponse<SalesOrder>>(res);
}

export async function getSalesOrder(id: number): Promise<SalesOrder> {
  const res = await apiFetch(`${BASE}/${id}`);
  const data = await handleResponse<ApiResponse<SalesOrder>>(res);
  return data.data;
}

export async function createSalesOrder(
  payload: CreateSalesOrderInput,
): Promise<SalesOrder> {
  const res = await apiFetch(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<SalesOrder>>(res);
  return data.data;
}

export async function updateSalesOrder(
  id: number,
  payload: UpdateSalesOrderInput,
): Promise<SalesOrder> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<SalesOrder>>(res);
  return data.data;
}

export async function deleteSalesOrder(id: number): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  await handleResponse(res);
}

export async function confirmSalesOrder(id: number): Promise<SalesOrder> {
  const res = await apiFetch(`${BASE}/${id}/confirm`, { method: "POST" });
  const data = await handleResponse<ApiResponse<SalesOrder>>(res);
  return data.data;
}

export function getSalesOrderPdfUrl(id: number): string {
  return `${BASE}/${id}/pdf`;
}