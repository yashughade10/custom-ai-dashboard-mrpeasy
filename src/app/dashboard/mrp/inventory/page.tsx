"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

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

export default function StockItemsPage() {
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [debouncedRangeFilters, setDebouncedRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  const router = useRouter();

  // Debounce filters so user can type smoothly before sending request
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setDebouncedRangeFilters(rangeFilters);
      setLimit(50); // Reset limit to 50 when filters change
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, rangeFilters]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpItems", limit, debouncedFilters, debouncedRangeFilters],
    queryFn: () => mrpApi.getItems(1, limit, "", debouncedFilters, debouncedRangeFilters),
    placeholderData: keepPreviousData,
  });

  const columns: Column<any>[] = [
    { header: "Part No.", accessorKey: "part_no", sortable: true, searchable: true },
    { header: "Part description", accessorKey: "part_description", searchable: true },
    { header: "Group number", accessorKey: "group_number", searchable: true },
    { header: "Group name", accessorKey: "group_name", searchable: true },
    { header: "In stock", accessorKey: "in_stock", sortable: true },
    { header: "Available", accessorKey: "available", sortable: true },
    { header: "Booked", accessorKey: "booked", sortable: true },
    { header: "Expected available", accessorKey: "expected_available", sortable: true },
    { header: "Reorder point", accessorKey: "reorder_point" },
    { header: "UoM", accessorKey: "uom" },
    { header: "Cost", accessorKey: "cost", sortable: true, cell: (r) => `$${Number(r.cost || 0).toFixed(4)}` },
    { header: "Selling price", accessorKey: "selling_price", cell: (r) => `$${Number(r.selling_price || 0).toFixed(4)}` }
  ];

  const items = response?.data || [];
  const pagination = response?.pagination;
  const total = pagination?.total ?? 0;
  const hasMore = pagination ? total > items.length : items.length >= limit;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const getExportUrl = (format: "pdf" | "csv") => {
    const params = new URLSearchParams();
    if (Object.keys(debouncedFilters).length > 0) {
      params.append("filters", JSON.stringify(debouncedFilters));
    }
    if (Object.keys(debouncedRangeFilters).length > 0) {
      params.append("rangeFilters", JSON.stringify(debouncedRangeFilters));
    }
    const qs = params.toString();
    return `${API_BASE}/mrp/stock/items/export/${format}${qs ? `?${qs}` : ""}`;
  };

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col flex-1 min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col min-h-0">
            <MrpExportBar 
              createLabel="Create item" 
              onCreate={() => router.push("/dashboard/mrp/inventory/new")}
              onDownloadPDF={() => window.open(getExportUrl("pdf"), "_blank")}
              onDownloadCSV={() => window.open(getExportUrl("csv"), "_blank")}
            />
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading items...</div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col relative">
                {isFetching && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                    <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching...</span>
                  </div>
                )}
                <MrpDataTable 
                  columns={columns} 
                  data={items} 
                  onRowClick={(row: any) => router.push(`/dashboard/mrp/inventory/${row.id}`)}
                  onFilterChange={(f, rf) => {
                    setFilters(f);
                    setRangeFilters(rf);
                  }}
                  className="flex-1 min-h-[420px] max-h-[calc(100vh-270px)] overflow-auto"
                />
              </div>
            )}
            
            {items.length > 0 && (
              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2 shrink-0 py-1">
                {hasMore ? (
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
                ) : (
                  <span className="text-gray-400 text-xs font-medium">No more items</span>
                )}
                {total > 0 && (
                  <span className="text-gray-400 text-xs">
                    (Showing {items.length} of {total.toLocaleString()} items)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
