"use client";

import MarketingLeadsTable from "@/components/crm/MarketingLeadsTable";
import { RouteGuard } from "@/components/auth/RouteGuard";

function LeadsPage() {
  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Manage your incoming leads, marketing prospects, and inbound opportunities.
        </p>
      </div>

      <MarketingLeadsTable />
    </div>
  );
}

export default function LeadsPageGuarded() {
  return (
    <RouteGuard module="crm">
      <LeadsPage />
    </RouteGuard>
  );
}

