"use client";

import CompaniesTable from "@/components/crm/CompaniesTable";
import { RouteGuard } from "@/components/auth/RouteGuard";

function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          View your B2B customers, partners, and key accounts.
        </p>
      </div>
      <CompaniesTable />
    </div>
  );
}

export default function CompaniesPageGuarded() {
  return (
    <RouteGuard module="crm">
      <CompaniesPage />
    </RouteGuard>
  );
}
