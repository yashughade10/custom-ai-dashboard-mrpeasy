"use client";

import PurchaseOrdersTable from "@/components/procurement/PurchaseOrdersTable";

export default function PurchaseOrdersPage() {
  return (
    <div className="px-4 pb-4 pt-4 flex-1 flex flex-col min-h-0">
      <PurchaseOrdersTable />
    </div>
  );
}
