"use client";

import React from "react";
import InvoicesTable from "@/components/procurement/InvoicesTable";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";

export default function InvoicesPage() {
  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)]">
      <InvoicesTable />
    </div>
  );
}
