"use client";

import { useState } from "react";
import WorkstationsTable from "@/components/production/WorkstationsTable";
import WorkstationForm from "@/components/production/WorkstationForm";
import { Plus } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Button } from "@/components/ui/button";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "Workstation groups", href: "/dashboard/mrp/production/workstation-groups" },
  { name: "BOM (934)", href: "/dashboard/mrp/production/bom" },
  { name: "Routings (903)", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

function WorkstationsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={productionTabs} />
        
        {isCreating || editingId ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <WorkstationForm 
                id={editingId || undefined} 
                onBack={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }} 
              />
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">Workstations</h1>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-medium px-3 h-8 rounded-sm"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>

            <div className="px-4 py-3 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-x-auto min-h-0 border border-gray-200 rounded-sm">
                <WorkstationsTable onEdit={(id) => setEditingId(id)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkstationsPageGuarded() {
  return (
    <RouteGuard module="production">
      <WorkstationsPage />
    </RouteGuard>
  );
}
