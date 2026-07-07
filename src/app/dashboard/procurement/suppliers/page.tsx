"use client";

import { useState } from "react";
import SuppliersTable from "@/components/procurement/SuppliersTable";
import SupplierForm from "@/components/procurement/SupplierForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupplier } from "@/services/api";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-suppliers"] });
      setIsCreateOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your vendors and suppliers.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Supplier
        </Button>
      </div>

      <SuppliersTable onOpenCreate={() => setIsCreateOpen(true)} />

      {isCreateOpen && (
        <SupplierForm
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}
