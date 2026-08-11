"use client";

import { InventoryReport } from "@/components/reports/InventoryReport";
import { RouteGuard } from "@/components/auth/RouteGuard";

function InventoryReportsPage() {
  return (
    <div className="p-6 w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
        <p className="text-muted-foreground">Stock levels, turnover rates, and inventory valuation.</p>
      </div>
      <InventoryReport />
    </div>
  );
}

export default function InventoryReportsPageGuarded() {
  return (
    <RouteGuard module="reports">
      <InventoryReportsPage />
    </RouteGuard>
  );
}
