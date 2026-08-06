"use client";

import { useState } from "react";
import RoutingsTable from "@/components/production/RoutingsTable";
import { Plus, Download, Filter } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { RoutingForm } from "@/components/production/RoutingForm";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "Workstation groups", href: "/dashboard/mrp/production/workstation-groups" },
  { name: "BOM", href: "/dashboard/mrp/production/bom" },
  { name: "Routings", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

function RoutingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutingId, setEditingRoutingId] = useState<string | undefined>();
  
  // Dialog state
  const [showSelectProduct, setShowSelectProduct] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const { data: productGroupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["product-groups"],
    queryFn: () => mrpApi.getProductGroups(),
    enabled: showSelectProduct,
  });

  const { data: itemsData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["stock-items"],
    queryFn: () => mrpApi.getItems(1, 1000),
    enabled: showSelectProduct,
  });

  const groupOptions = (productGroupsData?.data || []).map((g: any) => ({
    label: g.group_name || g.name || "Unnamed Group",
    value: g.group_number || g.id?.toString() || g.name || Math.random().toString(),
  }));

  const productOptions = (itemsData?.data || []).map((item: any) => ({
    label: item.part_description || item.name || item.part_number || "Unnamed Product",
    value: item.part_number || item.part_no || item.id?.toString() || Math.random().toString(),
  }));

  const handleCreateClick = () => {
    setSelectedGroupId("");
    setSelectedProductId("");
    setShowSelectProduct(true);
  };

  const handleProceedCreate = () => {
    setShowSelectProduct(false);
    setEditingRoutingId(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditingRoutingId(id);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRoutingId(undefined);
  };

  return (
    <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={productionTabs} />
        
        {isFormOpen ? (
          <RoutingForm 
            initialProductId={selectedProductId}
            editingRoutingId={editingRoutingId}
            onBack={handleCloseForm}
            onSaved={handleCloseForm}
          />
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold text-gray-900">Routings</h1>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-medium px-3 h-8 rounded-sm"
                  onClick={handleCreateClick}
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
                <RoutingsTable onEdit={handleEditClick} />
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={showSelectProduct} onOpenChange={setShowSelectProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-gray-100 pb-4 mb-4">
            <DialogTitle className="text-lg">Please select a product:</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-sm text-gray-600 text-right">Product group</label>
              <SearchableSelect 
                options={groupOptions}
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                placeholder=""
                isLoading={isGroupsLoading}
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-sm text-gray-600 text-right">Product</label>
              <SearchableSelect 
                options={productOptions}
                value={selectedProductId}
                onChange={setSelectedProductId}
                placeholder=""
                isLoading={isItemsLoading}
              />
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t border-gray-100 sm:justify-start">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-8" 
              onClick={handleProceedCreate}
              disabled={!selectedProductId}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RoutingsPageGuarded() {
  return (
    <RouteGuard module="production">
      <RoutingsPage />
    </RouteGuard>
  );
}
