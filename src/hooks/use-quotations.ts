
// hooks/use-quotations.ts
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner"; // swap for LOT Trucks' existing toast import if different
import * as api from "@/lib/api/quotations";
import type {
  CreateQuotationInput,
  QuotationListFilters,
  SendQuotationInput,
  UpdateQuotationInput,
} from "@/types/quotation";

export const quotationKeys = {
  all: ["quotations"] as const,
  lists: () => [...quotationKeys.all, "list"] as const,
  list: (filters: QuotationListFilters) =>
    [...quotationKeys.lists(), filters] as const,
  details: () => [...quotationKeys.all, "detail"] as const,
  detail: (id: number) => [...quotationKeys.details(), id] as const,
};

export function useQuotations(filters: QuotationListFilters) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: () => api.listQuotations(filters),
    placeholderData: keepPreviousData,
  });
}

export function useQuotation(id: number | null) {
  return useQuery({
    queryKey: quotationKeys.detail(id ?? 0),
    queryFn: () => api.getQuotation(id as number),
    enabled: id !== null,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuotationInput) => api.createQuotation(payload),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast.success(`Quotation ${quotation.quote_number} created`);
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't create the quotation. Try again.";
      console.error("Create quotation error:", message);
      toast.error(message);
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateQuotationInput;
    }) => api.updateQuotation(id, payload),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(quotation.id),
      });
      toast.success(`Quotation ${quotation.quote_number} updated`);
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't save changes. Try again.";
      console.error("Update quotation error:", message);
      toast.error(message);
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast.success("Quotation deleted");
    },
    onError: (error: Error) => {
      const message = error.message || "Only draft quotations can be deleted.";
      console.error("Delete quotation error:", message);
      toast.error(message);
    },
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SendQuotationInput }) =>
      api.sendQuotation(id, payload),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(quotation.id),
      });
      toast.success(`Quotation ${quotation.quote_number} sent`);
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't send the quotation.";
      console.error("Send quotation error:", message);
      toast.error(message);
    },
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.approveQuotation(id),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(quotation.id),
      });
      toast.success(`Quotation ${quotation.quote_number} approved`);
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't approve the quotation.";
      console.error("Approve quotation error:", message);
      toast.error(message);
    },
  });
}

export function useConvertQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.convertQuotation(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast.success(`Converted to sales order ${result.order_number}`);
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't convert to a sales order.";
      console.error("Convert quotation error:", message);
      toast.error(message);
    },
  });
}

// ----- Lookup hooks for the form's selects -----

export function useCompanyOptions(search = "") {
  return useQuery({
    queryKey: ["companies", "options", search],
    queryFn: () => api.listCompanies(search),
    staleTime: 60_000,
  });
}

export function useContactOptions(search = "") {
  return useQuery({
    queryKey: ["contacts", "options", search],
    queryFn: () => api.listContacts(search),
    staleTime: 60_000,
  });
}

export function useDealOptions(search = "") {
  return useQuery({
    queryKey: ["deals", "options", search],
    queryFn: () => api.listDeals(search),
    staleTime: 60_000,
  });
}

export function useProductOptions(search = "") {
  return useQuery({
    queryKey: ["products", "options", search],
    queryFn: () => api.listProducts(search),
    staleTime: 60_000,
  });
}