// lib/api/inventory.ts
//
// Assumed to return the same { success, data } envelope as quotations,
// since no example response was given for these endpoints — adjust
// handleResponse/field names below if the real shape differs.
import { API_BASE_URL } from "@/services/api";
import { apiFetch, handleResponse, buildQuery } from "./http";
import type {
  ApiResponse,
  CreateWarehouseInput,
  MovementListFilters,
  PaginatedResponse,
  StockItem,
  StockListFilters,
  StockMovement,
  StockMovementInput,
  UpdateWarehouseInput,
  Warehouse,
} from "@/types/inventory";

const BASE = `${API_BASE_URL}/inventory`;

// ----- Warehouses -----
// Spec only confirms GET; create/update/delete assume standard REST verbs
// on the same resource — check with the backend before relying on them.

export async function listWarehouses(): Promise<Warehouse[]> {
  const res = await apiFetch(`${BASE}/warehouses`);
  const data = await handleResponse<ApiResponse<Warehouse[]>>(res);
  return data.data;
}

export async function createWarehouse(
  payload: CreateWarehouseInput,
): Promise<Warehouse> {
  const res = await apiFetch(`${BASE}/warehouses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<Warehouse>>(res);
  return data.data;
}

export async function updateWarehouse(
  id: number,
  payload: UpdateWarehouseInput,
): Promise<Warehouse> {
  const res = await apiFetch(`${BASE}/warehouses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<Warehouse>>(res);
  return data.data;
}

export async function deleteWarehouse(id: number): Promise<void> {
  const res = await apiFetch(`${BASE}/warehouses/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

// ----- Stock -----

export async function listStock(
  filters: StockListFilters = {},
): Promise<PaginatedResponse<StockItem>> {
  const res = await apiFetch(`${BASE}/stock${buildQuery(filters)}`);
  return handleResponse<PaginatedResponse<StockItem>>(res);
}

export async function listLowStock(): Promise<StockItem[]> {
  const res = await apiFetch(`${BASE}/low-stock`);
  const data = await handleResponse<ApiResponse<StockItem[]>>(res);
  return data.data;
}

// ----- Stock movements -----

export async function stockIn(payload: StockMovementInput): Promise<StockMovement> {
  const res = await apiFetch(`${BASE}/stock-in`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<StockMovement>>(res);
  return data.data;
}

export async function stockOut(payload: StockMovementInput): Promise<StockMovement> {
  const res = await apiFetch(`${BASE}/stock-out`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<StockMovement>>(res);
  return data.data;
}

export async function stockAdjustment(
  payload: StockMovementInput,
): Promise<StockMovement> {
  const res = await apiFetch(`${BASE}/adjustment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<ApiResponse<StockMovement>>(res);
  return data.data;
}

// Uses /api/inventory/history and /api/inventory/history/:productId
export async function listMovements(
  filters: MovementListFilters = {},
): Promise<PaginatedResponse<StockMovement>> {
  const { product_id, ...restFilters } = filters;
  const endpoint = product_id ? `/history/${product_id}` : `/history`;
  const res = await apiFetch(`${BASE}${endpoint}${buildQuery(restFilters)}`);
  return handleResponse<PaginatedResponse<StockMovement>>(res);
}