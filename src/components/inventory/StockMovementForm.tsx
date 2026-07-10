// components/inventory/StockMovementForm.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/services/api";

import { useStockAdjustment, useStockIn, useStockOut, useWarehouses } from "@/hooks/use-inventory";
import type { MovementType, StockItem } from "@/types/inventory";

const TITLES: Record<MovementType, string> = {
  stock_in: "Receive stock",
  stock_out: "Issue stock",
  adjustment: "Adjust stock",
};

interface StockMovementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem?: StockItem;
  movementType: MovementType;
}

export function StockMovementForm({
  open,
  onOpenChange,
  stockItem,
  movementType,
}: StockMovementFormProps) {
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  
  // For direct stock-in
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const { data: warehouses = [] } = useWarehouses();
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
    enabled: open && !stockItem,
  });
  const products = productsData?.data || [];

  const stockInMutation = useStockIn();
  const stockOutMutation = useStockOut();
  const adjustmentMutation = useStockAdjustment();

  const mutation =
    movementType === "stock_in"
      ? stockInMutation
      : movementType === "stock_out"
        ? stockOutMutation
        : adjustmentMutation;

  useEffect(() => {
    if (open) {
      setQuantity("");
      setReference("");
      setReason("");
      setSelectedProductId("");
      setSelectedWarehouseId("");
    }
  }, [open, stockItem]);

  const handleSubmit = () => {
    if (!quantity) return;
    const prodId = stockItem ? stockItem.product_id : Number(selectedProductId);
    const wareId = stockItem ? stockItem.warehouse_id : Number(selectedWarehouseId);
    
    if (!prodId || !wareId) return;

    mutation.mutate(
      {
        product_id: prodId,
        warehouse_id: wareId,
        quantity:
          movementType === "adjustment" ? Number(quantity) : Math.abs(Number(quantity)),
        reference_type: reference ? "manual" : "manual",
        notes: [reference && `Ref: ${reference}`, reason].filter(Boolean).join(" | ") || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITLES[movementType]}</DialogTitle>
        </DialogHeader>

        {stockItem ? (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <div className="font-medium">{stockItem.product_name}</div>
            <div className="text-slate-500">
              {stockItem.warehouse_name} · currently {stockItem.quantity} on hand
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.sku ? `(${p.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Warehouse</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>
              {movementType === "adjustment"
                ? "Quantity change (+ or -)"
                : "Quantity"}
            </Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={movementType === "adjustment" ? "e.g. -5" : "e.g. 20"}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reference (optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number, invoice, etc."
            />
          </div>

          <div className="space-y-1.5">
            <Label>{movementType === "adjustment" ? "Reason" : "Notes"}</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!quantity || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
