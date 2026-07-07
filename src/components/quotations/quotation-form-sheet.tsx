// components/quotations/quotation-form-sheet.tsx
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

import {
  useCompanyOptions,
  useContactOptions,
  useCreateQuotation,
  useDealOptions,
  useProductOptions,
  useUpdateQuotation,
} from "@/hooks/use-quotations";
import {
  CURRENCIES,
  getProductUnitPrice,
  type Quotation,
} from "@/types/quotation";

const itemSchema = z.object({
  id: z.number().optional(),
  product_id: z.coerce.number({ message: "Pick a product" }).positive(),
  quantity: z.coerce.number().positive("Must be at least 1"),
  discount_pct: z.coerce.number().min(0).max(100),
  tax_pct: z.coerce.number().min(0).max(100),
  sort_order: z.number(),
});

const formSchema = z.object({
  company_id: z.coerce.number().nullable(),
  contact_id: z.coerce.number().nullable(),
  deal_id: z.coerce.number().nullable(),
  currency: z.string().min(1),
  valid_until: z.string().nullable(),
  notes: z.string().nullable(),
  terms: z.string().nullable(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyValues: FormValues = {
  company_id: null,
  contact_id: null,
  deal_id: null,
  currency: "AUD",
  valid_until: null,
  notes: "",
  terms: "Net 30",
  items: [
    { product_id: 0, quantity: 1, discount_pct: 0, tax_pct: 0, sort_order: 1 },
  ],
};

interface QuotationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an existing quotation to edit it; omit to create a new one. */
  quotation?: Quotation;
}

export function QuotationFormSheet({
  open,
  onOpenChange,
  quotation,
}: QuotationFormSheetProps) {
  const isEdit = Boolean(quotation);

  const { data: companies = [] } = useCompanyOptions();
  const { data: contacts = [] } = useContactOptions();
  const { data: deals = [] } = useDealOptions();
  const { data: products = [] } = useProductOptions();

  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  // Reset the form whenever a different quotation is opened for editing,
  // or the sheet is opened fresh for "create".
  useEffect(() => {
    if (!open) return;
    if (quotation) {
      const quotationItems = (quotation.items ?? []).map((item, index) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        discount_pct: item.discount_pct,
        tax_pct: item.tax_pct,
        sort_order: item.sort_order ?? index + 1,
      }));

      console.log("Loading quotation for edit:", {
        id: quotation.id,
        itemsCount: quotationItems.length,
        items: quotationItems,
      });

      reset({
        company_id: quotation.company_id,
        contact_id: quotation.contact_id,
        deal_id: quotation.deal_id,
        currency: quotation.currency,
        valid_until: quotation.valid_until,
        notes: quotation.notes ?? "",
        terms: quotation.terms ?? "",
        items: quotationItems,
      });
      
      // Replace the fields array to ensure useFieldArray syncs
      replace(quotationItems);
    } else {
      reset(emptyValues);
      replace([emptyValues.items[0]]);
    }
  }, [open, quotation, reset, replace]);

  // Keyed by string to avoid string/number mismatches between what the
  // <Select> stores (coerced to Number) and whatever type product IDs come
  // back as from the API.
  const productMap = useMemo(
    () => new Map(products.map((p) => [String(p.id), p])),
    [products],
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of watchedItems ?? []) {
      const unitPrice = getProductUnitPrice(
        productMap.get(String(item.product_id)),
      );
      const lineBase = (item.quantity || 0) * unitPrice;
      const lineDiscount = lineBase * ((item.discount_pct || 0) / 100);
      const taxable = lineBase - lineDiscount;
      const lineTax = taxable * ((item.tax_pct || 0) / 100);

      subtotal += lineBase;
      discountAmount += lineDiscount;
      taxAmount += lineTax;
    }

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: subtotal - discountAmount + taxAmount,
    };
  }, [watchedItems, productMap]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      company_id: values.company_id,
      contact_id: values.contact_id,
      deal_id: values.deal_id,
      currency: values.currency,
      valid_until: values.valid_until,
      notes: values.notes,
      terms: values.terms,
      items: values.items.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      })),
    };

    if (isEdit && quotation) {
      updateMutation.mutate(
        { id: quotation.id, payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* flex column pinned to full viewport height; only the middle
          section scrolls, so the header stays put and the footer with
          Save/Cancel never gets pushed off-screen */}
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>
              {isEdit ? `Edit ${quotation?.quote_number}` : "New quotation"}
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
            {/* Company / contact / deal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Controller
                  control={control}
                  name="company_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
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
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
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
                <Label>Deal (optional)</Label>
                <Controller
                  control={control}
                  name="deal_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Link a deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {deals.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Valid until</Label>
                <Input type="date" {...register("valid_until")} />
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
                  onClick={() =>
                    append({
                      product_id: 0,
                      quantity: 1,
                      discount_pct: 0,
                      tax_pct: 0,
                      sort_order: fields.length + 1,
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add item
                </Button>
              </div>
              {errors.items?.message && (
                <p className="text-sm text-red-600">{errors.items.message}</p>
              )}

              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[36%]">Product</TableHead>
                      <TableHead className="w-[14%]">Qty</TableHead>
                      <TableHead className="w-[15%]">Discount %</TableHead>
                      <TableHead className="w-[15%]">Tax %</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-12 text-center text-sm text-slate-500">
                          No items. Click "Add item" to get started.
                        </TableCell>
                      </TableRow>
                    )}
                    {fields.map((field, index) => {
                      console.log(`Rendering field ${index}:`, field);
                      const item = watchedItems?.[index];
                      const unitPrice = getProductUnitPrice(
                        productMap.get(String(item?.product_id ?? "")),
                      );
                      const base = (item?.quantity || 0) * unitPrice;
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
                                  value={f.value && f.value > 0 ? String(f.value) : ""}
                                  onValueChange={(v) => f.onChange(v ? Number(v) : 0)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select product" />
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
                              type="number"
                              min={1}
                              step="1"
                              className="h-8"
                              {...register(`items.${index}.quantity`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              className="h-8"
                              {...register(`items.${index}.discount_pct`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
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
                              disabled={fields.length === 1}
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

              <div className="ml-auto w-64 space-y-1 pt-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -{totals.discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span className="tabular-nums">
                    {totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes / terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} {...register("notes")} />
              </div>
              <div className="space-y-1.5">
                <Label>Terms</Label>
                <Textarea rows={3} {...register("terms")} />
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create quotation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}