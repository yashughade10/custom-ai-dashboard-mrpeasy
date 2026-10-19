"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable } from "@/components/mrp/MrpDataTable";
import type { Column } from "@/components/mrp/MrpDataTable";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

export default function StatisticsPage() {
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
    queryKey: ["mrpStockAging", limit, debouncedFilters],
    queryFn: () => mrpApi.getStockAging(1, limit, "", debouncedFilters),
    placeholderData: keepPreviousData,
  });

  const data = response?.data || [];
  const total = response?.totalCount ?? 0;
  const hasMore = total > data.length;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 50);
  };
  
  // Prepare top 10 data for chart
  const chartData = data.slice(0, 10).map((item: any) => ({
    name: item.part_no,
    days: item.unused_days
  }));

  const columns: Column<any>[] = [
    { header: "Part No.", accessorKey: "part_no", sortable: true, searchable: true },
    { header: "Name", accessorKey: "part_description", searchable: true },
    { header: "Group number", accessorKey: "group_number", searchable: true },
    { header: "Group name", accessorKey: "group_name", searchable: true },
    { 
      header: "Unused days", 
      accessorKey: "unused_days", 
      sortable: true,
      cell: (r) => <span className="font-medium text-gray-800">{r.unused_days}</span> 
    },
    { 
      header: "Lots", 
      accessorKey: "lots",
      cell: (r) => (
        <Link 
          href={`/dashboard/mrp/inventory/lots?part_no=${encodeURIComponent(r.part_no)}`}
          className="text-[#1a73e8] hover:underline"
        >
          Lots
        </Link>
      )
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="font-medium text-gray-900">Statistics</span>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Stock aging</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {chartData.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Top 10 Aging Items (Days)</h3>
              <div className="h-48 w-full max-w-4xl">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="days" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} name="Unused Days" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col relative w-full p-4">
            {isFetching && (
              <div className="absolute top-2 right-6 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Searching...</span>
              </div>
            )}
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading aging report...</div>
            ) : (
              <>
                <MrpDataTable 
                  columns={columns} 
                  data={data} 
                  onFilterChange={setFilters}
                  className="w-full"
                />

                {data.length > 0 && (
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
                        (Showing {data.length} of {total.toLocaleString()} aging items)
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
