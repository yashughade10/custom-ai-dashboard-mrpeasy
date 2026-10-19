"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const stockTabs = [
  { name: "Items", href: "/dashboard/mrp/inventory" },
  { name: "Stock settings", href: "/dashboard/mrp/inventory/settings" },
  { name: "Stock lots", href: "/dashboard/mrp/inventory/lots" },
  { name: "Shipments", href: "/dashboard/mrp/inventory/shipments" },
  { name: "Inventory", href: "/dashboard/mrp/inventory/snapshot" },
  { name: "Critical on-hand", href: "/dashboard/mrp/inventory/critical" },
  { name: "Write-offs", href: "/dashboard/mrp/inventory/writeoffs" },
  { name: "Stock movement", href: "/dashboard/mrp/inventory/movement" },
  { name: "Statistics", href: "/dashboard/mrp/inventory/statistics" },
];

export default function StockLotsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initialFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      initialFilters[key] = value;
    });
    return initialFilters;
  });
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>(filters);
  const [debouncedRangeFilters, setDebouncedRangeFilters] = useState<Record<string, { min?: string; max?: string }>>(rangeFilters);

  // Debounce filters to avoid excessive requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setDebouncedRangeFilters(rangeFilters);
      setLimit(50); // Reset limit to 50 when filters change
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, rangeFilters]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpLots", limit, debouncedFilters, debouncedRangeFilters],
    queryFn: () => mrpApi.getLots(1, limit, "", debouncedFilters, debouncedRangeFilters),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => mrpApi.deleteLot(id),
    onSuccess: () => {
      toast.success("Lot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpLots"] });
    },
    onError: () => {
      toast.error("Failed to delete lot");
    }
  });

  const lots = response?.data || [];
  const totals = response?.totals;
  const pagination = response?.pagination;
  const total = pagination?.total ?? 0;
  const hasMore = pagination ? total > lots.length : lots.length >= limit;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const columns: Column<any>[] = [
    { 
      header: "Lot", 
      accessorKey: "lot_number", 
      sortable: true, 
      searchable: true,
      cell: (r) => (
        <Link href={`/dashboard/mrp/inventory/lots/${r.id}`} className="text-[#1a73e8] hover:underline">
          {r.lot_number}
        </Link>
      )
    },
    { header: "Storage location", accessorKey: "storage_location", searchable: true },
    { header: "Part No.", accessorKey: "part_no", searchable: true },
    { header: "Part description", accessorKey: "part_description", searchable: true },
    { header: "Unit cost", accessorKey: "unit_cost", filterType: "range", cell: (r) => `$${Number(r.unit_cost || 0).toFixed(2)}` },
    { header: "In stock", accessorKey: "in_stock", filterType: "range" },
    { header: "Available", accessorKey: "available", filterType: "range" },
    { header: "Booked", accessorKey: "booked", filterType: "range" },
    { header: "UoM", accessorKey: "uom" },
    { header: "Status", accessorKey: "status" },
    { header: "Available from", accessorKey: "available_from", filterType: "date", cell: (r) => r.available_from ? new Date(r.available_from).toLocaleDateString() : "" },
    {
      header: "",
      accessorKey: "actions",
      cell: (row) => (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this lot?")) {
              deleteMutation.mutate(row.id);
            }
          }}
          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
          title="Delete lot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Map the backend totals to the MrpDataTable totals prop
  const tableTotals = totals ? {
    in_stock: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_in_stock_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_in_stock_qty).toLocaleString('en-US')} units</span>
      </div>
    ),
    available: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_available_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_available_qty).toLocaleString('en-US')} units</span>
      </div>
    ),
    booked: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_booked_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_booked_qty).toLocaleString('en-US')} units</span>
      </div>
    )
  } : undefined;

  const getExportUrl = (format: "pdf" | "csv") => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api";
    const params = new URLSearchParams();
    if (Object.keys(debouncedFilters).length > 0) {
      params.append("filters", JSON.stringify(debouncedFilters));
    }
    if (Object.keys(debouncedRangeFilters).length > 0) {
      params.append("rangeFilters", JSON.stringify(debouncedRangeFilters));
    }
    const qs = params.toString();
    return `${base}/mrp/stock/lots/export/${format}${qs ? `?${qs}` : ""}`;
  };

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col w-full">
            <div className="flex items-center justify-between my-4">
              <h1 className="text-2xl text-[#1a2b49]">Stock lots</h1>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/mrp/inventory/lots/new">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                    + Create
                  </button>
                </Link>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200"
                  onClick={() => window.open(getExportUrl("pdf"), "_blank")}
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200"
                  onClick={() => window.open(getExportUrl("csv"), "_blank")}
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading lots...</div>
            ) : (
              <div className="flex flex-col relative w-full">
                {isFetching && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching...</span>
                  </div>
                )}
                <MrpDataTable 
                  data={lots} 
                  columns={columns} 
                  totals={tableTotals}
                  onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
                  className="w-full"
                />

                {lots.length > 0 && (
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
                        (Showing {lots.length} of {total.toLocaleString()} stock lots)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
