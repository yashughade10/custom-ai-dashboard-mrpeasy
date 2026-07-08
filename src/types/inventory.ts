// types/inventory.ts

export interface Warehouse {
  id: number;
  name: string;
  location?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWarehouseInput {
  name: string;
  location?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export interface StockItem {
  id: number;
  product_id: number;
  product_name: string;
  sku?: string | null;
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  reserved_qty?: number;
  reorder_level: number;
  updated_at: string;
}

export type MovementType = "in" | "out" | "adjustment";

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  movement_type: MovementType;
  quantity: number;
  reference?: string | null;
  reason?: string | null;
  performed_by?: string | null;
  created_at: string;
}

export interface StockMovementInput {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
}

export interface StockListFilters {
  warehouse_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MovementListFilters {
  warehouse_id?: number;
  product_id?: number;
  movement_type?: MovementType;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}