"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductionOrders,
  createProductionOrder,
  updateProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  consumeMaterial,
  fetchProducts,
} from "@/services/api";
import { useWarehouses } from "@/hooks/use-inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ProductionOrderForm, { type ProductionOrderFormData } from "./ProductionOrderForm";
import MaterialConsumptionForm from "./MaterialConsumptionForm";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Play,
  CheckCircle2,
  Package,
  ChevronLeft,
  ChevronRight,
  Factory,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ProductionOrdersTable({ onOpenCreate }: { onOpenCreate?: (fn: (defaults?: any) => void) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create / Edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [newOrderDefaults, setNewOrderDefaults] = useState<any>(null);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Material consumption
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);
  const [consumingOrder, setConsumingOrder] = useState<any>(null);

  // Data fetching
  const { data: ordersData, isLoading, isFetching } = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const { data: warehouses = [] } = useWarehouses();

  const allOrders = ordersData?.data || [];
  const products = productsData?.data || [];

  // Client-side filtering
  const filteredOrders = allOrders.filter((o: any) => {
    const productName = products.find((p: any) => p.id === o.product_id)?.name || "";
    const matchesSearch =
      !search ||
      o.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesPriority = !priorityFilter || o.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createProductionOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      closeDialog();
      toast.success("Production order created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create order"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateProductionOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      closeDialog();
      toast.success("Production order updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update order"),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startProductionOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Production started");
    },
    onError: (err: any) => toast.error(err.message || "Failed to start production"),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, warehouse_id }: { id: string; warehouse_id: string }) => completeProductionOrder(id, { warehouse_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      setCompletingOrder(null);
      setCompleteDialogOpen(false);
      toast.success("Production completed");
    },
    onError: (err: any) => toast.error(err.message || "Failed to complete production"),
  });

  const consumeMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Record<string, any> }) => consumeMaterial(orderId, data),
    onSuccess: () => {
      setConsumeDialogOpen(false);
      setConsumingOrder(null);
      toast.success("Material consumption logged");
    },
    onError: (err: any) => toast.error(err.message || "Failed to log consumption"),
  });

  // Completion Dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<any>(null);
  const [completionWarehouseId, setCompletionWarehouseId] = useState("");

  // Dialog handlers
  const openCreateDialog = (defaults?: any) => {
    setEditingOrder(null);
    setNewOrderDefaults(defaults || null);
    setDialogOpen(true);
  };

  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const openEditDialog = (order: any) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingOrder(null);
  };

  const handleFormSubmit = (formData: ProductionOrderFormData) => {
    const payload = {
      po_number: formData.po_number.trim(),
      product_id: parseInt(formData.product_id),
      bom_id: formData.bom_id ? parseInt(formData.bom_id) : null,
      quantity: parseFloat(formData.quantity),
      priority: formData.priority,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
      notes: formData.notes?.trim() || null,
      created_by: 1, // TODO: replace with authenticated user id
    };

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const getProductName = (productId: number) => {
    const p = products.find((p: any) => p.id === productId);
    return p?.name || `Product #${productId}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <Input
          placeholder="Search PO# or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[250px]"
        />
        <select
          className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">PO Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isFetching) ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading production orders...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Factory className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No production orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const priority = priorityConfig[order.priority] || priorityConfig.medium;

                return (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-mono text-xs">{order.po_number}</TableCell>
                    <TableCell className="font-medium">{getProductName(order.product_id)}</TableCell>
                    <TableCell className="text-right">{parseFloat(order.quantity).toFixed(0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs capitalize ${status.color}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-xs capitalize ${priority.color}`}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.start_date ? new Date(order.start_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.due_date ? new Date(order.due_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(order)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {order.status === "pending" && (
                            <DropdownMenuItem onClick={() => startMutation.mutate(order.id.toString())}>
                              <Play className="h-4 w-4 mr-2" /> Start Production
                            </DropdownMenuItem>
                          )}
                          {order.status === "in_progress" && (
                            <>
                              <DropdownMenuItem onClick={() => { setCompletingOrder(order); setCompleteDialogOpen(true); }}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setConsumingOrder(order); setConsumeDialogOpen(true); }}>
                                <Package className="h-4 w-4 mr-2" /> Log Material
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => { setDeletingOrderId(order.id.toString()); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Production Order" : "Create Production Order"}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Update the production order details." : "Fill in the details to create a new production order."}
            </DialogDescription>
          </DialogHeader>
          <ProductionOrderForm
            key={editingOrder?.id || "new"}
            initialData={
              editingOrder
                ? {
                    po_number: editingOrder.po_number || "",
                    product_id: editingOrder.product_id?.toString() || "",
                    bom_id: editingOrder.bom_id?.toString() || "",
                    quantity: editingOrder.quantity?.toString() || "",
                    priority: editingOrder.priority || "medium",
                    start_date: editingOrder.start_date ? new Date(editingOrder.start_date).toISOString().split("T")[0] : "",
                    due_date: editingOrder.due_date ? new Date(editingOrder.due_date).toISOString().split("T")[0] : "",
                    notes: editingOrder.notes || "",
                  }
                : newOrderDefaults
            }
            onSubmit={handleFormSubmit}
            onCancel={closeDialog}
            isSubmitting={isMutating}
            submitLabel={editingOrder ? "Save Changes" : "Create Order"}
          />
        </DialogContent>
      </Dialog>

      {/* Material Consumption Dialog */}
      <Dialog open={consumeDialogOpen} onOpenChange={(v) => { if (!v) { setConsumeDialogOpen(false); setConsumingOrder(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Material Consumption</DialogTitle>
          </DialogHeader>
          {consumingOrder && (
            <MaterialConsumptionForm
              key={consumingOrder.id}
              orderId={consumingOrder.id.toString()}
              poNumber={consumingOrder.po_number}
              onSubmit={(data) => consumeMutation.mutate({ orderId: consumingOrder.id.toString(), data })}
              onCancel={() => { setConsumeDialogOpen(false); setConsumingOrder(null); }}
              isSubmitting={consumeMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={(v) => { if (!v) { setCompleteDialogOpen(false); setCompletingOrder(null); setCompletionWarehouseId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Production Order</DialogTitle>
            <DialogDescription>
              Receive the manufactured goods into a warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={completionWarehouseId} onValueChange={setCompletionWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name} {w.is_default ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCompleteDialogOpen(false); setCompletingOrder(null); setCompletionWarehouseId(""); }}>Cancel</Button>
            <Button
              disabled={!completionWarehouseId || completeMutation.isPending}
              onClick={() => {
                if (completingOrder && completionWarehouseId) {
                  completeMutation.mutate({ id: completingOrder.id.toString(), warehouse_id: completionWarehouseId });
                }
              }}
            >
              {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={(v) => { if (!v) { setDeleteDialogOpen(false); setDeletingOrderId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Production Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Are you sure you want to permanently delete this production order?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingOrderId(null); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingOrderId) {
                  updateProductionOrder(deletingOrderId, { status: "cancelled" }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["production-orders"] });
                    setDeleteDialogOpen(false);
                    setDeletingOrderId(null);
                    toast.success("Production order cancelled");
                  }).catch(() => toast.error("Failed to cancel order"));
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
