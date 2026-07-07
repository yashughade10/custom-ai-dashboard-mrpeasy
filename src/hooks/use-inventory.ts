// hooks/use-inventory.ts
"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api/inventory";
import type {
  CreateWarehouseInput,
  MovementListFilters,
  StockListFilters,
  StockMovementInput,
  UpdateWarehouseInput,
} from "@/types/inventory";

export const inventoryKeys = {
  warehouses: ["warehouses"] as const,
  stock: (filters: StockListFilters) => ["stock", filters] as const,
  lowStock: ["stock", "low-stock"] as const,
  movements: (filters: MovementListFilters) => ["stock-movements", filters] as const,
};

export function useWarehouses() {
  return useQuery({
    queryKey: inventoryKeys.warehouses,
    queryFn: api.listWarehouses,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehouseInput) => api.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      toast.success("Warehouse created");
    },
    onError: () => toast.error("Couldn't create the warehouse."),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWarehouseInput }) =>
      api.updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      toast.success("Warehouse updated");
    },
    onError: () => toast.error("Couldn't save changes."),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      toast.success("Warehouse deleted");
    },
    onError: () => toast.error("Couldn't delete the warehouse."),
  });
}

export function useStock(filters: StockListFilters) {
  return useQuery({
    queryKey: inventoryKeys.stock(filters),
    queryFn: () => api.listStock(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.lowStock,
    queryFn: api.listLowStock,
    refetchInterval: 60_000, // low-stock is worth polling
  });
}

export function useStockMovements(filters: MovementListFilters) {
  return useQuery({
    queryKey: inventoryKeys.movements(filters),
    queryFn: () => api.listMovements(filters),
    placeholderData: keepPreviousData,
  });
}

function useMovementMutation(
  fn: (payload: StockMovementInput) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast.success(successMessage);
    },
    onError: () => toast.error("Couldn't record the stock movement."),
  });
}

export function useStockIn() {
  return useMovementMutation(api.stockIn, "Stock received");
}

export function useStockOut() {
  return useMovementMutation(api.stockOut, "Stock issued");
}

export function useStockAdjustment() {
  return useMovementMutation(api.stockAdjustment, "Stock adjusted");
}