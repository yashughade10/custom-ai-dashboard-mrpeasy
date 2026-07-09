"use client";

import { useState } from "react";
import PurchaseOrderTable from "@/components/procurement/PurchaseOrderTable";
import PurchaseOrderForm from "@/components/procurement/PurchaseOrderForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchaseOrder } from "@/services/api";
import { RouteGuard } from "@/components/auth/RouteGuard";

function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-orders"] });
      setIsCreateOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage purchase orders for raw materials and supplies.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Purchase Order
        </Button>
      </div>

      <PurchaseOrderTable onOpenCreate={() => setIsCreateOpen(true)} />

      {isCreateOpen && (
        <PurchaseOrderForm
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}
    </div>
  );
}

export default function PurchaseOrdersPageGuarded() {
  return (
    <RouteGuard module="procurement">
      <PurchaseOrdersPage />
    </RouteGuard>
  );
}
