"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface MaterialConsumptionFormProps {
  orderId: string;
  poNumber?: string;
  onSubmit: (data: { raw_material_id: number; quantity_consumed: number; consumed_by: number }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function MaterialConsumptionForm({
  orderId,
  poNumber,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MaterialConsumptionFormProps) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const products = productsData?.data || [];
  const rawMaterials = products.filter((p: any) => p.is_raw_material);
  // Fall back to all products if no raw materials are tagged
  const materialOptions = rawMaterials.length > 0 ? rawMaterials : products;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!materialId) {
      newErrors.materialId = "Raw material is required";
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      raw_material_id: parseInt(materialId),
      quantity_consumed: parseFloat(quantity),
      consumed_by: 1, // TODO: replace with authenticated user id
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {poNumber && (
        <p className="text-sm text-muted-foreground">
          Order: <strong className="text-foreground">{poNumber}</strong>
        </p>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Raw Material *</label>
        <select
          className={`flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${errors.materialId ? "border-red-500" : "border-input"}`}
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          disabled={isLoadingProducts}
        >
          <option value="">{isLoadingProducts ? "Loading..." : "Select material..."}</option>
          {materialOptions.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
          ))}
        </select>
        {errors.materialId && <p className="text-xs text-red-500">{errors.materialId}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Quantity Consumed *</label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="10"
          className={errors.quantity ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Log Consumption
        </Button>
      </DialogFooter>
    </form>
  );
}
