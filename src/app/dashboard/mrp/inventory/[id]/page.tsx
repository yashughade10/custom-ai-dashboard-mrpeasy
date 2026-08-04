"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ItemForm } from "@/components/mrp/ItemForm";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";

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

export default function EditItemPage() {
  const params = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItem() {
      try {
        const id = params.id as string;
        const res = await mrpApi.getItemById(id);
        if (res.success) {
          // Convert some numbers/booleans if needed based on what the form expects
          const item = res.data;
          
          // Ensure checkbox boolean parsing is accurate since mysql might return 1/0
          item.is_procured_item = Boolean(item.is_procured_item);
          item.not_for_sale = Boolean(item.not_for_sale);
          item.standalone_mo = Boolean(item.standalone_mo);

          setInitialData(item);
        } else {
          setError(res.error || "Failed to load item");
        }
      } catch (err) {
        setError("Error connecting to API");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadItem();
  }, [params.id]);

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="px-4 pb-4 flex-1">
          <div className="mb-4 mt-2">
            <h1 className="text-xl font-medium text-gray-800">
              {isLoading ? "Loading item..." : `Item ${initialData?.part_no || ""} details`}
            </h1>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading item details...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <ItemForm initialData={initialData} isEdit={true} />
          )}
        </div>
      </div>
    </div>
  );
}
