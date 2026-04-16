"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function OrderDetailsDialog({
  open,
  onClose,
  order,
}: any) {
  if (!order) return null;

  const o = order.payload.data;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Order Details - {o.code}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="break-words font-medium">{o.customer_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(Number(o.created) * 1000).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{o.status_txt}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Payment</p>
              <Badge variant="destructive">{o.payment_status_txt}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Invoice</p>
              <Badge variant="secondary">{o.invoice_status_txt}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Shipment</p>
              <Badge variant="outline">{o.part_status_txt}</Badge>
            </div>
          </div>

          <div>
            <p className="mb-2 font-semibold">Products</p>

            <div className="max-h-[45dvh] overflow-auto rounded-lg border">
              <table className="min-w-[42rem] w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="hidden p-2 text-left sm:table-cell">Price</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {o.products.map((p: any) => (
                    <tr key={p.line_id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{p.item_code}</p>
                        <p className="text-xs text-muted-foreground">{p.item_title}</p>
                      </td>
                      <td className="p-2">{p.quantity}</td>
                      <td className="hidden p-2 sm:table-cell">
                        {p.item_price_cur} {o.currency}
                      </td>
                      <td className="p-2">
                        {p.total_price_cur} {o.currency}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{p.part_status_txt}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="font-semibold">
                {o.total_cost} {o.currency}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="font-semibold">
                {o.total_price_cur} {o.currency}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="font-semibold text-green-600">{o.profit}</p>
            </div>
          </div>

          {o.shipping_address && (
            <div className="border-t pt-4">
              <p className="mb-2 font-semibold">Shipping Address</p>
              <p className="break-words text-sm">
                {o.shipping_address.street_line_1}, {o.shipping_address.city}, {o.shipping_address.state}, {o.shipping_address.postal_code}, {o.shipping_address.country_code}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
