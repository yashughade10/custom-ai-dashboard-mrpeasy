"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import ProductionCalendar from "@/components/production/ProductionCalendar";
import { Button } from "@/components/ui/button";
import { Plus, Search, RefreshCw, Settings2, Download, X } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "Workstation groups", href: "/dashboard/mrp/production/workstation-groups" },
  { name: "BOM (934)", href: "/dashboard/mrp/production/bom" },
  { name: "Routings (903)", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

function ProductionSchedulePage() {
  const [viewMode, setViewMode] = useState<"calendar" | "gantt">("calendar");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["mrp-manufacturing-orders-all"] });
    toast.success("Schedule refreshed");
  };

  const handleExportPng = () => {
    window.print();
  };

  return (
    <div className="flex flex-col bg-[#f4f7fb] h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Main Tabs */}
        <MrpTabBar tabs={productionTabs} />
        
        {/* Top Title Bar */}
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-gray-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Production schedule</h1>
              <Link href="/dashboard/mrp/production?create=true">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 font-medium px-3 h-7 rounded-sm">
                  <Plus className="h-3.5 w-3.5" /> Create
                </Button>
              </Link>
            </div>
            
            {/* Sub-navigation */}
            <div className="flex items-center gap-4 text-[13px] font-medium pt-1">
              <span className="text-blue-600 border-b-[2.5px] border-blue-600 pb-1 -mb-[1px]">Manufacturing orders</span>
              <span className="text-gray-500 hover:text-gray-800 cursor-pointer pb-1">Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            {showSearch && (
              <div className="flex items-center relative">
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders..."
                  className="h-7 w-48 text-xs pr-7 rounded-sm"
                  autoFocus
                />
                <button onClick={() => setShowSearch(false)} className="absolute right-1.5 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {!showSearch && (
              <Button onClick={() => setShowSearch(true)} variant="outline" size="sm" className="h-7 w-7 p-0 bg-gray-50/50 text-gray-600 rounded-sm">
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <Button onClick={handleExportPng} variant="outline" size="sm" className="h-7 px-3 gap-1.5 bg-gray-50/50 text-gray-600 rounded-sm">
              <Download className="h-3.5 w-3.5" /> PNG
            </Button>
            
            <Button 
              onClick={() => setViewMode(viewMode === "calendar" ? "gantt" : "calendar")} 
              variant={viewMode === "gantt" ? "default" : "outline"} 
              size="sm" 
              className={`h-7 px-3 font-medium rounded-sm ${viewMode === 'gantt' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-50/50 text-gray-600'}`}
            >
              {viewMode === "calendar" ? "Gantt chart" : "Calendar"}
            </Button>
            
            <Button onClick={handleRefresh} variant="outline" size="sm" className="h-7 w-7 p-0 bg-gray-50/50 text-gray-600 rounded-sm">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            
            <Button onClick={() => toast("Settings opened")} variant="outline" size="sm" className="h-7 w-7 p-0 bg-gray-50/50 text-gray-600 rounded-sm">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Calendar Area */}
        <div className="flex-1 min-h-0">
          <ProductionCalendar viewMode={viewMode} searchQuery={searchQuery} />
        </div>
        
      </div>
    </div>
  );
}

export default function ProductionSchedulePageGuarded() {
  return (
    <RouteGuard module="production">
      <ProductionSchedulePage />
    </RouteGuard>
  );
}
