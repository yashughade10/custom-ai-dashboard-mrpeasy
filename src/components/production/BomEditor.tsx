"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBoms, fetchBom, createBom, updateBom, deleteBom, fetchProducts } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, ChevronRight, ChevronDown, GitBranch, Package, Pencil, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface BomItem {
  raw_material_id: string;
  quantity: string;
  unit: string;
  waste_pct: string;
}

const emptyBomItem: BomItem = { raw_material_id: "", quantity: "", unit: "pcs", waste_pct: "0" };

export default function BomEditor() {
  const queryClient = useQueryClient();
  const [expandedBomId, setExpandedBomId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBom, setEditingBom] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBomId, setDeletingBomId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formVersion, setFormVersion] = useState("1");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<BomItem[]>([{ ...emptyBomItem }]);

  const { data: bomsData, isLoading: isLoadingBoms } = useQuery({
    queryKey: ["boms"],
    queryFn: fetchBoms,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const { data: bomDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["bom-detail", expandedBomId],
    queryFn: () => fetchBom(expandedBomId!),
    enabled: !!expandedBomId,
  });

  const boms = bomsData?.data || [];
  const allProducts = productsData?.data || [];
  const rawMaterials = allProducts.filter((p: any) => p.is_raw_material);
  const finishedGoods = allProducts.filter((p: any) => p.is_finished_good);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createBom(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boms"] }); closeDialog(); toast.success("BOM created"); },
    onError: (err: any) => toast.error(err.message || "Failed to create BOM"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateBom(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boms"] }); queryClient.invalidateQueries({ queryKey: ["bom-detail"] }); closeDialog(); toast.success("BOM updated"); },
    onError: (err: any) => toast.error(err.message || "Failed to update BOM"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBom(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["boms"] }); setDeleteDialogOpen(false); setDeletingBomId(null); toast.success("BOM deleted"); },
    onError: (err: any) => toast.error(err.message || "Failed to delete BOM"),
  });

  const openCreateDialog = () => {
    setEditingBom(null);
    setFormName("");
    setFormProductId("");
    setFormVersion("1");
    setFormNotes("");
    setFormItems([{ ...emptyBomItem }]);
    setDialogOpen(true);
  };

  const openEditDialog = async (bom: any) => {
    setEditingBom(bom);
    setFormName(bom.name || "");
    setFormProductId(bom.finished_product_id?.toString() || "");
    setFormVersion(bom.version?.toString() || "1");
    setFormNotes(bom.notes || "");
    // Try to load detail for items
    try {
      const detail = await fetchBom(bom.id.toString());
      if (detail?.items?.length > 0) {
        setFormItems(detail.items.map((item: any) => ({
          raw_material_id: item.raw_material_id?.toString() || "",
          quantity: item.quantity?.toString() || "",
          unit: item.unit || "pcs",
          waste_pct: item.waste_pct?.toString() || "0",
        })));
      } else {
        setFormItems([{ ...emptyBomItem }]);
      }
    } catch {
      setFormItems([{ ...emptyBomItem }]);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBom(null);
  };

  const addItem = () => setFormItems([...formItems, { ...emptyBomItem }]);
  const removeItem = (index: number) => setFormItems(formItems.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof BomItem, value: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formProductId) {
      toast.error("Please select a finished product");
      return;
    }
    const version = parseInt(formVersion);
    if (isNaN(version) || version < 1) {
      toast.error("Version must be at least 1");
      return;
    }

    const validItems = formItems.filter(i => i.raw_material_id && i.quantity);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid raw material item with a quantity");
      return;
    }

    for (const item of validItems) {
      if (parseFloat(item.quantity) <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }
      if (parseFloat(item.waste_pct) < 0 || parseFloat(item.waste_pct) > 100) {
        toast.error("Waste percentage must be between 0 and 100");
        return;
      }
    }

    const payload = {
      finished_product_id: parseInt(formProductId),
      name: formName || null,
      version: version,
      notes: formNotes || null,
      items: validItems.map(i => ({
        raw_material_id: parseInt(i.raw_material_id),
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        waste_pct: parseFloat(i.waste_pct) || 0,
      })),
    };
    if (editingBom) {
      updateMutation.mutate({ id: editingBom.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const getProductName = (id: number) => {
    const product = allProducts.find((p: any) => p.id === id);
    return product ? product.name : `Product #${id}`;
  };

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bill of Materials</h1>
          <p className="text-sm text-muted-foreground">
            Configure the raw material recipes needed to produce finished goods.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Create BOM
        </Button>
      </div>

      {/* BOM Tree List */}
      {isLoadingBoms ? (
        <div className="py-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading bills of materials...
        </div>
      ) : boms.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg">
          <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No BOMs found. Create your first Bill of Materials to get started.
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {boms.map((bom: any) => {
            const isExpanded = expandedBomId === bom.id.toString();
            return (
              <div key={bom.id}>
                {/* Parent Row */}
                <div
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => setExpandedBomId(isExpanded ? null : bom.id.toString())}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <GitBranch className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-medium text-sm">{bom.name || `BOM #${bom.id}`}</span>
                      <span className="text-muted-foreground text-xs ml-3">
                        → {getProductName(bom.finished_product_id)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">v{bom.version || 1}</Badge>
                    <Badge variant={bom.is_active ? "default" : "secondary"} className="text-xs">
                      {bom.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(bom); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); setDeletingBomId(bom.id.toString()); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Children (Items) */}
                {isExpanded && (
                  <div className="bg-muted/20 px-4 py-3 pl-12 space-y-2">
                    {isLoadingDetail ? (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading materials...
                      </div>
                    ) : bomDetail?.items?.length > 0 ? (
                      <>
                        <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground border-b pb-2 mb-2">
                          <span>Material</span>
                          <span className="text-right">Quantity</span>
                          <span className="text-center">Unit</span>
                          <span className="text-right">Waste %</span>
                        </div>
                        {bomDetail.items.map((item: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-4 gap-4 text-sm items-center">
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getProductName(item.raw_material_id)}</span>
                            </div>
                            <span className="text-right font-mono">{parseFloat(item.quantity).toFixed(2)}</span>
                            <span className="text-center text-muted-foreground">{item.unit}</span>
                            <span className="text-right text-muted-foreground">{parseFloat(item.waste_pct || 0).toFixed(1)}%</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No materials added to this BOM yet.</p>
                    )}
                    {bomDetail?.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Notes: {bomDetail.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit BOM Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBom ? "Edit Bill of Materials" : "Create Bill of Materials"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Finished Product *</label>
                <select
                  className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  required
                >
                  <option value="">Select product...</option>
                  {(finishedGoods.length > 0 ? finishedGoods : allProducts).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">BOM Name</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Standard Recipe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Version</label>
                <Input type="number" min="1" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Special instructions..."
              />
            </div>

            {/* Materials List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Raw Materials</label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Material
                </Button>
              </div>
              <div className="border rounded-lg divide-y">
                {formItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-2 p-2 items-center">
                    <select
                      className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={item.raw_material_id}
                      onChange={(e) => updateItem(idx, "raw_material_id", e.target.value)}
                    >
                      <option value="">Select material...</option>
                      {(rawMaterials.length > 0 ? rawMaterials : allProducts).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input
                      type="number" step="0.01" min="0" placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    />
                    <select
                      className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="liters">liters</option>
                      <option value="meters">meters</option>
                    </select>
                    <Input
                      type="number" step="0.1" min="0" placeholder="Waste%"
                      value={item.waste_pct}
                      onChange={(e) => updateItem(idx, "waste_pct", e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(idx)} disabled={formItems.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingBom ? "Save Changes" : "Create BOM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(v) => { if (!v) { setDeleteDialogOpen(false); setDeletingBomId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Bill of Materials?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove this BOM and all its items. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingBomId(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingBomId && deleteMutation.mutate(deletingBomId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
