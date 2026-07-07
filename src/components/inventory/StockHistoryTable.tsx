// components/inventory/StockHistoryTable.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useStockMovements, useWarehouses } from "@/hooks/use-inventory";
import type { MovementType } from "@/types/inventory";

const TYPE_STYLES: Record<MovementType, string> = {
  stock_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  stock_out: "bg-amber-50 text-amber-700 border-amber-200",
  adjustment: "bg-slate-100 text-slate-700 border-slate-200",
};

const TYPE_LABELS: Record<MovementType, string> = {
  stock_in: "Stock in",
  stock_out: "Stock out",
  adjustment: "Adjustment",
};

export function StockHistoryTable() {
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("product_id");
  const productId = productIdParam ? Number(productIdParam) : undefined;

  const [warehouseId, setWarehouseId] = useState("all");
  const [type, setType] = useState<MovementType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: warehouses = [] } = useWarehouses();
  const { data, isLoading } = useStockMovements({
    product_id: productId,
    warehouse_id: warehouseId === "all" ? undefined : Number(warehouseId),
    movement_type: type === "all" ? undefined : type,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    limit: 50,
  });

  const movements = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Warehouse</label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Type</label>
          <Select value={type} onValueChange={(v) => setType(v as MovementType | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="stock_in">Stock in</SelectItem>
              <SelectItem value="stock_out">Stock out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Loading history…
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(m.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{m.product_name}</TableCell>
                  <TableCell>{m.warehouse_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TYPE_STYLES[m.movement_type]}>
                      {TYPE_LABELS[m.movement_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {m.movement_type === "stock_out" ? "-" : m.movement_type === "stock_in" ? "+" : ""}
                    {Math.abs(m.quantity)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {m.reference ?? m.reason ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {m.performed_by ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
