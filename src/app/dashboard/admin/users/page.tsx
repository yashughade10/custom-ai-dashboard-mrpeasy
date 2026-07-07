"use client";

import { UsersTable } from "@/components/admin/UsersTable";

export default function UsersPage() {
  return (
    <div className="w-full p-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UsersTable />
    </div>
  );
}
