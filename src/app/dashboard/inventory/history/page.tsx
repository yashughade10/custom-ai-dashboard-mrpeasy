// app/dashboard/inventory/history/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StockHistoryTable } from "@/components/inventory/StockHistoryTable";
import { Suspense } from "react";

export default function StockHistoryPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/inventory"
          className="mb-1 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to inventory
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Stock movement history</h1>
        <p className="text-sm text-slate-500">
          Every stock-in, stock-out, and adjustment across all warehouses.
        </p>
      </div>

      <Suspense fallback={<div className="py-8 text-center text-slate-500">Loading history…</div>}>
        <StockHistoryTable />
      </Suspense>
    </div>
  );
}
