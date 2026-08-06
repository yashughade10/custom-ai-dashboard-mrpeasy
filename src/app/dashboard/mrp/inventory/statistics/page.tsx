"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable } from "@/components/mrp/MrpDataTable";
import type { Column } from "@/components/mrp/MrpDataTable";
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

export default function StatisticsPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpStockAging", filters],
    queryFn: () => mrpApi.getStockAging(1, 100, filters),
  });

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
      <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="font-medium text-gray-900">Statistics</span>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Stock aging</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <MrpDataTable 
            columns={columns} 
            data={response?.data || []} 
            searchPlaceholder="Search part number..."
            isLoading={isLoading}
            onFilterChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
}
