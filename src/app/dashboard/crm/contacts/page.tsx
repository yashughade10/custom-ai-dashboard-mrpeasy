"use client";

import CustomerContactsTable from "@/components/crm/CustomerContactsTable";
import { RouteGuard } from "@/components/auth/RouteGuard";

function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Manage your customer accounts, company contacts, and trading details.
        </p>
      </div>

      <CustomerContactsTable />
    </div>
  );
}

export default function ContactsPageGuarded() {
  return (
    <RouteGuard module="crm">
      <ContactsPage />
    </RouteGuard>
  );
}


