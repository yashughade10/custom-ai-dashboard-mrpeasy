"use client";

import { useState, useRef, useEffect } from "react";
import ProductionOrdersTable from "@/components/production/ProductionOrdersTable";
import ProductionKanbanBoard from "@/components/production/ProductionKanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Kanban } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";

function ProductionOrdersPage() {
  const [view, setView] = useState<"table" | "kanban">("kanban");
  const openCreateRef = useRef<((defaults?: any) => void) | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("new=true")) {
      const params = new URLSearchParams(window.location.search);
      const defaults = {
        po_number: params.get("po_number") || "",
        product_id: params.get("product_id") || "",
        quantity: params.get("quantity") || "",
      };
      setTimeout(() => {
        openCreateRef.current?.(defaults);
      }, 100);
    }
  }, []);

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Orders</h1>
          <p className="text-sm text-muted-foreground">
            {view === "kanban"
              ? "Drag & drop to update order status, or switch to list view."
              : "View and manage production orders in a table, or switch to board view."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "kanban"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => openCreateRef.current?.()}>
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <ProductionKanbanBoard onOpenCreate={(fn) => { openCreateRef.current = fn; }} />
      ) : (
        <ProductionOrdersTable onOpenCreate={(fn) => { openCreateRef.current = fn; }} />
      )}
    </div>
  );
}

export default function ProductionOrdersPageGuarded() {
  return (
    <RouteGuard module="production">
      <ProductionOrdersPage />
    </RouteGuard>
  );
}
