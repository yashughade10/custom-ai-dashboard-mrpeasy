"use client";

import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import React from "react";

const procurementTabs = [
  { name: "Purchase orders", href: "/dashboard/mrp/procurement", activePaths: ["/dashboard/mrp/procurement", "/dashboard/mrp/procurement/create"] },
  { name: "Vendors", href: "/dashboard/mrp/procurement/vendors" },
  { name: "Invoices", href: "/dashboard/mrp/procurement/invoices" },
  { name: "Forecasting", href: "/dashboard/mrp/procurement/forecasting" },
  { name: "Critical on-hand", href: "/dashboard/mrp/procurement/critical" },
  { name: "Requirements", href: "/dashboard/mrp/procurement/requirements" },
  { name: "Statistics", href: "/dashboard/mrp/procurement/statistics" },
];

export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard module="procurement" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={procurementTabs} />
          
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
