"use client";

import { UsersTable } from "@/components/admin/UsersTable";
import { RouteGuard } from "@/components/auth/RouteGuard";

function UsersPage() {
  return (
    <div className="w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UsersTable />
    </div>
  );
}

export default function UsersPageGuarded() {
  return (
    <RouteGuard module="admin">
      <UsersPage />
    </RouteGuard>
  );
}
