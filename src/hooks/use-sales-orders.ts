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
    onError: (err: any) => toast.error(err.message || "Couldn't create the sales order."),
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
    onError: (err: any) => toast.error(err.message || "Couldn't save changes."),
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
    onError: (err: any) => toast.error(err.message || "Only draft sales orders can be deleted."),
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.confirmSalesOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      if (order.requires_production) {
        toast.warning(
          `Sales order confirmed, but insufficient stock. Production required.`
        );
      } else {
        toast.success(`Sales order ${order.order_number} confirmed and allocated.`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Couldn't confirm the sales order."),
  });
}

export function usePackSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.packSalesOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales order ${order.order_number} packed and ready to ship.`);
    },
    onError: (err: any) => toast.error(err.message || "Couldn't pack the sales order."),
  });
}

export function useFulfillSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouse_id }: { id: number; warehouse_id: number }) => 
      api.fulfillSalesOrder(id, warehouse_id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales order ${order.order_number} shipped successfully!`);
    },
    onError: (err: any) => toast.error(err.message || "Couldn't ship the sales order."),
  });
}