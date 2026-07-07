// components/inventory/WarehouseForm.tsx
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
import { Switch } from "@/components/ui/switch";

import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/use-inventory";
import type { Warehouse } from "@/types/inventory";

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse;
}

export function WarehouseForm({ open, onOpenChange, warehouse }: WarehouseFormProps) {
  const isEdit = Boolean(warehouse);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(warehouse?.name ?? "");
    setCode(warehouse?.code ?? "");
    setAddress(warehouse?.address ?? "");
    setIsActive(warehouse?.is_active ?? true);
  }, [open, warehouse]);

  const handleSubmit = () => {
    const payload = { name, code: code || undefined, address: address || undefined, is_active: isActive };
    if (isEdit && warehouse) {
      updateMutation.mutate({ id: warehouse.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit warehouse" : "New warehouse"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main warehouse" />
          </div>
          <div className="space-y-1.5">
            <Label>Code (optional)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WH-01" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label className="mb-0">Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name || isSaving} onClick={handleSubmit}>
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create warehouse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
