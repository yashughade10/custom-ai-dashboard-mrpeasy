"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Download, Upload } from "lucide-react";

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

export default function ShipmentsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isItemsTab = pathname.includes('/items');

  return (
    <RouteGuard module="inventory">
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between my-4">
              <h1 className="text-2xl text-[#1a2b49]">Shipments</h1>
              <div className="flex items-center gap-2">
                <Link href={isItemsTab ? "/dashboard/mrp/inventory/shipments/items/new" : "/dashboard/mrp/inventory/shipments/new"}>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                    + Create
                  </button>
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>

            {/* Sub-tabs for Shipments / Items */}
            <div className="flex border-b border-gray-200 mb-4">
              <Link 
                href="/dashboard/mrp/inventory/shipments"
                className={`py-2 px-4 text-sm font-medium border-b-2 ${!isItemsTab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Shipments
              </Link>
              <Link 
                href="/dashboard/mrp/inventory/shipments/items"
                className={`py-2 px-4 text-sm font-medium border-b-2 ${isItemsTab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Items
              </Link>
            </div>
            
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
