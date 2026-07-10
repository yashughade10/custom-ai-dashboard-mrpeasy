"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Play, CheckCircle2, Package, Clock, Cog, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useWarehouses } from "@/hooks/use-inventory";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

const STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

const statusConfig: Record<string, { label: string; color: string; icon: any; borderColor: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock, borderColor: "border-yellow-300 dark:border-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Cog, borderColor: "border-blue-300 dark:border-blue-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Trophy, borderColor: "border-green-300 dark:border-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: Package, borderColor: "border-red-300 dark:border-red-700" },
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

function SortableOrderCard({ order, products, onConsume }: { order: any; products: any[]; onConsume: (order: any) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: order.id.toString(),
    data: { order, status: order.status },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const productName = products.find((p: any) => p.id === order.product_id)?.name || `Product #${order.product_id}`;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-background border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{order.po_number}</span>
        <Badge className={`text-[10px] ${priorityColors[order.priority] || priorityColors.medium}`}>
          {order.priority}
        </Badge>
      </div>
      <p className="text-sm font-medium leading-tight">{productName}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Qty: {parseFloat(order.quantity).toFixed(0)}</span>
        {order.due_date && <span>Due: {new Date(order.due_date).toLocaleDateString()}</span>}
      </div>
      {order.status === "in_progress" && (
        <Button size="sm" variant="outline" className="w-full text-xs h-7 mt-1" onClick={(e) => { e.stopPropagation(); onConsume(order); }}>
          <Package className="h-3 w-3 mr-1" /> Log Material
        </Button>
      )}
    </div>
  );
}

function KanbanColumn({ status, orders, products, onConsume }: { status: string; orders: any[]; products: any[]; onConsume: (order: any) => void }) {
  const config = statusConfig[status];
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex-1 min-w-[260px] max-w-[320px]">
      <div className={`border-t-2 ${config.borderColor} rounded-lg bg-muted/30 p-3 h-full`}>
        <div className="flex items-center gap-2 mb-3">
          <config.icon className="h-4 w-4" />
          <h3 className="text-sm font-semibold">{config.label}</h3>
          <Badge variant="secondary" className="text-xs ml-auto">{orders.length}</Badge>
        </div>
        <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
          <SortableContext items={orders.map((o) => o.id.toString())} strategy={verticalListSortingStrategy}>
            {orders.map((order) => (
              <SortableOrderCard key={order.id} order={order} products={products} onConsume={onConsume} />
            ))}
          </SortableContext>
          {orders.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8 opacity-50">
              Drop orders here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductionKanbanBoard({ onOpenCreate }: { onOpenCreate?: (fn: (defaults?: any) => void) => void }) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);
  const [consumingOrder, setConsumingOrder] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Create form
  const [formPoNumber, setFormPoNumber] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Consume form
  const [consumeMaterialId, setConsumeMaterialId] = useState("");
  const [consumeQty, setConsumeQty] = useState("");

  const openCreateDialog = (defaults?: any) => {
    setFormPoNumber(defaults?.po_number || "");
    setFormProductId(defaults?.product_id || "");
    setFormQuantity(defaults?.quantity || "");
    setFormPriority("medium");
    setFormStartDate("");
    setFormDueDate("");
    setFormNotes("");
    setCreateDialogOpen(true);
  };

  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ page: 1 }),
  });

  const orders = ordersData?.data || [];
  const products = productsData?.data || [];
  const rawMaterials = products.filter((p: any) => p.is_raw_material);

  const columns = useMemo(() => {
    const cols: Record<string, any[]> = {};
    STATUSES.forEach((s) => { cols[s] = []; });
    orders.forEach((order: any) => {
      const status = order.status || "pending";
      if (cols[status]) cols[status].push(order);
    });
    return cols;
  }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<any>(null);
  const [completionWarehouseId, setCompletionWarehouseId] = useState("");

  const { data: warehouses = [] } = useWarehouses();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, warehouse_id }: { id: string; status: string; warehouse_id?: string }) => {
      if (status === "in_progress") return startProductionOrder(id);
      if (status === "completed") return completeProductionOrder(id, { warehouse_id: warehouse_id! });
      return updateProductionOrder(id, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["production-orders"] });
      const previousOrders = queryClient.getQueryData(["production-orders"]);
      
      queryClient.setQueryData(["production-orders"], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((order: any) =>
            order.id.toString() === id ? { ...order, status } : order
          ),
        };
      });
      return { previousOrders };
    },
    onError: (err: any, newOrder, context: any) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["production-orders"], context.previousOrders);
      }
      toast.error(err.message || "Failed to update order");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    },
    onSuccess: () => {
      toast.success("Order status updated");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createProductionOrder(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["production-orders"] }); setCreateDialogOpen(false); toast.success("Production order created"); },
    onError: (err: any) => toast.error(err.message || "Failed to create order"),
  });

  const consumeMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Record<string, any> }) => consumeMaterial(orderId, data),
    onSuccess: () => { setConsumeDialogOpen(false); setConsumingOrder(null); toast.success("Material consumption logged"); },
    onError: (err: any) => toast.error(err.message || "Failed to log consumption"),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find((o: any) => o.id.toString() === active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const draggedOrder = orders.find((o: any) => o.id.toString() === active.id);
    if (!draggedOrder) return;

    // Determine target status
    let targetStatus: string | null = null;
    if (STATUSES.includes(over.id as any)) {
      targetStatus = over.id as string;
    } else {
      const targetOrder = orders.find((o: any) => o.id.toString() === over.id);
      if (targetOrder) targetStatus = targetOrder.status;
    }

    if (targetStatus && targetStatus !== draggedOrder.status) {
      if (targetStatus === "completed") {
        setCompletingOrder(draggedOrder);
        setCompleteDialogOpen(true);
      } else {
        updateStatusMutation.mutate({ id: draggedOrder.id.toString(), status: targetStatus });
      }
    }
  };

  const openConsumeDialog = (order: any) => {
    setConsumingOrder(order);
    setConsumeMaterialId("");
    setConsumeQty("");
    setConsumeDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPoNumber || formPoNumber.trim().length === 0) {
      toast.error("PO Number is required");
      return;
    }
    if (!formProductId) {
      toast.error("Product is required");
      return;
    }
    const qty = parseFloat(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    createMutation.mutate({
      po_number: formPoNumber.trim(),
      product_id: parseInt(formProductId),
      quantity: qty,
      priority: formPriority,
      start_date: formStartDate || null,
      due_date: formDueDate || null,
      notes: formNotes?.trim() || null,
      created_by: 1,
    });
  };

  const handleConsumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumingOrder) return;

    if (!consumeMaterialId) {
      toast.error("Raw material is required");
      return;
    }
    const qty = parseFloat(consumeQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    consumeMutation.mutate({
      orderId: consumingOrder.id.toString(),
      data: {
        raw_material_id: parseInt(consumeMaterialId),
        quantity_consumed: qty,
        consumed_by: 1,
      },
    });
  };

  return (
    <div className="space-y-6 w-full">

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading production orders...
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn key={status} status={status} orders={columns[status]} products={products} onConsume={openConsumeDialog} />
            ))}
          </div>
          <DragOverlay>
            {activeOrder ? (
              <div className="bg-background border-2 border-primary rounded-lg p-3 shadow-xl w-[260px] opacity-90">
                <span className="font-mono text-xs text-muted-foreground">{activeOrder.po_number}</span>
                <p className="text-sm font-medium mt-1">{products.find((p: any) => p.id === activeOrder.product_id)?.name || "Product"}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Complete Order Dialog */}
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
              disabled={!completionWarehouseId || updateStatusMutation.isPending}
              onClick={() => {
                if (completingOrder && completionWarehouseId) {
                  updateStatusMutation.mutate({
                    id: completingOrder.id.toString(),
                    status: "completed",
                    warehouse_id: completionWarehouseId
                  }, {
                    onSuccess: () => {
                      setCompleteDialogOpen(false);
                      setCompletingOrder(null);
                      setCompletionWarehouseId("");
                    }
                  });
                }
              }}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(v) => { if (!v) setCreateDialogOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Production Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">PO Number *</label>
                <Input value={formPoNumber} onChange={(e) => setFormPoNumber(e.target.value)} placeholder="PO-001" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Product *</label>
                <select
                  className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formProductId} onChange={(e) => setFormProductId(e.target.value)} required
                >
                  <option value="">Select product...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                <Input type="number" step="0.01" min="0.01" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="100" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formPriority} onChange={(e) => setFormPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Special instructions..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Consume Material Dialog */}
      <Dialog open={consumeDialogOpen} onOpenChange={(v) => { if (!v) { setConsumeDialogOpen(false); setConsumingOrder(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Material Consumption</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConsumeSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Order: <strong>{consumingOrder?.po_number}</strong></p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Raw Material *</label>
              <select
                className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={consumeMaterialId} onChange={(e) => setConsumeMaterialId(e.target.value)} required
              >
                <option value="">Select material...</option>
                {(rawMaterials.length > 0 ? rawMaterials : products).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quantity Consumed *</label>
              <Input type="number" step="0.01" min="0.01" value={consumeQty} onChange={(e) => setConsumeQty(e.target.value)} placeholder="10" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setConsumeDialogOpen(false); setConsumingOrder(null); }}>Cancel</Button>
              <Button type="submit" disabled={consumeMutation.isPending}>
                {consumeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Log Consumption
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
