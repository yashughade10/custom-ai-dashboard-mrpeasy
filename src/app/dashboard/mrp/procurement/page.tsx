"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";

const procurementTabs = [
  { name: "Purchase orders", href: "/dashboard/mrp/procurement" },
  { name: "Vendors", href: "/dashboard/mrp/procurement/vendors" },
  { name: "Invoices", href: "/dashboard/mrp/procurement/invoices" },
  { name: "Forecasting", href: "/dashboard/mrp/procurement/forecasting" },
  { name: "Critical on-hand", href: "/dashboard/mrp/procurement/critical" },
  { name: "Requirements", href: "/dashboard/mrp/procurement/requirements" },
  { name: "Statistics", href: "/dashboard/mrp/procurement/statistics" },
];

export default function PurchaseOrdersPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpPurchaseOrders"],
    queryFn: () => mrpApi.getPurchaseOrders(1, 50),
  });

  const columns: Column<any>[] = [
    { header: "Number", accessorKey: "po_number", sortable: true, searchable: true },
    { header: "Vendor", accessorKey: "vendor_name", searchable: true },
    { header: "Created date", accessorKey: "created_date", sortable: true },
    { header: "Expected date", accessorKey: "expected_date", sortable: true },
    { header: "Status", accessorKey: "status", sortable: true },
    { header: "Invoice status", accessorKey: "invoice_status" },
    { header: "Payment status", accessorKey: "payment_status" },
    { header: "Total quantity", accessorKey: "total_quantity" },
    { header: "Total", accessorKey: "total", sortable: true, cell: (r) => `$${Number(r.total || 0).toFixed(2)}` },
  ];

  const items = response?.data || [];

  return (
    <RouteGuard module="procurement" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={procurementTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <MrpExportBar createLabel="Create PO" />
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading purchase orders...</div>
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
