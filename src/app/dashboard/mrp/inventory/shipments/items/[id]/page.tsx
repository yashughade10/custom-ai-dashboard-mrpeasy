"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FieldRow } from "../../../lots/[id]/page"; // Reuse FieldRow for consistency

export default function ShipmentItemEditPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const id = params.id as string;

  const [formData, setFormData] = useState({
    shipment_number: "",
    part_no: "",
    part_description: "",
    picked_quantity: 0,
    remains_to_ship: 0,
  });

  const { data: itemData, isLoading } = useQuery({
    queryKey: ["mrpShipmentItem", id],
    queryFn: () => mrpApi.getShipmentItemById(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (itemData?.data && !isNew) {
      const d = itemData.data;
      setFormData({
        shipment_number: d.shipment_number || "",
        part_no: d.part_no || "",
        part_description: d.part_description || "",
        picked_quantity: d.picked_quantity || 0,
        remains_to_ship: d.remains_to_ship || 0,
      });
    }
  }, [itemData, isNew]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      return isNew ? mrpApi.createShipmentItem(data) : mrpApi.updateShipmentItem(id, data);
    },
    onSuccess: () => {
      toast.success(`Shipment item ${isNew ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["mrpShipmentItems"] });
      router.push("/dashboard/mrp/inventory/shipments/items");
    },
    onError: (err) => {
      console.error(err);
      toast.error(`Failed to ${isNew ? 'create' : 'update'} shipment item`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteShipmentItem(id),
    onSuccess: () => {
      toast.success("Shipment item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpShipmentItems"] });
      router.push("/dashboard/mrp/inventory/shipments/items");
    },
    onError: () => toast.error("Failed to delete shipment item")
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes("quantity") || name.includes("remains") ? Number(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipment_number || !formData.part_no) {
      toast.error("Shipment Number and Part No are required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this shipment item?")) {
      deleteMutation.mutate();
    }
  };

  if (!isNew && isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading shipment item details...</div>;
  }

  return (
    <div className="mt-4">
      <div className="mb-4 mt-2 px-4">
        <h1 className="text-xl font-medium text-gray-800">
          {isNew ? "Create Shipment Item" : `Shipment Item for Part ${formData.part_no}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow-sm border border-gray-200">
        <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-b border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard/mrp/inventory/shipments/items")}
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
          <div className="flex-1 max-w-2xl">
            <FieldRow label="Shipment Number" required>
              <Input name="shipment_number" value={formData.shipment_number} onChange={handleChange} className="bg-[#eef2f5] border-transparent" required />
            </FieldRow>
            
            <FieldRow label="Part No." required>
              <Input name="part_no" value={formData.part_no} onChange={handleChange} className="bg-[#eef2f5] border-transparent" required />
            </FieldRow>

            <FieldRow label="Part description">
              <Input name="part_description" value={formData.part_description} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>
          </div>

          <div className="flex-1 max-w-lg">
            <FieldRow label="Picked quantity">
              <Input type="number" step="0.01" name="picked_quantity" value={formData.picked_quantity} onChange={handleChange} className="bg-[#eef2f5] border-transparent text-right" />
            </FieldRow>

            <FieldRow label="Remains to ship">
              <Input type="number" step="0.01" name="remains_to_ship" value={formData.remains_to_ship} onChange={handleChange} className="bg-[#eef2f5] border-transparent text-right" />
            </FieldRow>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mrp/inventory/shipments/items")} className="text-[#428bca] border-transparent hover:bg-gray-200">
            Back
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} className="bg-[#2a5fc1] hover:bg-[#1d448f] text-white">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
