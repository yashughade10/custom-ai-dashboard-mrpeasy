"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

export default function VendorContactForm({ vendorNumber, contactId }: { vendorNumber: string, contactId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    job_title: "",
    phone: "",
    email: "",
    fax: "",
    address: "",
    additional_information: ""
  });

  const { data: vendorData } = useQuery({
    queryKey: ["vendor", vendorNumber],
    queryFn: () => mrpApi.getVendor(vendorNumber),
    enabled: !!vendorNumber,
  });

  const vendorName = vendorData?.data?.name || "";

  const addContactMutation = useMutation({
    mutationFn: (data: any) => mrpApi.addVendorContact({ vendorNumber, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorContacts", vendorNumber] });
      router.push(`/dashboard/mrp/procurement/vendors/${vendorNumber}`);
    },
    onError: () => {
      alert("Failed to add contact");
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }
    
    addContactMutation.mutate(formData);
  };

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 text-[13px] text-gray-700 font-sans">
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-[22px] text-[#1e293b] font-normal mb-6">
          Add a contact to vendor "{vendorNumber} - {vendorName}"
        </h1>

        {/* Top Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={() => router.back()} 
            className="px-6 py-1.5 bg-[#eef2f9] text-[#1e5aa0] rounded hover:bg-[#e4ebf7] border-none font-medium cursor-pointer"
          >
            Back
          </button>
          <button 
            onClick={handleSave} 
            disabled={addContactMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {addContactMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Form Grid */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">Vendor</label>
            <div className="w-[400px] text-gray-800">
              {vendorNumber} - {vendorName}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">Name *</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-blue-400 focus:border-blue-500 rounded-sm h-8 px-2 outline-none" 
              autoFocus
            />
          </div>

          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">Job title</label>
            <input 
              type="text" 
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-8 px-2 outline-none" 
            />
          </div>

          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">Phone</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-8 px-2 outline-none" 
            />
          </div>

          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">E-mail</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-8 px-2 outline-none" 
            />
          </div>

          <div className="flex items-center">
            <label className="w-48 text-right pr-4 text-gray-600">Fax</label>
            <input 
              type="text" 
              name="fax"
              value={formData.fax}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-8 px-2 outline-none" 
            />
          </div>

          <div className="flex items-start pt-1">
            <label className="w-48 text-right pr-4 text-gray-600 pt-1">Address</label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-16 p-2 outline-none resize-y" 
            />
          </div>

          <div className="flex items-start pt-1">
            <label className="w-48 text-right pr-4 text-gray-600 pt-1">Additional information</label>
            <textarea 
              name="additional_information"
              value={formData.additional_information}
              onChange={handleChange}
              className="w-[400px] bg-[#eef2f6] border border-transparent focus:border-gray-300 rounded-sm h-16 p-2 outline-none resize-y" 
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex items-center gap-3 mt-12 mb-8">
          <button 
            onClick={() => router.back()} 
            className="px-6 py-1.5 bg-[#eef2f9] text-[#1e5aa0] rounded hover:bg-[#e4ebf7] border-none font-medium cursor-pointer"
          >
            Back
          </button>
          <button 
            onClick={handleSave} 
            disabled={addContactMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {addContactMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
