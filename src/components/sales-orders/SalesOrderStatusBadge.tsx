// components/sales-orders/SalesOrderStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SalesOrderStatus } from "@/types/sales-order";

const STATUS_STYLES: Record<SalesOrderStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_production: "bg-purple-50 text-purple-700 border-purple-200",
  shipped: "bg-amber-50 text-amber-700 border-amber-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function SalesOrderStatusBadge({ status }: { status: SalesOrderStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
