"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";

const stockTabs = [
  { name: "Items", href: "/dashboard/mrp/inventory" },
  { name: "Stock settings", href: "/dashboard/mrp/inventory/settings" },
  { name: "Stock lots", href: "/dashboard/mrp/inventory/lots" },
  { name: "Shipments", href: "/dashboard/mrp/inventory/shipments" },
  { name: "Inventory", href: "/dashboard/mrp/inventory/snapshot" },
  { name: "Critical on-hand", href: "/dashboard/mrp/inventory/critical" },
  { name: "Write-offs", href: "/dashboard/mrp/inventory/writeoffs" },
  { name: "Stock movement", href: "/dashboard/mrp/inventory/movement" },
  { name: "Statistics", href: "/dashboard/mrp/inventory/statistics" },
];

export const FieldRow = ({ label, children, required = false }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2 gap-2 sm:gap-4 border-b border-gray-100 last:border-0">
    <div className="sm:w-1/3 text-right text-sm text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </div>
    <div className="sm:w-2/3">
      {children}
    </div>
  </div>
);

export default function LotDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const id = params.id as string;

  const [formData, setFormData] = useState({
    lot_number: "",
    storage_location: "",
    part_no: "",
    unit_cost: 0,
    in_stock: 0,
    available: 0,
    booked: 0,
    uom: "pcs",
    status: "Planned",
    available_from: "",
  });

  const { data: lotData, isLoading: isLotLoading } = useQuery({
    queryKey: ["mrpLot", id],
    queryFn: () => mrpApi.getLotById(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (lotData?.data && !isNew) {
      setFormData({
        lot_number: lotData.data.lot_number || "",
        storage_location: lotData.data.storage_location || "",
        part_no: lotData.data.part_no || "",
        unit_cost: lotData.data.unit_cost || 0,
        in_stock: lotData.data.in_stock || 0,
        available: lotData.data.available || 0,
        booked: lotData.data.booked || 0,
        uom: lotData.data.uom || "pcs",
        status: lotData.data.status || "Planned",
        available_from: lotData.data.available_from ? lotData.data.available_from.split('T')[0] : "",
      });
    }
  }, [lotData, isNew]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      return isNew ? mrpApi.createLot(data) : mrpApi.updateLot(id, data);
    },
    onSuccess: () => {
      toast.success(`Lot ${isNew ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["mrpLots"] });
      router.push("/dashboard/mrp/inventory/lots");
    },
    onError: (err) => {
      console.error(err);
      toast.error(`Failed to ${isNew ? 'create' : 'update'} lot`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteLot(id),
    onSuccess: () => {
      toast.success("Lot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpLots"] });
      router.push("/dashboard/mrp/inventory/lots");
    },
    onError: () => {
      toast.error("Failed to delete lot");
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lot_number || !formData.part_no) {
      toast.error("Lot Number and Part No are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this lot?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <RouteGuard module="inventory">
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-4 pb-4 flex-1">
            <div className="mb-4 mt-2">
              <h1 className="text-xl font-medium text-gray-800">
                {isNew ? "Create Stock Lot" : `Lot ${formData.lot_number || ""} details`}
              </h1>
            </div>

            {(!isNew && isLotLoading) ? (
              <div className="p-8 text-center text-gray-500">Loading lot details...</div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded shadow-sm border border-gray-200">
                {/* Top Action Bar */}
                <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-b border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/dashboard/mrp/inventory/lots")}
                    className="text-[#428bca] border-transparent hover:bg-gray-200"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className="bg-[#2a5fc1] hover:bg-[#1d448f] text-white"
                  >
                    Save
                  </Button>
                  {!isNew && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  )}
                </div>

                <div className="p-6 flex flex-col lg:flex-row gap-12">
                  {/* Left Column */}
                  <div className="flex-1 max-w-2xl">
                    <FieldRow label="Lot Number" required>
                      <Input 
                        name="lot_number" 
                        value={formData.lot_number} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        required
                      />
                    </FieldRow>

                    <FieldRow label="Part No." required>
                      <Input 
                        name="part_no" 
                        value={formData.part_no} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        required
                      />
                    </FieldRow>

                    <FieldRow label="Status">
                      <select 
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full flex h-9 rounded-md border-transparent bg-[#eef2f5] px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="Planned">Planned</option>
                        <option value="Received">Received</option>
                        <option value="Written off">Written off</option>
                      </select>
                    </FieldRow>

                    <FieldRow label="Storage Location">
                      <Input 
                        name="storage_location" 
                        value={formData.storage_location} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                      />
                    </FieldRow>
                  </div>

                  {/* Right Column */}
                  <div className="flex-1 max-w-lg">
                    <FieldRow label="In Stock">
                      <Input 
                        type="number"
                        name="in_stock" 
                        value={formData.in_stock} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        min="0"
                        step="any"
                      />
                    </FieldRow>

                    <FieldRow label="Available">
                      <Input 
                        type="number"
                        name="available" 
                        value={formData.available} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        min="0"
                        step="any"
                      />
                    </FieldRow>

                    <FieldRow label="Booked">
                      <Input 
                        type="number"
                        name="booked" 
                        value={formData.booked} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        min="0"
                        step="any"
                      />
                    </FieldRow>

                    <FieldRow label="UoM">
                      <Input 
                        name="uom" 
                        value={formData.uom} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                      />
                    </FieldRow>

                    <FieldRow label="Unit Cost ($)">
                      <Input 
                        type="number"
                        name="unit_cost" 
                        value={formData.unit_cost} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                        min="0"
                        step="0.01"
                      />
                    </FieldRow>

                    <FieldRow label="Available From (Date)">
                      <Input 
                        type="date"
                        name="available_from" 
                        value={formData.available_from} 
                        onChange={handleChange} 
                        className="bg-[#eef2f5] border-transparent" 
                      />
                    </FieldRow>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-t border-gray-200 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/dashboard/mrp/inventory/lots")}
                    className="text-[#428bca] border-transparent hover:bg-gray-200"
                  >
                    &lt; Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className="bg-[#2a5fc1] hover:bg-[#1d448f] text-white"
                  >
                    Save
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
