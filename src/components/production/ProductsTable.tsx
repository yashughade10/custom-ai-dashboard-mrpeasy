"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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

export default function ProductsTable({ onOpenCreate }: { onOpenCreate?: (fn: () => void) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const filterParams: any = { page, search };
  if (typeFilter === "raw") filterParams.is_raw_material = "true";
  if (typeFilter === "finished") filterParams.is_finished_good = "true";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", { page, search, typeFilter }],
    queryFn: () => fetchProducts(filterParams),
    placeholderData: (previousData) => previousData,
  });

  const products = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createProduct(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); closeDialog(); toast.success("Product created"); },
    onError: (err: any) => toast.error(err.message || "Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateProduct(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); closeDialog(); toast.success("Product updated"); },
    onError: (err: any) => toast.error(err.message || "Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setDeleteDialogOpen(false); setDeletingProductId(null); toast.success("Product deleted"); },
    onError: (err: any) => toast.error(err.message || "Failed to delete product"),
  });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku || "",
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      unit: product.unit || "pcs",
      unit_cost: product.unit_cost?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      is_raw_material: !!product.is_raw_material,
      is_finished_good: !!product.is_finished_good,
      is_active: product.is_active !== undefined ? !!product.is_active : true,
      image_url: product.image_url || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sku || form.sku.trim().length === 0) {
      toast.error("SKU is required");
      return;
    }
    if (!form.name || form.name.trim().length === 0) {
      toast.error("Product name is required");
      return;
    }
    const cost = form.unit_cost ? parseFloat(form.unit_cost) : 0;
    const price = form.selling_price ? parseFloat(form.selling_price) : 0;
    if (cost < 0) {
      toast.error("Unit cost cannot be negative");
      return;
    }
    if (price < 0) {
      toast.error("Selling price cannot be negative");
      return;
    }

    const payload = {
      ...form,
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit_cost: cost,
      selling_price: price,
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Input
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-[250px]"
        />
        <select
          className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="raw">Raw Materials</option>
          <option value="finished">Finished Goods</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isFetching) ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No products found. Create your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any) => (
                <TableRow key={product.id} className="group">
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category || "-"}</TableCell>
                  <TableCell className="text-right">${parseFloat(product.unit_cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${parseFloat(product.selling_price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      {product.is_raw_material ? <Badge variant="outline" className="text-xs">Raw</Badge> : null}
                      {product.is_finished_good ? <Badge className="text-xs">Finished</Badge> : null}
                      {!product.is_raw_material && !product.is_finished_good ? <span className="text-muted-foreground text-xs">-</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => { setDeletingProductId(product.id.toString()); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">SKU *</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="PROD-001" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" required />
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
                <Input type="number" step="0.01" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Selling Price ($)</label>
                <Input type="number" step="0.01" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="0.00" />
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
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(v) => { if (!v) { setDeleteDialogOpen(false); setDeletingProductId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Are you sure you want to permanently delete this product?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingProductId(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingProductId && deleteMutation.mutate(deletingProductId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
