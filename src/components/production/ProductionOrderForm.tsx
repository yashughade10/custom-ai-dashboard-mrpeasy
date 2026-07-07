"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchBoms } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export interface ProductionOrderFormData {
  po_number: string;
  product_id: string;
  bom_id: string;
  quantity: string;
  priority: string;
  start_date: string;
  due_date: string;
  notes: string;
}

const emptyForm: ProductionOrderFormData = {
  po_number: "",
  product_id: "",
  bom_id: "",
  quantity: "",
  priority: "medium",
  start_date: "",
  due_date: "",
  notes: "",
};

interface ProductionOrderFormProps {
  initialData?: Partial<ProductionOrderFormData>;
  onSubmit: (data: ProductionOrderFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function ProductionOrderForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create Order",
}: ProductionOrderFormProps) {
  const [form, setForm] = useState<ProductionOrderFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const { data: bomsData, isLoading: isLoadingBoms } = useQuery({
    queryKey: ["boms-all"],
    queryFn: fetchBoms,
  });

  const products = productsData?.data || [];
  const boms = (bomsData?.data || []).filter(
    (b: any) => !form.product_id || b.finished_product_id?.toString() === form.product_id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.po_number || form.po_number.trim().length === 0) {
      newErrors.po_number = "PO Number is required";
    }
    if (!form.product_id) {
      newErrors.product_id = "Product is required";
    }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">PO Number *</label>
          <Input
            value={form.po_number}
            onChange={(e) => setForm({ ...form, po_number: e.target.value })}
            placeholder="PO-2026-0001"
            className={errors.po_number ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.po_number && <p className="text-xs text-red-500">{errors.po_number}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Product *</label>
          <select
            className={`flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${errors.product_id ? "border-red-500" : "border-input"}`}
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value, bom_id: "" })}
            disabled={isLoadingProducts}
          >
            <option value="">{isLoadingProducts ? "Loading..." : "Select product..."}</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          {errors.product_id && <p className="text-xs text-red-500">{errors.product_id}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">BOM</label>
          <select
            className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            value={form.bom_id}
            onChange={(e) => setForm({ ...form, bom_id: e.target.value })}
            disabled={isLoadingBoms || !form.product_id}
          >
            <option value="">{!form.product_id ? "Select product first" : isLoadingBoms ? "Loading..." : "Select BOM..."}</option>
            {boms.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name || `BOM #${b.id}`} (v{b.version})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="100"
            className={errors.quantity ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <select
            className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Due Date</label>
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <textarea
          className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Special instructions..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
