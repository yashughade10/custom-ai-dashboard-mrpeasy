"use client";

import { AuditLogTable } from "@/components/admin/AuditLogTable";

export default function AuditLogPage() {
  return (
    <div className="w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AuditLogTable />
    </div>
  );
}
