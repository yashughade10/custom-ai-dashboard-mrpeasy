"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;
  
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min?: string; max?: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["mrpWriteoffs", page, search, filters, rangeFilters],
    queryFn: () => mrpApi.getWriteoffs(page, limit, search, filters, rangeFilters),
  });

  const writeoffs = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const totals = data?.totals;

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
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <div className="flex justify-between items-center mb-6 mt-4">
              <h1 className="text-2xl font-semibold text-gray-900">Write-offs</h1>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search write-offs..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <MrpDataTable 
                data={writeoffs}
                columns={columns}
                isLoading={isLoading}
                onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
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

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages} ({totalCount} total)</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
