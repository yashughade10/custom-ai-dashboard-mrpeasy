"use client";

import { PermissionMatrix } from "@/components/admin/PermissionMatrix";

export default function RolesPage() {
  return (
    <div className="w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-muted-foreground">Manage user roles and their access levels across different modules.</p>
      </div>
      <PermissionMatrix />
    </div>
  );
}
