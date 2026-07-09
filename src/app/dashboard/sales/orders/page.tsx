// app/(dashboard)/sales/orders/page.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { SalesOrdersTable } from "@/components/sales-orders/SalesOrdersTable";
import { SalesOrderFormSheet } from "@/components/sales-orders/SalesOrderFormSheet";
import { useSalesOrders, useSalesOrder } from "@/hooks/use-sales-orders";
import type { SalesOrder, SalesOrderStatus } from "@/types/sales-order";
import { RouteGuard } from "@/components/auth/RouteGuard";

const STATUS_FILTERS: { label: string; value: SalesOrderStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In production", value: "in_production" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function SalesOrdersPage() {
  const [status, setStatus] = useState<SalesOrderStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { data: editingOrder } = useSalesOrder(editingId);

  const { data, isLoading } = useSalesOrders({
    status: status === "all" ? undefined : status,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 10,
  });

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (order: SalesOrder) => {
    setEditingId(order.id);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales orders</h1>
          <p className="text-sm text-slate-500">
            Track orders from confirmation through delivery.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New sales order
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as SalesOrderStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <SalesOrdersTable
        orders={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.meta.page} of {data.meta.total_pages} · {data.meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <SalesOrderFormSheet 
        open={formOpen} 
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingId(null);
        }} 
        salesOrder={editingOrder} 
      />
    </div>
  );
}

export default function SalesOrdersPageGuarded() {
  return (
    <RouteGuard module="sales">
      <SalesOrdersPage />
    </RouteGuard>
  );
}
