"use client";

import { RouteGuard } from "@/components/auth/RouteGuard";
import { mrpApi } from "@/services/mrpApi";
import { useQuery } from "@tanstack/react-query";
import { MrpKpiCard } from "@/components/mrp/MrpKpiCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_WIDGETS = [
  { id: "lateCO", label: "Late CO", href: "/dashboard/mrp/crm" },
  { id: "lateMO", label: "Late MO", href: "/dashboard/mrp/production" },
  { id: "latePO", label: "Late PO", href: "/dashboard/mrp/procurement" },
  { id: "itemsBelowReorder", label: "Items below reorder point", href: "/dashboard/mrp/inventory/critical" },
  { id: "lateInvoices", label: "7 Days Late Invoices", href: "/dashboard/mrp/crm/invoices" },
  { id: "coReady", label: "CO ready to ship", href: "/dashboard/mrp/crm" },
  { id: "moInProgress", label: "MO in progress", href: "/dashboard/mrp/production" },
  { id: "moReady", label: "MO ready to start", href: "/dashboard/mrp/production" },
  { id: "oee", label: "OEE" },
  { id: "teep", label: "TEEP" },
  { id: "sales", label: "Sales" },
  { id: "stock", label: "Stock" },
  { id: "cashFlow", label: "Cash flow" },
  { id: "purchasesOnTime", label: "Purchases on time" },
  { id: "manufacturingOnTime", label: "Manufacturing on time" },
  { id: "deliveriesOnTime", label: "Deliveries on time" },
  { id: "awaitingInspection", label: "Awaiting inspection" },
  { id: "rejectionRate", label: "Rejection rate" },
  { id: "cashFlowForecast", label: "Cash flow forecast" }
];

const DEFAULT_WIDGETS = ALL_WIDGETS.map(w => w.id).filter(id => id !== "cashFlowForecast");

function DashboardPage() {
  const {
    data: response,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["mrpDashboard"],
    queryFn: mrpApi.getDashboardData,
  });

  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("mrp_visible_widgets");
    if (saved) {
      try {
        setVisibleWidgets(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleWidget = (id: string) => {
    setVisibleWidgets(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem("mrp_visible_widgets", JSON.stringify(next));
      return next;
    });
  };

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">Failed to load dashboard data.</div>;

  const data = response?.data || {};

  const widgetData: Record<string, string | number> = {
    lateCO: data.lateCO,
    lateMO: data.lateMO,
    latePO: data.latePO,
    itemsBelowReorder: data.itemsBelowReorder,
    lateInvoices: data.lateInvoices,
    coReady: data.coReady,
    moInProgress: data.moInProgress,
    moReady: data.moReady,
    oee: `${data.oee ?? 0}%`,
    teep: `${data.teep ?? 0}%`,
    sales: `$ ${Number(data.sales || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    stock: `$ ${Number(data.stock || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    cashFlow: `$ ${Number(data.cashFlow || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    purchasesOnTime: `${data.purchasesOnTime ?? 0}%`,
    manufacturingOnTime: `${data.manufacturingOnTime ?? 0}%`,
    deliveriesOnTime: `${data.deliveriesOnTime ?? 0}%`,
    awaitingInspection: data.awaitingInspection || 0,
    rejectionRate: data.rejectionRate !== null && data.rejectionRate !== undefined ? `${data.rejectionRate}%` : "No data",
    cashFlowForecast: "No data"
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] p-6 -m-4 sm:-m-6 lg:-m-8 pt-8 min-h-[calc(100vh-4rem)]">
      {isClient && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-4">
          {ALL_WIDGETS.filter(w => visibleWidgets.includes(w.id)).map(widget => (
            <MrpKpiCard 
              key={widget.id} 
              title={widget.label} 
              value={widgetData[widget.id]} 
              href={widget.href} 
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Dialog>
          <DialogTrigger>
            <Button variant="outline" className="text-blue-600 border-blue-600 font-medium">
              + Customize dashboard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose widgets</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {ALL_WIDGETS.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md">
                  <span className="text-sm font-medium">{widget.label}</span>
                  <Checkbox 
                    checked={visibleWidgets.includes(widget.id)}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function DashboardPageGuarded() {
  return (
    <RouteGuard module="dashboard" fallback={<div>Access Denied</div>}>
      <DashboardPage />
    </RouteGuard>
  );
}
