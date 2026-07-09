"use client";

import { FinanceReport } from "@/components/reports/FinanceReport";
import { RouteGuard } from "@/components/auth/RouteGuard";

function FinanceReportsPage() {
  return (
    <div className="p-6 w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Finance Reports</h1>
        <p className="text-muted-foreground">Aging receivables, payables, and outstanding balances.</p>
      </div>
      <FinanceReport />
    </div>
  );
}

export default function FinanceReportsPageGuarded() {
  return (
    <RouteGuard module="reports">
      <FinanceReportsPage />
    </RouteGuard>
  );
}
