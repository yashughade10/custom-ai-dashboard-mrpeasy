"use client";

import { useState } from "react";
import PurchaseOrdersTable from "@/components/procurement/PurchaseOrdersTable";
import ProcurementItemsTable from "@/components/procurement/ProcurementItemsTable";

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "items">("orders");

  return (
    <div className="px-4 pb-4 pt-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-[22px] font-normal text-gray-800 m-0">Purchase orders</h1>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "orders" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Purchase orders
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "items" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Items
        </button>
      </div>

      {activeTab === "orders" ? <PurchaseOrdersTable /> : <ProcurementItemsTable />}
    </div>
  );
}
