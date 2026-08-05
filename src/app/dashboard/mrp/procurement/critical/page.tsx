"use client";

import CriticalOnHandTable from "@/components/procurement/CriticalOnHandTable";

export default function CriticalOnHandPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 mt-2 print:hidden px-6">
        <h1 className="text-xl font-normal text-gray-800 m-0">Procurement Critical on-hand</h1>
      </div>
      <div className="flex-1 flex flex-col min-h-0 px-6">
        <CriticalOnHandTable />
      </div>
    </div>
  );
}
