"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "BOM", href: "/dashboard/mrp/production/bom" },
  { name: "Routings", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

export default function ManufacturingOrdersPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpManufacturingOrders"],
    queryFn: () => mrpApi.getManufacturingOrders(1, 50),
  });

  const columns: Column<any>[] = [
    { header: "MO number", accessorKey: "mo_number", sortable: true, searchable: true },
    { header: "Product", accessorKey: "product_name", searchable: true },
    { header: "Due date", accessorKey: "due_date", sortable: true },
    { header: "Status", accessorKey: "status", sortable: true },
    { header: "Quantity", accessorKey: "quantity" },
    { header: "Cost", accessorKey: "total_cost", sortable: true, cell: (r) => `$${Number(r.total_cost || 0).toFixed(2)}` },
    { header: "Customer order", accessorKey: "customer_order" }
  ];

  const items = response?.data || [];

  return (
    <RouteGuard module="production" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={productionTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <MrpExportBar createLabel="Create MO" />
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading manufacturing orders...</div>
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
