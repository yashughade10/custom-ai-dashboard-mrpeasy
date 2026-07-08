// hooks/use-sales-orders.ts
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api/sales-orders";
import type {
  CreateSalesOrderInput,
  SalesOrderListFilters,
  UpdateSalesOrderInput,
} from "@/types/sales-order";

export const salesOrderKeys = {
  all: ["sales-orders"] as const,
  lists: () => [...salesOrderKeys.all, "list"] as const,
  list: (filters: SalesOrderListFilters) => [...salesOrderKeys.lists(), filters] as const,
  detail: (id: number) => [...salesOrderKeys.all, "detail", id] as const,
};

export function useSalesOrders(filters: SalesOrderListFilters) {
  return useQuery({
    queryKey: salesOrderKeys.list(filters),
    queryFn: () => api.listSalesOrders(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSalesOrder(id: number | null) {
  return useQuery({
    queryKey: salesOrderKeys.detail(id ?? 0),
    queryFn: () => api.getSalesOrder(id as number),
    enabled: id !== null,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalesOrderInput) => api.createSalesOrder(payload),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success(`Sales order ${order.order_number} created`);
    },
    onError: () => toast.error("Couldn't create the sales order."),
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSalesOrderInput }) =>
      api.updateSalesOrder(id, payload),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales order ${order.order_number} updated`);
    },
    onError: () => toast.error("Couldn't save changes."),
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success("Sales order deleted");
    },
    onError: () => toast.error("Only draft sales orders can be deleted."),
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.confirmSalesOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales order ${order.order_number} confirmed`);
    },
    onError: () => toast.error("Couldn't confirm the sales order."),
  });
}