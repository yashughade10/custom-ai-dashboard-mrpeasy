"use client";

import { ProductionReport } from "@/components/reports/ProductionReport";
import { RouteGuard } from "@/components/auth/RouteGuard";

function ProductionReportsPage() {
  return (
    <div className="p-6 w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Production Reports</h1>
        <p className="text-muted-foreground">Order statuses, manufacturing lead times, and efficiency metrics.</p>
      </div>
      <ProductionReport />
    </div>
  );
}

export default function ProductionReportsPageGuarded() {
  return (
    <RouteGuard module="reports">
      <ProductionReportsPage />
    </RouteGuard>
  );
}
