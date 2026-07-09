"use client";

import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { RouteGuard } from "@/components/auth/RouteGuard";

function AuditLogPage() {
  return (
    <div className="w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AuditLogTable />
    </div>
  );
}

export default function AuditLogPageGuarded() {
  return (
    <RouteGuard module="admin">
      <AuditLogPage />
    </RouteGuard>
  );
}
