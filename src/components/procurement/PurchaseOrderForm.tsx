import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSuppliers, fetchProducts } from "@/services/api";

export default function PurchaseOrderForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (data: any) => void;
}) {
  const [form, setForm] = useState({
    supplier_id: initialData?.supplier_id?.toString() || "",
    expected_delivery: initialData?.expected_delivery ? new Date(initialData.expected_delivery).toISOString().split('T')[0] : "",
    notes: initialData?.notes || "",
    currency: initialData?.currency || "AUD",
  });

  const [items, setItems] = useState<any[]>(initialData?.items || [{ product_id: "", quantity_ordered: "", unit_price: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: suppliersData } = useQuery({ queryKey: ["procurement-suppliers"], queryFn: fetchSuppliers });
  const { data: productsData } = useQuery({ queryKey: ["products-all"], queryFn: () => fetchProducts({ page: 1 }) });

  const suppliers = suppliersData || [];
  const products = productsData?.data || [];
  // For procurement we typically order raw materials, but could be anything
  const rawMaterials = products.filter((p: any) => p.is_raw_material);

  const addItem = () => setItems([...items, { product_id: "", quantity_ordered: "", unit_price: "" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id.toString() === productId);
    const newItems = [...items];
    newItems[index].product_id = productId;
    if (product && !newItems[index].unit_price) {
      newItems[index].unit_price = product.unit_cost?.toString() || "0";
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.supplier_id) newErrors.supplier_id = "Supplier is required";

    const formattedItems = items.map((item, index) => {
      if (!item.product_id) newErrors[`item_${index}_product`] = "Product required";
      const qty = parseFloat(item.quantity_ordered);
      if (isNaN(qty) || qty <= 0) newErrors[`item_${index}_qty`] = "Invalid qty";
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price < 0) newErrors[`item_${index}_price`] = "Invalid price";
      return {
        product_id: parseInt(item.product_id),
        quantity_ordered: qty,
        unit_price: price,
      };
    });

    if (formattedItems.length === 0) newErrors.general = "At least one item is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...form,
      supplier_id: parseInt(form.supplier_id),
      items: formattedItems
    });
  };

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity_ordered) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Supplier *</label>
              <Select value={form.supplier_id} onValueChange={(val) => setForm({ ...form, supplier_id: val })}>
                <SelectTrigger className={errors.supplier_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && <p className="text-xs text-red-500">{errors.supplier_id}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Expected Delivery</label>
              <Input
                type="date"
                value={form.expected_delivery}
                onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Order Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            
            {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 items-center bg-muted/30 p-2 rounded-md">
                  <div className="flex-1 min-w-0 space-y-1">
                    <Select value={item.product_id} onValueChange={(val) => handleProductSelect(index, val)}>
                      <SelectTrigger className={`h-8 ${errors[`item_${index}_product`] ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      placeholder="Qty"
                      className={`h-8 ${errors[`item_${index}_qty`] ? "border-red-500" : ""}`}
                      value={item.quantity_ordered}
                      onChange={(e) => updateItem(index, "quantity_ordered", e.target.value)}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="Price"
                        className={`h-8 pl-6 ${errors[`item_${index}_price`] ? "border-red-500" : ""}`}
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm font-medium">
                    ${((parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end pt-2 text-sm font-semibold space-y-1">
              <div>Subtotal: ${total.toFixed(2)}</div>
              <div>Est. Tax (10%): ${(total * 0.1).toFixed(2)}</div>
              <div className="text-base text-primary">Total: ${(total * 1.1).toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input
              value={form.notes}
              placeholder="Any special instructions..."
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
