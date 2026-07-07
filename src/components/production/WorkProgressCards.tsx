"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductionOrders } from "@/services/api";
import { Loader2, Clock, Cog, Trophy, XCircle, Factory } from "lucide-react";

const cardConfig = [
  { key: "pending", label: "Pending", icon: Clock, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "in_progress", label: "In Progress", icon: Cog, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "completed", label: "Completed", icon: Trophy, gradient: "from-emerald-500 to-green-500", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, gradient: "from-red-500 to-rose-500", bgLight: "bg-red-50 dark:bg-red-950/30" },
];

export default function WorkProgressCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  });

  const orders = data?.data || [];

  const counts: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  orders.forEach((o: any) => {
    const status = o.status || "pending";
    if (counts[status] !== undefined) counts[status]++;
  });

  const total = orders.length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardConfig.map((c) => (
          <div key={c.key} className="rounded-xl border bg-card p-5 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded mb-3" />
            <div className="h-8 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfig.map((c) => {
        const Icon = c.icon;
        const count = counts[c.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div
            key={c.key}
            className={`relative overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-md ${c.bgLight}`}
          >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${c.gradient} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight">{count}</span>
              <span className="text-xs text-muted-foreground mb-1">
                {pct}% of total
              </span>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
