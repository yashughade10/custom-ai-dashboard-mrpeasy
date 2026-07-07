// app/dashboard/inventory/page.tsx
"use client";

import Link from "next/link";
import { Warehouse as WarehouseIcon, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockTable } from "@/components/inventory/StockTable";
import { LowStockAlert } from "@/components/inventory/LowStockAlert";

export default function InventoryOverviewPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500">
            Track stock levels across warehouses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory/warehouses">
              <WarehouseIcon className="mr-1.5 h-4 w-4" />
              Warehouses
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory/history">
              <History className="mr-1.5 h-4 w-4" />
              Movement history
            </Link>
          </Button>
        </div>
      </div>

      <LowStockAlert />
      <StockTable />
    </div>
  );
}
