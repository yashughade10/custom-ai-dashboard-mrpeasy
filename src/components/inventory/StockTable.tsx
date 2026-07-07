// components/inventory/StockTable.tsx
"use client";

import { useState } from "react";
import { PackagePlus, PackageMinus, SlidersHorizontal } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useStock, useWarehouses } from "@/hooks/use-inventory";
import { StockMovementForm } from "./StockMovementForm";
import type { MovementType, StockItem } from "@/types/inventory";

export function StockTable() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [movement, setMovement] = useState<{
    item: StockItem;
    type: MovementType;
  } | null>(null);

  const { data: warehouses = [] } = useWarehouses();
  const { data, isLoading } = useStock({
    warehouse_id: warehouseId === "all" ? undefined : Number(warehouseId),
    search: search || undefined,
    limit: 50,
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All warehouses" />
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

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Reorder level</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Loading stock…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  No stock records found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const low = item.quantity <= item.reorder_level;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      {item.sku && (
                        <div className="text-xs text-slate-400">{item.sku}</div>
                      )}
                    </TableCell>
                    <TableCell>{item.warehouse_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={low ? "font-semibold text-red-600" : ""}>
                        {item.quantity}
                      </span>
                      {low && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-red-200 bg-red-50 text-red-700"
                        >
                          Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-500">
                      {item.reorder_level}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600"
                          title="Stock in"
                          onClick={() => setMovement({ item, type: "stock_in" })}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600"
                          title="Stock out"
                          onClick={() => setMovement({ item, type: "stock_out" })}
                        >
                          <PackageMinus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500"
                          title="Adjust"
                          onClick={() => setMovement({ item, type: "adjustment" })}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <StockMovementForm
        open={Boolean(movement)}
        onOpenChange={(open) => !open && setMovement(null)}
        stockItem={movement?.item}
        movementType={movement?.type ?? "stock_in"}
      />
    </div>
  );
}
