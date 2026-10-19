"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable } from "@/components/mrp/MrpDataTable";
import { Download, Search } from "lucide-react";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";

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

export default function WriteoffsPage() {
  const router = useRouter();
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});
  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [debouncedRangeFilters, setDebouncedRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedFilters(filters);
      setDebouncedRangeFilters(rangeFilters);
      setLimit(50);
    }, 300);
    return () => clearTimeout(handler);
  }, [search, filters, rangeFilters]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["mrpWriteoffs", limit, debouncedSearch, debouncedFilters, debouncedRangeFilters],
    queryFn: () => mrpApi.getWriteoffs(1, limit, debouncedSearch, debouncedFilters, debouncedRangeFilters),
    placeholderData: keepPreviousData,
  });

  const writeoffs = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totals = data?.totals;
  const hasMore = totalCount > writeoffs.length;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const columns = [
    { 
      accessorKey: "writeoff_number", 
      header: "Number",
      searchable: true,
      cell: (row: any) => (
        <span 
          className="text-blue-600 hover:underline cursor-pointer"
          onClick={() => router.push(`/dashboard/mrp/inventory/writeoffs/${row.writeoff_number}`)}
        >
          {row.writeoff_number}
        </span>
      )
    },
    { accessorKey: "part_no", header: "Part No.", searchable: true },
    { accessorKey: "part_description", header: "Part description", searchable: true },
    { accessorKey: "group_number", header: "Group number", searchable: true },
    { accessorKey: "group_name", header: "Group name", searchable: true },
    { accessorKey: "quantity", header: "Quantity", filterType: 'range' as const },
    { 
      accessorKey: "cost", 
      header: "Cost",
      filterType: 'range' as const,
      cell: (row: any) => `$${Number(row.cost).toFixed(2)}`
    },
    { 
      accessorKey: "created_date", 
      header: "Created",
      filterType: 'date' as const,
      cell: (row: any) => row.created_date ? format(new Date(row.created_date), "dd/MM/yyyy") : ""
    },
    { accessorKey: "status", header: "Status", searchable: true },
  ];

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <div className="flex justify-between items-center mb-6 mt-4">
              <h1 className="text-2xl font-semibold text-gray-900">Write-offs</h1>
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/writeoffs/export/pdf`, "_blank")}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/writeoffs/export/csv`, "_blank")}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search write-offs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="relative w-full">
                {isFetching && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching...</span>
                  </div>
                )}
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading write-offs...</div>
                ) : (
                  <>
                    <MrpDataTable 
                      data={writeoffs}
                      columns={columns}
                      onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
                      className="w-full"
                      totals={(() => {
                        const tableTotals = totals ? {
                          quantity: (
                            <div className="flex flex-col gap-0.5 text-xs text-left text-gray-700">
                              <span>{Number(totals.total_quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          ),
                          cost: (
                            <div className="flex flex-col gap-0.5 text-xs text-left text-gray-700">
                              <span>${Number(totals.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )
                        } : undefined;
                        return tableTotals;
                      })()}
                    />

                    {writeoffs.length > 0 && (
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
                        {totalCount > 0 && (
                          <span className="text-gray-400 text-xs">
                            (Showing {writeoffs.length} of {totalCount.toLocaleString()} write-offs)
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
