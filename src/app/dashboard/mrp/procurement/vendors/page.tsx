"use client";

import React from "react";
import VendorsTable from "@/components/procurement/VendorsTable";

export default function VendorsPage() {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white">
      <VendorsTable />
    </div>
  );
}
