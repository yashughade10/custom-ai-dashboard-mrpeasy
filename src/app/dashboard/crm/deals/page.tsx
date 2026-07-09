"use client";

import DealsList from "@/components/crm/DealsList";
import { RouteGuard } from "@/components/auth/RouteGuard";

function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Deals</h1>
        <p className="text-sm text-muted-foreground">
          Track sales opportunities and monitor your pipeline.
        </p>
      </div>
      <DealsList />
    </div>
  );
}

export default function DealsPageGuarded() {
  return (
    <RouteGuard module="crm">
      <DealsPage />
    </RouteGuard>
  );
}
