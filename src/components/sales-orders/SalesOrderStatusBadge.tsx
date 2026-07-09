// components/sales-orders/SalesOrderStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SalesOrderStatus } from "@/types/sales-order";

const STATUS_STYLES: Record<SalesOrderStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-amber-50 text-amber-700 border-amber-200",
  allocated: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ready_to_ship: "bg-blue-50 text-blue-700 border-blue-200",
  in_production: "bg-purple-50 text-purple-700 border-purple-200",
  shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-indigo-50 text-indigo-700 border-indigo-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  allocated: "Allocated",
  ready_to_ship: "Ready to Ship",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function SalesOrderStatusBadge({ 
  status, 
  hasStockAvailable 
}: { 
  status: SalesOrderStatus;
  hasStockAvailable?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <Badge
        variant="outline"
        className={cn(STATUS_STYLES[status] || "bg-slate-100", "capitalize")}
      >
        {STATUS_LABELS[status] || status}
      </Badge>
      {status === "confirmed" && hasStockAvailable && (
        <span className="text-[10px] text-emerald-600 font-medium">Stock Ready</span>
      )}
      {status === "confirmed" && hasStockAvailable === false && (
        <span className="text-[10px] text-red-500 font-medium">Missing Stock</span>
      )}
    </div>
  );
}
