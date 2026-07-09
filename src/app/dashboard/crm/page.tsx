"use client";

import CrmOverview from "@/components/crm/CrmOverview";
import { RouteGuard } from "@/components/auth/RouteGuard";

function Page() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">CRM Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Top-level overview of contacts, companies, and deals pipeline.
        </p>
      </div>
      <CrmOverview />
    </div>
  );
}

export default function PageGuarded() {
  return (
    <RouteGuard module="crm">
      <Page />
    </RouteGuard>
  );
}
