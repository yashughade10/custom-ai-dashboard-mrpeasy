"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FieldRow } from "../../lots/[id]/page"; // Reuse FieldRow for consistency

export default function ShipmentEditPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const id = params.id as string;

  const [formData, setFormData] = useState({
    shipment_number: "",
    created_date: "",
    delivery_date: "",
    status: "Ready for shipment",
    order_number: "",
    reference: "",
    customer_number: "",
    customer_name: "",
    waybill_notes: "",
    tracking_number: "",
    delivery_notes: "",
  });

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ["mrpShipment", id],
    queryFn: () => mrpApi.getShipmentById(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (shipmentData?.data && !isNew) {
      const d = shipmentData.data;
      setFormData({
        shipment_number: d.shipment_number || "",
        created_date: d.created_date ? d.created_date.split('T')[0] : "",
        delivery_date: d.delivery_date ? d.delivery_date.split('T')[0] : "",
        status: d.status || "Ready for shipment",
        order_number: d.order_number || "",
        reference: d.reference || "",
        customer_number: d.customer_number || "",
        customer_name: d.customer_name || "",
        waybill_notes: d.waybill_notes || "",
        tracking_number: d.tracking_number || "",
        delivery_notes: d.delivery_notes || "",
      });
    }
  }, [shipmentData, isNew]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      return isNew ? mrpApi.createShipment(data) : mrpApi.updateShipment(id, data);
    },
    onSuccess: () => {
      toast.success(`Shipment ${isNew ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["mrpShipments"] });
      router.push("/dashboard/mrp/inventory/shipments");
    },
    onError: (err) => {
      console.error(err);
      toast.error(`Failed to ${isNew ? 'create' : 'update'} shipment`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteShipment(id),
    onSuccess: () => {
      toast.success("Shipment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpShipments"] });
      router.push("/dashboard/mrp/inventory/shipments");
    },
    onError: () => toast.error("Failed to delete shipment")
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipment_number) {
      toast.error("Shipment Number is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this shipment?")) {
      deleteMutation.mutate();
    }
  };

  if (!isNew && isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading shipment details...</div>;
  }

  return (
    <div className="mt-4">
      <div className="mb-4 mt-2 px-4">
        <h1 className="text-xl font-medium text-gray-800">
          {isNew ? "Create Shipment" : `Shipment ${formData.shipment_number || ""} details`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow-sm border border-gray-200">
        <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-b border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard/mrp/inventory/shipments")}
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
            <FieldRow label="Number" required>
              <Input name="shipment_number" value={formData.shipment_number} onChange={handleChange} className="bg-[#eef2f5] border-transparent" required />
            </FieldRow>
            
            <FieldRow label="Customer name">
              <Input name="customer_name" value={formData.customer_name} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Customer number">
              <Input name="customer_number" value={formData.customer_number} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Order">
              <Input name="order_number" value={formData.order_number} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Status">
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full flex h-9 rounded-md border-transparent bg-[#eef2f5] px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Ready for shipment">Ready for shipment</option>
                <option value="Shipped">Shipped</option>
              </select>
            </FieldRow>

          </div>

          <div className="flex-1 max-w-lg">
            <FieldRow label="Created">
              <Input type="date" name="created_date" value={formData.created_date} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Delivery date">
              <Input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Tracking number">
              <Input name="tracking_number" value={formData.tracking_number} onChange={handleChange} className="bg-[#eef2f5] border-transparent" />
            </FieldRow>

            <FieldRow label="Waybill notes">
              <textarea name="waybill_notes" value={formData.waybill_notes} onChange={handleChange} className="w-full bg-[#eef2f5] border-transparent rounded-md px-3 py-2 text-sm" />
            </FieldRow>

            <FieldRow label="Delivery Notes">
              <textarea name="delivery_notes" value={formData.delivery_notes} onChange={handleChange} className="w-full bg-[#eef2f5] border-transparent rounded-md px-3 py-2 text-sm" />
            </FieldRow>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mrp/inventory/shipments")} className="text-[#428bca] border-transparent hover:bg-gray-200">
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
