"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category: "",
  unit: "pcs",
  unit_cost: "",
  selling_price: "",
  is_raw_material: false,
  is_finished_good: false,
  is_active: true,
  image_url: "",
};

export type ProductFormData = typeof emptyForm;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function ProductForm({ initialData, onSubmit, onCancel, isSubmitting = false, submitLabel = "Save" }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.sku || form.sku.trim().length === 0) {
      newErrors.sku = "SKU is required";
    }
    if (!form.name || form.name.trim().length === 0) {
      newErrors.name = "Product name is required";
    }
    const cost = form.unit_cost ? parseFloat(form.unit_cost) : 0;
    if (cost < 0) {
      newErrors.unit_cost = "Unit cost cannot be negative";
    }
    const price = form.selling_price ? parseFloat(form.selling_price) : 0;
    if (price < 0) {
      newErrors.selling_price = "Selling price cannot be negative";
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
          <label className="text-xs font-medium text-muted-foreground">SKU *</label>
          <Input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="PROD-001"
            className={errors.sku ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Product name"
            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Product description..."
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Electronics" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Unit</label>
          <select
            className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="liters">liters</option>
            <option value="meters">meters</option>
            <option value="units">units</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Image URL</label>
          <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Unit Cost ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.unit_cost}
            onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
            placeholder="0.00"
            className={errors.unit_cost ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.unit_cost && <p className="text-xs text-red-500">{errors.unit_cost}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Selling Price ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.selling_price}
            onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
            placeholder="0.00"
            className={errors.selling_price ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.selling_price && <p className="text-xs text-red-500">{errors.selling_price}</p>}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_raw_material} onChange={(e) => setForm({ ...form, is_raw_material: e.target.checked })} className="rounded" />
          Raw Material
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_finished_good} onChange={(e) => setForm({ ...form, is_finished_good: e.target.checked })} className="rounded" />
          Finished Good
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
          Active
        </label>
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
