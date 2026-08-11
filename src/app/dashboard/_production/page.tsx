"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductionOrders, fetchProducts } from "@/services/api";
import WorkProgressCards from "@/components/production/WorkProgressCards";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, ArrowRight, Factory, Package, ClipboardList } from "lucide-react";
import Link from "next/link";
import { RouteGuard } from "@/components/auth/RouteGuard";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const priorityConfig: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

function ProductionOverviewPage() {
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const orders = ordersData?.data || [];
  const products = productsData?.data || [];

  // Recent orders — last 5 non-completed
  const activeOrders = orders
    .filter((o: any) => o.status !== "completed" && o.status !== "cancelled")
    .slice(0, 5);

  const getProductName = (productId: number) => {
    const p = products.find((p: any) => p.id === productId);
    return p?.name || `Product #${productId}`;
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor production progress and manage orders at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/production/products" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Package className="h-4 w-4 mr-1.5" /> Products
          </Link>
          <Link href="/dashboard/production/bom" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ClipboardList className="h-4 w-4 mr-1.5" /> BOM
          </Link>
          <Link href="/dashboard/production/orders" className={buttonVariants({ size: "sm" })}>
            <Factory className="h-4 w-4 mr-1.5" /> Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <WorkProgressCards />

      {/* Active Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Active Orders</h2>
          <Link href="/dashboard/production/orders" className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1 text-muted-foreground" })}>
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading orders...
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <Factory className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active production orders. All caught up!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeOrders.map((order: any) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <Link
                  key={order.id}
                  href="/dashboard/production/orders"
                  className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{order.po_number}</span>
                      <p className="font-medium text-sm">{getProductName(order.product_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Qty: {parseFloat(order.quantity).toFixed(0)}</span>
                    <Badge className={`text-xs capitalize ${priorityConfig[order.priority] || priorityConfig.medium}`}>
                      {order.priority}
                    </Badge>
                    <Badge className={`text-xs capitalize ${status.color}`}>
                      {status.label}
                    </Badge>
                    {order.due_date && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Due: {new Date(order.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionOverviewPageGuarded() {
  return (
    <RouteGuard module="production">
      <ProductionOverviewPage />
    </RouteGuard>
  );
}
