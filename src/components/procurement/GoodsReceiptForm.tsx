import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function GoodsReceiptForm({
  isOpen,
  onClose,
  purchaseOrder,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onSubmit: (data: any) => void;
}) {
  const [form, setForm] = useState({
    notes: "",
  });

  // Initialize items from PO
  const [items, setItems] = useState<any[]>(
    purchaseOrder?.items?.map((item: any) => ({
      purchase_order_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity_ordered: item.quantity_ordered,
      quantity_previously_received: item.quantity_received || 0,
      quantity_received: Math.max(0, parseFloat(item.quantity_ordered) - (parseFloat(item.quantity_received) || 0)).toString(),
    })) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].quantity_received = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    let hasReceivedAnything = false;

    const formattedItems = items.map((item, index) => {
      const qty = parseFloat(item.quantity_received) || 0;
      if (qty < 0) newErrors[`item_${index}`] = "Cannot be negative";
      
      const remaining = parseFloat(item.quantity_ordered) - parseFloat(item.quantity_previously_received);
      if (qty > remaining) {
        newErrors[`item_${index}`] = `Max ${remaining}`;
      }

      if (qty > 0) hasReceivedAnything = true;

      return {
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        quantity_received: qty,
      };
    });

    if (!hasReceivedAnything) newErrors.general = "Must receive at least 1 item to create a receipt.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      purchase_order_id: purchaseOrder.id,
      notes: form.notes,
      items: formattedItems
    });
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Goods: {purchaseOrder.po_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Items to Receive</h3>
            
            {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}

            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground mb-1">
                <div className="flex-1">Product</div>
                <div className="w-24 text-right">Ordered</div>
                <div className="w-24 text-right">Received</div>
                <div className="w-24 text-right pr-2">Receive Now</div>
              </div>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 items-center bg-muted/30 p-2 rounded-md">
                  <div className="flex-1 min-w-0 truncate text-sm font-medium">
                    {item.product_name}
                  </div>
                  <div className="w-24 text-right text-sm">
                    {item.quantity_ordered}
                  </div>
                  <div className="w-24 text-right text-sm">
                    {item.quantity_previously_received}
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`h-8 text-right ${errors[`item_${index}`] ? "border-red-500" : ""}`}
                      value={item.quantity_received}
                      onChange={(e) => updateItem(index, e.target.value)}
                    />
                    {errors[`item_${index}`] && <p className="text-[10px] text-red-500 text-right mt-1">{errors[`item_${index}`]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes / Delivery Reference</label>
            <Input
              value={form.notes}
              placeholder="e.g. Delivered by FedEx, Ref #12345"
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Log Receipt</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
