"use client";

import { useState, useRef } from "react";
import ProductsTable from "@/components/production/ProductsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";

function ProductsPage() {
  const openCreateRef = useRef<(() => void) | null>(null);

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product master list – raw materials and finished goods.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => openCreateRef.current?.()}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
      <ProductsTable onOpenCreate={(fn) => { openCreateRef.current = fn; }} />
    </div>
  );
}

export default function ProductsPageGuarded() {
  return (
    <RouteGuard module="production">
      <ProductsPage />
    </RouteGuard>
  );
}
