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

import { useStockAdjustment, useStockIn, useStockOut } from "@/hooks/use-inventory";
import type { MovementType, StockItem } from "@/types/inventory";

const TITLES: Record<MovementType, string> = {
  in: "Receive stock",
  out: "Issue stock",
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

  const stockInMutation = useStockIn();
  const stockOutMutation = useStockOut();
  const adjustmentMutation = useStockAdjustment();

  const mutation =
    movementType === "in"
      ? stockInMutation
      : movementType === "out"
        ? stockOutMutation
        : adjustmentMutation;

  useEffect(() => {
    if (open) {
      setQuantity("");
      setReference("");
      setReason("");
    }
  }, [open, stockItem]);

  const handleSubmit = () => {
    if (!stockItem || !quantity) return;
    mutation.mutate(
      {
        product_id: stockItem.product_id,
        warehouse_id: stockItem.warehouse_id,
        quantity:
          movementType === "adjustment" ? Number(quantity) : Math.abs(Number(quantity)),
        reference: reference || undefined,
        reason: reason || undefined,
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

        {stockItem && (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <div className="font-medium">{stockItem.product_name}</div>
            <div className="text-slate-500">
              {stockItem.warehouse_name} · currently {stockItem.quantity} on hand
            </div>
          </div>
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
