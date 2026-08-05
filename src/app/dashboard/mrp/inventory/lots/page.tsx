"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { useRouter } from "next/navigation";
import { Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

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

export default function StockLotsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpLots"],
    queryFn: () => mrpApi.getLots(1, 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => mrpApi.deleteLot(id),
    onSuccess: () => {
      toast.success("Lot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpLots"] });
    },
    onError: () => {
      toast.error("Failed to delete lot");
    }
  });

  const lots = response?.data || [];
  const totals = response?.totals;

  const columns: Column<any>[] = [
    { header: "Lot", accessorKey: "lot_number", sortable: true, searchable: true },
    { header: "Storage location", accessorKey: "storage_location", searchable: true },
    { header: "Part No.", accessorKey: "part_no", searchable: true },
    { header: "Part description", accessorKey: "part_description", searchable: true },
    { header: "Unit cost", accessorKey: "unit_cost", filterType: "range", cell: (r) => `$${Number(r.unit_cost || 0).toFixed(2)}` },
    { header: "In stock", accessorKey: "in_stock", filterType: "range" },
    { header: "Available", accessorKey: "available", filterType: "range" },
    { header: "Booked", accessorKey: "booked", filterType: "range" },
    { header: "UoM", accessorKey: "uom" },
    { header: "Status", accessorKey: "status" },
    { header: "Available from", accessorKey: "available_from", filterType: "date", cell: (r) => r.available_from ? new Date(r.available_from).toLocaleDateString() : "" },
    {
      header: "",
      accessorKey: "actions",
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this lot?")) {
              deleteMutation.mutate(row.id);
            }
          }}
          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
          title="Delete lot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Map the backend totals to the MrpDataTable totals prop
  const tableTotals = totals ? {
    in_stock: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_in_stock_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_in_stock_qty).toLocaleString('en-US')} units</span>
      </div>
    ),
    available: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_available_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_available_qty).toLocaleString('en-US')} units</span>
      </div>
    ),
    booked: (
      <div className="flex flex-col gap-0.5 text-xs text-left">
        <span>${Number(totals.total_booked_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{Number(totals.total_booked_qty).toLocaleString('en-US')} units</span>
      </div>
    )
  } : undefined;

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <div className="flex items-center justify-between my-4">
              <h1 className="text-2xl text-[#1a2b49]">Stock lots</h1>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                  + Create
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  Move stock item
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Upload className="w-4 h-4" /> Import from CSV
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading lots...</div>
            ) : (
              <MrpDataTable 
                data={lots} 
                columns={columns} 
                totals={tableTotals}
              />
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
