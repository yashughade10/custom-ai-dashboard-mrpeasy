// components/inventory/LowStockAlert.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLowStock } from "@/hooks/use-inventory";

export function LowStockAlert() {
  const { data: lowStock = [], isLoading } = useLowStock();

  if (isLoading) return null;

  if (lowStock.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-emerald-700">
          All stock levels are healthy — nothing below reorder point.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          {lowStock.length} item{lowStock.length === 1 ? "" : "s"} low on stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lowStock.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm"
          >
            <div>
              <span className="font-medium">{item.product_name}</span>
              <span className="ml-2 text-slate-400">{item.warehouse_name}</span>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
              {item.quantity} / {item.reorder_level}
            </Badge>
          </div>
        ))}
        {lowStock.length > 6 && (
          <p className="pt-1 text-xs text-amber-700">
            +{lowStock.length - 6} more below reorder level
          </p>
        )}
      </CardContent>
    </Card>
  );
}
