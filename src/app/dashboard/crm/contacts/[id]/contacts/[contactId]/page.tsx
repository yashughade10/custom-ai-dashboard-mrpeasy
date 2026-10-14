"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { toast } from "sonner";

export default function CrmContactPersonDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const contactId = params.contactId as string;
  const queryClient = useQueryClient();

  const { data: customerResponse } = useQuery({
    queryKey: ["mrpCustomer", customerId],
    queryFn: () => mrpApi.getCustomerById(customerId),
    enabled: !!customerId,
  });

  const customer = customerResponse?.data;
  const companyLabel = customer ? `${customer.customer_number} ${customer.name}` : customerId;

  const { data: contactResponse, isLoading } = useQuery({
    queryKey: ["mrpCustomerContact", customerId, contactId],
    queryFn: () => mrpApi.getCustomerContactById(customerId, contactId),
    enabled: !!customerId && !!contactId,
  });

  const contact = contactResponse?.data;

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contactType, setContactType] = useState("Phone");
  const [contactValue, setContactValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setPosition(contact.position || "");
      if (contact.email) {
        setContactType("E-mail");
        setContactValue(contact.email);
      } else if (contact.address) {
        setContactType("Address");
        setContactValue(contact.address);
      } else {
        setContactType("Phone");
        setContactValue(contact.phone || "");
      }
    }
  }, [contact]);

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

      await mrpApi.updateCustomerContact(customerId, contactId, payload);
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerContacts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerContact", customerId, contactId] });
      toast.success("Contact person updated successfully");
      router.push(`/dashboard/crm/contacts/${customerId}`);
    } catch (error: any) {
      console.error("Failed to update contact person:", error);
      toast.error(error.message || "Failed to update contact person");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete contact "${name}"?`)) return;

    setDeleting(true);
    try {
      await mrpApi.deleteCustomerContact(customerId, contactId);
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerContacts", customerId] });
      toast.success("Contact person deleted successfully");
      router.push(`/dashboard/crm/contacts/${customerId}`);
    } catch (error: any) {
      console.error("Failed to delete contact person:", error);
      toast.error(error.message || "Failed to delete contact person");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading contact details...</div>;
  }

  return (
    <RouteGuard module="crm">
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl w-full">
          {/* Header */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Contact person {name || "details"}
          </h1>

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
              disabled={saving || deleting}
              className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              disabled={saving || deleting}
              className="h-8 px-6 text-sm font-medium text-red-600 border-red-100 bg-red-50/50 hover:bg-red-100"
            >
              {deleting ? "Deleting..." : "Delete"}
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
                  className="h-9 bg-blue-50/30 border-blue-300 focus-visible:ring-blue-500 rounded-sm" 
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-sm text-right text-gray-700">Position</label>
                <Input 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)}
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
              disabled={saving || deleting}
              className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              disabled={saving || deleting}
              className="h-8 px-6 text-sm font-medium text-red-600 border-red-100 bg-red-50/50 hover:bg-red-100"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
