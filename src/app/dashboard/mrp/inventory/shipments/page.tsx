"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import Link from "next/link";
import { Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ShipmentsPage() {
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [debouncedRangeFilters, setDebouncedRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setDebouncedRangeFilters(rangeFilters);
      setLimit(50);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, rangeFilters]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpShipments", limit, debouncedFilters, debouncedRangeFilters],
    queryFn: () => mrpApi.getShipments(1, limit, "", debouncedFilters, debouncedRangeFilters),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => mrpApi.deleteShipment(id),
    onSuccess: () => {
      toast.success("Shipment deleted");
      queryClient.invalidateQueries({ queryKey: ["mrpShipments"] });
    },
    onError: () => toast.error("Failed to delete shipment")
  });

  const shipments = response?.data || [];
  const pagination = response?.pagination;
  const total = pagination?.total ?? 0;
  const hasMore = pagination ? total > shipments.length : shipments.length >= limit;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const columns: Column<any>[] = [
    { 
      header: "Number", 
      accessorKey: "shipment_number", 
      sortable: true, 
      searchable: true,
      cell: (r) => (
        <Link href={`/dashboard/mrp/inventory/shipments/${r.id}`} className="text-[#1a73e8] hover:underline">
          {r.shipment_number}
        </Link>
      )
    },
    { 
      header: "Created", 
      accessorKey: "created_date", 
      filterType: "date",
      cell: (r) => r.created_date ? new Date(r.created_date).toLocaleDateString() : "" 
    },
    { 
      header: "Delivery date", 
      accessorKey: "delivery_date", 
      filterType: "date",
      cell: (r) => r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "" 
    },
    { header: "Status", accessorKey: "status", searchable: true },
    { header: "Order", accessorKey: "order_number", searchable: true },
    { header: "Customer number", accessorKey: "customer_number", searchable: true },
    { header: "Customer name", accessorKey: "customer_name", searchable: true },
    {
      header: "",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/mrp/inventory/shipments/${row.id}`}>
            <button className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit shipment">
              <Edit className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this shipment?")) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="text-gray-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete shipment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading shipments...</div>;
  }

  return (
    <div className="flex flex-col relative w-full">
      {isFetching && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
          <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          <span>Searching...</span>
        </div>
      )}
      <MrpDataTable 
        data={shipments} 
        columns={columns} 
        onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
        className="w-full"
      />

      {shipments.length > 0 && (
        <div className="mt-4 mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 py-3">
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isFetching}
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none py-1.5 px-4 rounded transition-colors inline-flex items-center gap-2"
            >
              {isFetching && limit > 50 ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading more...</span>
                </>
              ) : (
                "Load more"
              )}
            </button>
          )}
          {total > 0 && (
            <span className="text-gray-400 text-xs">
              (Showing {shipments.length} of {total.toLocaleString()} shipments)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
