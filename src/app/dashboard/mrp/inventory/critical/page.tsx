"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCriticalStock", filters],
    queryFn: () => mrpApi.getCriticalOnHand(1, 100, filters),
  });

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
      <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-medium text-gray-800">Critical on-hand</h1>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700">
                <FileText className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700">
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <MrpDataTable 
              columns={columns} 
              data={response?.data || []} 
              searchPlaceholder="Search critical items..."
              isLoading={isLoading}
              onFilterChange={setFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
