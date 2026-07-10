// components/sales-orders/SalesOrderFormSheet.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Reusing the same lookup hooks already built for the quotations module.
import {
  useCompanyOptions,
  useContactOptions,
  useProductOptions,
} from "@/hooks/use-quotations";
import { SalesOrderProgressTracker } from "./SalesOrderProgressTracker";
import { useCreateSalesOrder, useUpdateSalesOrder } from "@/hooks/use-sales-orders";
import { useStock } from "@/hooks/use-inventory";
import type { SalesOrder } from "@/types/sales-order";

// Helper to convert ISO 8601 datetime to YYYY-MM-DD format for HTML date input
const formatDateForInput = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
  } catch {
    return null;
  }
};

const itemSchema = z.object({
  id: z.number().optional(),
  product_id: z.coerce.number({ message: "Pick a product" }).positive(),
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().positive("Must be at least 1"),
  unit_price: z.coerce.number().min(0),
  discount_pct: z.coerce.number().min(0).max(100),
  tax_pct: z.coerce.number().min(0).max(100),
});

const formSchema = z.object({
  company_id: z.coerce.number().nullable(),
  contact_id: z.coerce.number().nullable(),
  customer_po: z.string().nullable(),
  delivery_date: z.string().nullable(),
  shipping_address: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyValues: FormValues = {
  company_id: null,
  contact_id: null,
  customer_po: "",
  delivery_date: null,
  shipping_address: "",
  notes: "",
  items: [
    { product_id: 0, description: "", quantity: 1, unit_price: 0, discount_pct: 0, tax_pct: 0 },
  ],
};

interface SalesOrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder?: SalesOrder;
}

export function SalesOrderFormSheet({
  open,
  onOpenChange,
  salesOrder,
}: SalesOrderFormSheetProps) {
  const isEdit = Boolean(salesOrder);

  const { data: companies = [] } = useCompanyOptions();
  const { data: contacts = [] } = useContactOptions();
  const { data: products = [] } = useProductOptions();

  const createMutation = useCreateSalesOrder();
  const updateMutation = useUpdateSalesOrder();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const { data: stockData } = useStock({ limit: 1000 });
  const stockItems = stockData?.data || [];
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stockItems.forEach((s) => {
      const existing = map.get(String(s.product_id)) || 0;
      map.set(String(s.product_id), existing + s.quantity);
    });
    return map;
  }, [stockItems]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  useEffect(() => {
    if (!open) return;
    if (salesOrder) {
      reset({
        company_id: salesOrder.company_id,
        contact_id: salesOrder.contact_id,
        customer_po: salesOrder.customer_po ?? "",
        delivery_date: formatDateForInput(salesOrder.delivery_date),
        shipping_address: salesOrder.shipping_address ?? "",
        notes: salesOrder.notes ?? "",
        items: (salesOrder.items ?? []).map((item) => ({
          id: item.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct,
          tax_pct: item.tax_pct,
        })),
      });
    } else {
      reset(emptyValues);
    }
  }, [open, salesOrder, reset]);

  const productMap = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of watchedItems ?? []) {
      const lineBase = (item.quantity || 0) * (item.unit_price || 0);
      const lineDiscount = lineBase * ((item.discount_pct || 0) / 100);
      const taxable = lineBase - lineDiscount;
      const lineTax = taxable * ((item.tax_pct || 0) / 100);

      subtotal += lineBase;
      discountAmount += lineDiscount;
      taxAmount += lineTax;
    }

    return { subtotal, discountAmount, taxAmount, total: subtotal - discountAmount + taxAmount };
  }, [watchedItems]);

  const isItemsDisabled = isEdit && salesOrder?.status !== "draft";

  // Check if form is locked (not in draft status)
  const isLocked = isEdit && salesOrder && salesOrder.status !== "draft";

  const onSubmit = (values: FormValues) => {
    const payload = { ...values };

    if (isEdit && salesOrder) {
      updateMutation.mutate({ id: salesOrder.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>
              {isEdit ? `Edit ${salesOrder?.order_number}` : "New sales order"}
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
            {isEdit && salesOrder && (
              <div className="rounded-md border bg-slate-50/50 px-4 py-4">
                <SalesOrderProgressTracker status={salesOrder.status} />
              </div>
            )}

            {isLocked && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm font-medium text-yellow-800">
                  This order is <strong>{salesOrder?.status}</strong>. You can only edit delivery date and shipping address. All other fields are locked.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Controller
                  control={control}
                  name="company_id"
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Controller
                  control={control}
                  name="contact_id"
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.firstname} {c.lastname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Customer PO</Label>
                <Input disabled={isLocked} placeholder="PO-998877" {...register("customer_po")} />
              </div>

              <div className="space-y-1.5">
                <Label>Delivery date</Label>
                <Input type="date" {...register("delivery_date")} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Shipping address</Label>
                <Textarea rows={2} {...register("shipping_address")} />
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLocked}
                  onClick={() =>
                    append({
                      product_id: 0,
                      description: "",
                      quantity: 1,
                      unit_price: 0,
                      discount_pct: 0,
                      tax_pct: 0,
                      })
                    }
                  >
                  <Plus className="mr-1 h-4 w-4" /> Add item
                </Button>
              </div>
              {errors.items?.message && (
                <p className="text-sm text-red-600">{errors.items.message}</p>
              )}

              <div className="overflow-x-auto rounded-md border">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead className="min-w-[150px]">Description</TableHead>
                        <TableHead className="min-w-[80px]">Qty</TableHead>
                        <TableHead className="min-w-[100px]">Unit price</TableHead>
                        <TableHead className="min-w-[80px]">Disc %</TableHead>
                        <TableHead className="min-w-[80px]">Tax %</TableHead>
                        <TableHead className="min-w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-8 min-w-[32px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {fields.map((field, index) => {
                      const item = watchedItems?.[index];
                      const base = (item?.quantity || 0) * (item?.unit_price || 0);
                      const discount = base * ((item?.discount_pct || 0) / 100);
                      const taxable = base - discount;
                      const tax = taxable * ((item?.tax_pct || 0) / 100);
                      const lineTotal = taxable + tax;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`items.${index}.product_id`}
                              render={({ field: f }) => (
                                <Select
                                  disabled={isItemsDisabled}
                                  disabled={isLocked}
                                  value={f.value ? String(f.value) : undefined}
                                  onValueChange={(v) => {
                                    f.onChange(Number(v));
                                    const product = productMap.get(v);
                                    if (product) {
                                      setValue(`items.${index}.description`, product.description || product.name);
                                      const price =
                                        product.selling_price ?? product.unit_price ?? product.price ?? product.sale_price;
                                      
                                      const parsedPrice = parseFloat(String(price));
                                      if (!isNaN(parsedPrice)) {
                                        setValue(`items.${index}.unit_price`, parsedPrice);
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-full border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isItemsDisabled}
                              disabled={isLocked}
                              className="h-8"
                              {...register(`items.${index}.description`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isItemsDisabled}
                              type="number"
                              min={1}
                              step="1"
                              disabled={isLocked}
                              className="h-8 mb-1"
                              {...register(`items.${index}.quantity`)}
                            />
                            {item?.product_id ? (
                              <div className="text-[10px] text-slate-500 whitespace-nowrap">
                                Stock: {stockMap.get(String(item.product_id)) || 0}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isItemsDisabled}
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={isLocked}
                              className="h-8"
                              {...register(`items.${index}.unit_price`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isItemsDisabled}
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              disabled={isLocked}
                              className="h-8"
                              {...register(`items.${index}.discount_pct`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isItemsDisabled}
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              disabled={isLocked}
                              className="h-8"
                              {...register(`items.${index}.tax_pct`)}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {lineTotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              disabled={isItemsDisabled || fields.length === 1 || isLocked}
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
              </div>

              <div className="ml-auto w-64 space-y-1 pt-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="tabular-nums">-{totals.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span className="tabular-nums">{totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} {...register("notes")} />
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create sales order"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
