"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable } from "@/components/mrp/MrpDataTable";
import type { Column } from "@/components/mrp/MrpDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

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

export default function CriticalOnHandPage() {
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setLimit(50);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpCriticalStock", limit, debouncedFilters],
    queryFn: () => mrpApi.getCriticalOnHand(1, limit, "", debouncedFilters),
    placeholderData: keepPreviousData,
  });

  const items = response?.data || [];
  const total = response?.totalCount ?? 0;
  const hasMore = total > items.length;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };

  const columns: Column<any>[] = [
    { header: "Part No.", accessorKey: "part_no", sortable: true, searchable: true },
    { header: "Group number", accessorKey: "group_number", searchable: true },
    { header: "Group name", accessorKey: "group_name", searchable: true },
    { 
      header: "Available", 
      accessorKey: "available",
      cell: (r) => <span className="text-red-600 font-medium">{Number(r.available || 0).toLocaleString()} {r.uom || 'pcs'}</span>
    },
    { 
      header: "Expected, available", 
      accessorKey: "expected_available",
      cell: (r) => <span className="text-red-600 font-medium">{Number(r.expected_available || 0).toLocaleString()} {r.uom || 'pcs'}</span>
    },
    { 
      header: "Reorder point", 
      accessorKey: "reorder_point",
      cell: (r) => <span className="text-gray-900">{Number(r.reorder_point || 0).toLocaleString()} {r.uom || 'pcs'}</span>
    },
    { header: "Part description", accessorKey: "part_description", searchable: true },
    {
      header: "",
      accessorKey: "actions",
      cell: (r) => (
        r.is_procured_item ? (
          <Link href="/dashboard/mrp/procurement/create">
            <span className="text-[#1a73e8] hover:underline whitespace-nowrap text-xs">Create a purchase order</span>
          </Link>
        ) : (
          <Link href={`/dashboard/mrp/production?create=true&part_no=${encodeURIComponent(r.part_no)}`}>
            <span className="text-[#1a73e8] hover:underline whitespace-nowrap text-xs">Create a manufacturing order</span>
          </Link>
        )
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-medium text-gray-800">Critical on-hand</h1>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700"
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/critical/export/pdf`, "_blank")}
              >
                <FileText className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button 
                variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700"
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/critical/export/csv`, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative w-full p-4">
            {isFetching && (
              <div className="absolute top-2 right-6 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Searching...</span>
              </div>
            )}
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading critical items...</div>
            ) : (
              <>
                <MrpDataTable 
                  columns={columns} 
                  data={items} 
                  onFilterChange={setFilters}
                  className="w-full"
                />

                {items.length > 0 && (
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
                        (Showing {items.length} of {total.toLocaleString()} critical items)
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
  );
}
