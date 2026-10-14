"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { toast } from "sonner";

export default function CreateCrmContactPersonPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const queryClient = useQueryClient();

  const { data: customerResponse } = useQuery({
    queryKey: ["mrpCustomer", customerId],
    queryFn: () => mrpApi.getCustomerById(customerId),
    enabled: !!customerId,
  });

  const customer = customerResponse?.data;
  const companyLabel = customer ? `${customer.customer_number} ${customer.name}` : customerId;

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contactType, setContactType] = useState("Phone");
  const [contactValue, setContactValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        position: position.trim() || null,
        phone: contactType === "Phone" ? contactValue.trim() : null,
        email: contactType === "E-mail" ? contactValue.trim() : null,
        address: contactType === "Address" ? contactValue.trim() : null,
      };

      await mrpApi.createCustomerContact(customerId, payload);
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerContacts", customerId] });
      toast.success("Contact person created successfully");
      router.push(`/dashboard/crm/contacts/${customerId}`);
    } catch (error: any) {
      console.error("Failed to create contact person:", error);
      toast.error(error.message || "Failed to create contact person");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard module="crm">
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl w-full">
          {/* Header */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a contact person</h1>

          {/* Top Toolbar */}
          <div className="flex gap-2 mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/dashboard/crm/contacts/${customerId}`)} 
              className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100"
            >
              Back
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving}
              className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-baseline gap-4">
                <label className="text-sm text-right text-gray-700">Company</label>
                <div className="text-sm text-gray-900 uppercase font-medium">{companyLabel}</div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-sm text-right text-gray-700">Name *</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Full name"
                  className="h-9 bg-blue-50/30 border-blue-300 focus-visible:ring-blue-500 rounded-sm" 
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-sm text-right text-gray-700">Position</label>
                <Input 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)} 
                  placeholder="e.g. Purchasing Manager"
                  className="h-9 bg-gray-100/50 border-gray-200 rounded-sm" 
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-4 pt-2">
                <label className="text-sm text-right text-gray-700 pt-2">Contact information</label>
                <div className="w-full max-w-md">
                  <div className="grid grid-cols-[140px_1fr] gap-4 mb-2">
                    <span className="text-sm text-gray-700 font-medium">Type</span>
                    <span className="text-sm text-gray-700 font-medium">Value</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-4">
                    <Select value={contactType} onValueChange={setContactType}>
                      <SelectTrigger className="h-9 bg-gray-100/50 border-gray-200 rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="E-mail">E-mail</SelectItem>
                        <SelectItem value="Address">Address</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      value={contactValue} 
                      onChange={(e) => setContactValue(e.target.value)} 
                      placeholder={contactType === "Phone" ? "Phone number" : contactType === "E-mail" ? "email@example.com" : "Address"}
                      className="h-9 bg-gray-100/50 border-gray-200 rounded-sm" 
                    />
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex gap-2 mt-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/dashboard/crm/contacts/${customerId}`)} 
              className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100"
            >
              Back
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving}
              className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
