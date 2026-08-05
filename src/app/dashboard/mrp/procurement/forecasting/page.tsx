"use client";

import React from "react";
import ForecastingTable from "@/components/procurement/ForecastingTable";

export default function ForecastingPage() {
  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)]">
      <ForecastingTable />
    </div>
  );
}
