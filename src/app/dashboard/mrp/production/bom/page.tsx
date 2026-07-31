"use client";

import { useState } from "react";
import BomsTable from "@/components/production/BomsTable";
import { Plus, Download, Filter } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Button } from "@/components/ui/button";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "Workstation groups", href: "/dashboard/mrp/production/workstation-groups" },
  { name: "BOM", href: "/dashboard/mrp/production/bom" },
  { name: "Routings", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

function BomsPage() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={productionTabs} />
        
        {isCreating ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Create BOM</h1>
              <Button onClick={() => setIsCreating(false)} variant="outline" className="bg-[#f0f4ff] text-blue-600 border-none hover:bg-[#e0e7ff] h-8 px-4">Back</Button>
            </div>
            <div className="flex-1 overflow-hidden p-6 text-gray-500">
              <p>Form to create a BOM</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold text-gray-900">BOM</h1>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-medium px-3 h-8 rounded-sm"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
                <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">
                  <Filter className="w-3.5 h-3.5" /> Import from CSV
                </Button>
              </div>
            </div>

            <div className="px-4 py-3 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-x-auto min-h-0 border border-gray-200 rounded-sm shadow-sm">
                <BomsTable />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BomsPageGuarded() {
  return (
    <RouteGuard module="production">
      <BomsPage />
    </RouteGuard>
  );
}
