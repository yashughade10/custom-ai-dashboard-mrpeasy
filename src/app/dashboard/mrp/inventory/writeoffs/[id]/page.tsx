"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { mrpApi } from "@/services/mrpApi";
import { ArrowLeft, Trash2, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { use } from "react";

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

export default function WriteoffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: writeoff_number } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["mrpWriteoffDetail", writeoff_number],
    queryFn: () => mrpApi.getWriteoffDetails(writeoff_number),
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteWriteoff(writeoff_number),
    onSuccess: () => {
      toast.success("Write-off deleted and stock restored successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpWriteoffs"] });
      queryClient.invalidateQueries({ queryKey: ["mrpInventorySnapshot"] });
      router.push("/dashboard/mrp/inventory/writeoffs");
    },
    onError: () => {
      toast.error("Failed to delete write-off");
    }
  });

  if (isLoading) return <div className="p-8">Loading write-off...</div>;
  if (!data?.data) return <div className="p-8">Write-off not found.</div>;

  const wo = data.data;

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-10 py-6 flex-1 bg-gray-50/50">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Write-off {wo.writeoff_number}</h1>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Button variant="outline" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700">Save</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if(confirm("Are you sure you want to delete this write-off? The deducted stock will be restored to your inventory.")) {
                    deleteMutation.mutate();
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 grid grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Number *</label>
                  <div className="col-span-2">
                    <input type="text" value={wo.writeoff_number} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Status</label>
                  <div className="col-span-2 text-sm font-medium">{wo.status || 'Valid'}</div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Product group</label>
                  <div className="col-span-2 text-sm font-medium">{wo.group_name}</div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Stock item *</label>
                  <div className="col-span-2 text-sm font-semibold">{wo.part_description} ({wo.part_no})</div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Type</label>
                  <div className="col-span-2 text-sm font-medium">{wo.notes || 'Manual write-off'}</div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Created by</label>
                  <div className="col-span-2 text-sm font-medium">System</div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm text-gray-500 text-right">Created *</label>
                  <div className="col-span-2">
                    <input type="text" value={wo.created_date ? format(new Date(wo.created_date), "dd/MM/yyyy") : ''} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-start gap-4">
                  <label className="text-sm text-gray-500 text-right pt-2">Note</label>
                  <div className="col-span-2">
                    <textarea disabled className="w-full h-24 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-sm" value={wo.notes} />
                  </div>
                </div>
              </div>

              {/* Stock Table */}
              <div className="col-span-2 mt-8">
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm text-gray-500 w-[120px] text-right">Stock</label>
                  <div className="flex-1 overflow-hidden rounded-md border border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 font-medium">Lot</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Storage location</th>
                          <th className="px-4 py-2 font-medium">Unit cost</th>
                          <th className="px-4 py-2 font-medium">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {wo.items && wo.items.length > 0 ? (
                          wo.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium text-gray-900">{item.lot_number}</td>
                              <td className="px-4 py-2 text-gray-600">{item.original_lot_status}</td>
                              <td className="px-4 py-2 text-gray-600">{format(new Date(item.created_at), "dd/MM/yyyy")}</td>
                              <td className="px-4 py-2 text-gray-600">{item.storage_location}</td>
                              <td className="px-4 py-2 text-gray-600">${Number(item.unit_cost).toFixed(2)}</td>
                              <td className="px-4 py-2 text-gray-900">{item.deducted_quantity}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No lots found for this write-off.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-6">
              <Button variant="outline" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700">Save</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if(confirm("Are you sure you want to delete this write-off? The deducted stock will be restored to your inventory.")) {
                    deleteMutation.mutate();
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
