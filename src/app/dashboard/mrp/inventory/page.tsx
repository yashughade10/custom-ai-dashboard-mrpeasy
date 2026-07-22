"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
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

export default function StockItemsPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpItems"],
    queryFn: () => mrpApi.getItems(1, 50),
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

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <MrpExportBar createLabel="Create item" />
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading items...</div>
            ) : (
              <MrpDataTable columns={columns} data={items} />
            )}
            
            <div className="mt-4 flex justify-center">
              <button className="text-blue-600 hover:underline text-sm font-medium">
                Load more
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
