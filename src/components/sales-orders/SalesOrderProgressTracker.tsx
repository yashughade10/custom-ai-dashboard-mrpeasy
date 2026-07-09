// components/sales-orders/SalesOrderProgressTracker.tsx
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SALES_ORDER_FLOW, type SalesOrderStatus } from "@/types/sales-order";

const STEP_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  in_production: "In production",
  allocated: "Allocated",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function SalesOrderProgressTracker({ status }: { status: SalesOrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        <X className="h-4 w-4" />
        This order was cancelled
      </div>
    );
  }

  const currentIndex = SALES_ORDER_FLOW.indexOf(status);

  return (
    <div className="flex items-center">
      {SALES_ORDER_FLOW.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === SALES_ORDER_FLOW.length - 1;

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isComplete && "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent && "border-blue-500 bg-blue-500 text-white",
                  !isComplete && !isCurrent && "border-slate-200 bg-white text-slate-400",
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs",
                  isCurrent ? "font-medium text-slate-900" : "text-slate-400",
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  isComplete ? "bg-emerald-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
