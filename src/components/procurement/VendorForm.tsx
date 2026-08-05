"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { HardDrive, Cloud, Link as LinkIcon, Database, Trash2, X, UploadCloud, FileText } from "lucide-react";

export default function VendorForm({ vendorNumber }: { vendorNumber?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [attachedFiles, setAttachedFiles] = useState<{url: string, description: string}[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  const openOAuthPopup = (provider: 'google' | 'dropbox' | 'microsoft') => {
    let url = '';
    if (provider === 'google') url = 'https://accounts.google.com/AccountChooser';
    else if (provider === 'dropbox') url = 'https://www.dropbox.com/login';
    else if (provider === 'microsoft') url = 'https://login.microsoftonline.com/';
    
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(url, `${provider}Login`, `width=${width},height=${height},left=${left},top=${top}`);
  };

  React.useEffect(() => {
    if (linkUrl) {
      try {
        const urlObj = new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
        let name = urlObj.pathname.split('/').pop() || urlObj.hostname;
        if (!name || name === '/') name = linkUrl;
        setLinkDescription(name);
      } catch (e) {
        setLinkDescription(linkUrl);
      }
    } else {
      setLinkDescription("");
    }
  }, [linkUrl]);

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      alert("Please enter a URL");
      return;
    }
    setAttachedFiles(prev => [...prev, { url: linkUrl, description: linkDescription || linkUrl }]);
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkDescription("");
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [formData, setFormData] = useState({
    name: "",
    contactType: "Phone",
    contactValue: "",
    notes: "",
    account: "",
    defaultLeadTime: "",
    paymentPeriod: "",
    paymentPeriodType: "the invoice date",
    language: "English",
    currency: "$",
    taxRate: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addVendorMutation = useMutation({
    mutationFn: mrpApi.addVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      router.push("/dashboard/mrp/procurement/vendors");
    },
  });

  const handleSave = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }
    
    // In a real scenario we'd map this to exactly what the backend expects.
    // Assuming backend takes the standard vendor_number (auto-generated?), name, phone, email, notes, account, etc.
    const payload = {
      name: formData.name,
      phone: formData.contactType === "Phone" ? formData.contactValue : "",
      email: formData.contactType === "Email" ? formData.contactValue : "",
      notes: formData.notes,
      account: formData.account,
      default_lead_time: parseInt(formData.defaultLeadTime) || 0,
      payment_period: parseInt(formData.paymentPeriod) || 0,
      payment_period_type: formData.paymentPeriodType,
      currency: formData.currency,
      tax_rate: parseFloat(formData.taxRate) || 0,
    };
    
    addVendorMutation.mutate(payload);
  };

  const updateVendorMutation = useMutation({
    mutationFn: (data: any) => mrpApi.updateVendor({ vendorNumber: vendorNumber!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      alert("Vendor updated successfully");
    },
    onError: () => {
      alert("Failed to update vendor");
    }
  });

  const { data: vendorData, isLoading: isLoadingVendor } = useQuery({
    queryKey: ["vendor", vendorNumber],
    queryFn: () => mrpApi.getVendor(vendorNumber!),
    enabled: !!vendorNumber,
  });

  const { data: contactsData } = useQuery({
    queryKey: ["vendorContacts", vendorNumber],
    queryFn: () => mrpApi.getVendorContacts(vendorNumber as string),
    enabled: !!vendorNumber,
  });

  const { data: notesData } = useQuery({
    queryKey: ["vendorNotes", vendorNumber],
    queryFn: () => mrpApi.getVendorNotes(vendorNumber as string),
    enabled: !!vendorNumber,
  });

  React.useEffect(() => {
    if (vendorData?.data) {
      const v = vendorData.data;
      setFormData({
        name: v.name || "",
        contactType: v.phone ? "Phone" : (v.email ? "Email" : "Phone"),
        contactValue: v.phone || v.email || "",
        notes: v.notes || "",
        account: v.account || "",
        defaultLeadTime: v.default_lead_time?.toString() || "",
        paymentPeriod: v.payment_period?.toString() || "",
        paymentPeriodType: v.payment_period_type || "the invoice date",
        language: v.language || "English",
        currency: v.currency || "$",
        taxRate: v.tax_rate?.toString() || ""
      });
    }
  }, [vendorData]);

  const handleSaveEdit = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }
    const payload = {
      name: formData.name,
      phone: formData.contactType === "Phone" ? formData.contactValue : "",
      email: formData.contactType === "Email" ? formData.contactValue : "",
      notes: formData.notes,
      account: formData.account,
      default_lead_time: parseInt(formData.defaultLeadTime) || 0,
      payment_period: parseInt(formData.paymentPeriod) || 0,
      payment_period_type: formData.paymentPeriodType,
      currency: formData.currency,
      tax_rate: parseFloat(formData.taxRate) || 0,
    };
    updateVendorMutation.mutate(payload);
  };

  if (vendorNumber && isLoadingVendor) {
    return <div className="p-8">Loading vendor details...</div>;
  }

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 text-[13px] text-gray-700 font-sans">
      <div className="px-8 py-6 max-w-6xl">
        <h1 className="text-[22px] text-[#1e293b] font-normal mb-6">
          {vendorNumber ? `Vendor ${vendorNumber} - details` : "Add a vendor"}
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
            onClick={vendorNumber ? handleSaveEdit : handleSave} 
            disabled={addVendorMutation.isPending || updateVendorMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {(addVendorMutation.isPending || updateVendorMutation.isPending) ? "Saving..." : "Save"}
          </button>
          
          {vendorNumber && (
            <>
              <button 
                onClick={() => alert("Delete clicked (not implemented)")} 
                className="px-6 py-1.5 bg-transparent text-[#1e5aa0] rounded hover:bg-[#eef2f9] border-none font-medium cursor-pointer"
              >
                Delete
              </button>
              <button 
                onClick={() => router.push(`/dashboard/mrp/procurement/vendors/${vendorNumber}/reports`)} 
                className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
              >
                Reports
              </button>
            </>
          )}
        </div>

        {/* Form Body */}
        <div className="grid grid-cols-2 gap-x-12">
          
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            
            {vendorNumber && (
              <div className="flex items-center">
                <label className="w-40 text-right pr-4 text-gray-600">Number *</label>
                <input 
                  type="text" 
                  value={vendorNumber}
                  disabled
                  className="flex-1 bg-[#e4ebf7] border border-[#d1dbe8] rounded-sm h-8 px-2 outline-none text-gray-500" 
                />
              </div>
            )}

            <div className="flex items-center">
              <label className="w-40 text-right pr-4 text-gray-600">Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="flex-1 bg-[#e4ebf7] border border-[#d1dbe8] rounded-sm h-8 px-2 outline-none focus:border-blue-500" 
              />
            </div>

            <div className="flex items-start mt-2">
              <label className="w-40 text-right pr-4 text-gray-600 mt-1">Contact information</label>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-4 text-gray-500 mb-1">
                  <span className="w-24">Type</span>
                  <span>Value</span>
                </div>
                <div className="flex gap-2">
                  <select 
                    name="contactType"
                    value={formData.contactType}
                    onChange={handleChange}
                    className="w-24 bg-[#eef2f6] border border-transparent rounded-sm h-7 px-1 outline-none text-gray-700"
                  >
                    <option value="Phone">Phone</option>
                    <option value="Fax">Fax</option>
                    <option value="Teams">Teams</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Web">Web</option>
                    <option value="Address">Address</option>
                    <option value="Shipping address">Shipping address</option>
                    <option value="Free-text address">Free-text address</option>
                    <option value="Free-text shipping address">Free-text shipping address</option>
                    <option value="Other">Other</option>
                  </select>
                  <input 
                    type="text" 
                    name="contactValue"
                    value={formData.contactValue}
                    onChange={handleChange}
                    className="flex-1 bg-[#eef2f6] border border-transparent rounded-sm h-7 px-2 outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center mt-2">
              <label className="w-40 text-right pr-4 text-gray-600">Files</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div onClick={() => openOAuthPopup('google')} className="w-8 h-8 flex items-center justify-center bg-[#eef2f6] rounded cursor-pointer text-blue-500 hover:bg-[#e4ebf7]"><Cloud className="w-4 h-4" /></div>
                  <div onClick={() => openOAuthPopup('dropbox')} className="w-8 h-8 flex items-center justify-center bg-[#eef2f6] rounded cursor-pointer text-blue-500 hover:bg-[#e4ebf7]"><UploadCloud className="w-4 h-4" /></div>
                  <div onClick={() => openOAuthPopup('microsoft')} className="w-8 h-8 flex items-center justify-center bg-[#eef2f6] rounded cursor-pointer text-blue-500 hover:bg-[#e4ebf7]"><FileText className="w-4 h-4" /></div>
                  <div onClick={() => setShowLinkModal(true)} className="w-8 h-8 flex items-center justify-center bg-[#eef2f6] rounded cursor-pointer text-blue-500 hover:bg-[#e4ebf7]"><LinkIcon className="w-4 h-4" /></div>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="text-sm font-medium text-gray-700 bg-[#eef2f5] px-2 py-1 rounded w-fit mb-1">File</div>
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                          {file.description}
                        </a>
                        <Trash2 
                          className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => removeFile(idx)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start mt-2">
              <label className="w-40 text-right pr-4 text-gray-600 pt-1">NOTES</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="flex-1 bg-[#eef2f6] border border-transparent rounded-sm h-16 p-2 outline-none resize-none" 
              />
            </div>

            <div className="flex items-center mt-2">
              <label className="w-40 text-right pr-4 text-gray-600">ACCOUNT *</label>
              <select 
                name="account"
                value={formData.account}
                onChange={handleChange}
                className="flex-1 bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none text-gray-700"
              >
                <option value=""></option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>

          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">

            <div className="flex items-center">
              <label className="w-36 text-right pr-4 text-gray-600">Default lead time</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  name="defaultLeadTime"
                  value={formData.defaultLeadTime}
                  onChange={handleChange}
                  className="w-48 bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none" 
                />
                <span className="text-gray-600">days</span>
              </div>
            </div>

            <div className="flex items-start">
              <label className="w-36 text-right pr-4 text-gray-600 mt-1">Payment period</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    name="paymentPeriod"
                    value={formData.paymentPeriod}
                    onChange={handleChange}
                    className="w-48 bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none" 
                  />
                  <span className="text-gray-600">days after</span>
                </div>
                <select 
                  name="paymentPeriodType"
                  value={formData.paymentPeriodType}
                  onChange={handleChange}
                  className="w-[245px] bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none text-gray-700"
                >
                  <option value="the invoice date">the invoice date</option>
                  <option value="the end of the invoice month">the end of the invoice month</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-36 text-right pr-4 text-gray-600">Language</label>
              <select 
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-[245px] bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none text-gray-700"
              >
                <option value="English">English</option>
                <option value="Eesti">Eesti</option>
                <option value="Русский">Русский</option>
                <option value="Suomeksi">Suomeksi</option>
                <option value="عربي">عربي</option>
                <option value="Español">Español</option>
                <option value="Português">Português</option>
                <option value="Latviešu">Latviešu</option>
                <option value="Türkçe">Türkçe</option>
                <option value="Polski">Polski</option>
                <option value="Deutsch">Deutsch</option>
                <option value="Lietuviškai">Lietuviškai</option>
                <option value="Français">Français</option>
                <option value="Italiano">Italiano</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Magyar">Magyar</option>
                <option value="简体中文">简体中文</option>
                <option value="Nederlands">Nederlands</option>
                <option value="Norsk">Norsk</option>
                <option value="Svenska">Svenska</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-36 text-right pr-4 text-gray-600">Currency</label>
              <select 
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-[245px] bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none text-gray-700"
              >
                <option value="$">$</option>
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="NZD">NZD</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-36 text-right pr-4 text-gray-600">Tax rate</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  className="w-[245px] bg-[#eef2f6] border border-transparent rounded-sm h-8 px-2 outline-none" 
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

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
            onClick={vendorNumber ? handleSaveEdit : handleSave} 
            disabled={addVendorMutation.isPending || updateVendorMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {(addVendorMutation.isPending || updateVendorMutation.isPending) ? "Saving..." : "Save"}
          </button>
          
          {vendorNumber && (
            <>
              <button 
                onClick={() => alert("Delete clicked (not implemented)")} 
                className="px-6 py-1.5 bg-transparent text-[#1e5aa0] rounded hover:bg-[#eef2f9] border-none font-medium cursor-pointer"
              >
                Delete
              </button>
              <button 
                onClick={() => router.push(`/dashboard/mrp/procurement/vendors/${vendorNumber}/reports`)} 
                className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
              >
                Reports
              </button>
            </>
          )}
        </div>
        
        {vendorNumber && (
          <div className="mt-8">
            <h2 className="text-[15px] font-medium text-[#1e293b] mb-2">Contacts</h2>
            <div className="border border-[#e5e7eb] rounded-sm overflow-x-auto mb-8">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-[#f0f3f8] text-[#4b5563] border-b border-[#e5e7eb]">
                  <tr>
                    <th className="py-2 px-4 font-normal text-xs w-[15%]">Name ↓</th>
                    <th className="py-2 px-4 font-normal text-xs w-[15%]">Job title</th>
                    <th className="py-2 px-4 font-normal text-xs w-[15%]">Phone</th>
                    <th className="py-2 px-4 font-normal text-xs w-[15%]">E-mail</th>
                    <th className="py-2 px-4 font-normal text-xs w-[15%]">Fax</th>
                    <th className="py-2 px-4 font-normal text-xs w-[20%]">Address</th>
                    <th 
                      className="py-2 px-4 font-normal text-xs text-right text-[#1e5aa0] w-[5%] cursor-pointer hover:underline"
                      onClick={() => router.push(`/dashboard/mrp/procurement/vendors/${vendorNumber}/contacts/create`)}
                    >
                      +
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contactsData?.data && contactsData.data.length > 0 ? (
                    contactsData.data.map((contact: any) => (
                      <tr key={contact.id} className="border-b border-[#e5e7eb] hover:bg-[#f8fafc] cursor-pointer">
                        <td className="py-2 px-4 text-[#1e5aa0] hover:underline">{contact.name}</td>
                        <td className="py-2 px-4">{contact.job_title}</td>
                        <td className="py-2 px-4">{contact.phone}</td>
                        <td className="py-2 px-4 text-[#1e5aa0] hover:underline">{contact.email}</td>
                        <td className="py-2 px-4">{contact.fax}</td>
                        <td colSpan={2} className="py-2 px-4">{contact.address}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-400">No contacts available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="text-[15px] font-medium text-[#1e293b] mb-2">Notes</h2>
            <div className="border border-[#e5e7eb] rounded-sm overflow-x-auto mb-16">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-[#f0f3f8] text-[#4b5563] border-b border-[#e5e7eb]">
                  <tr>
                    <th className="py-2 px-4 font-normal text-xs w-[20%]">Created ↓</th>
                    <th className="py-2 px-4 font-normal text-xs w-[20%]">Modified</th>
                    <th className="py-2 px-4 font-normal text-xs w-[55%]">Note</th>
                    <th 
                      className="py-2 px-4 font-normal text-xs text-right text-[#1e5aa0] w-[5%] cursor-pointer hover:underline"
                      onClick={() => router.push(`/dashboard/mrp/procurement/vendors/${vendorNumber}/notes/new`)}
                    >
                      +
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notesData?.data && notesData.data.length > 0 ? (
                    notesData.data.map((note: any) => (
                      <tr key={note.id} className="border-b border-[#e5e7eb] hover:bg-[#f8fafc]">
                        <td className="py-2 px-4">{new Date(note.created_at).toLocaleString()}</td>
                        <td className="py-2 px-4">{new Date(note.updated_at).toLocaleString()}</td>
                        <td colSpan={2} className="py-2 px-4">{note.note}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-400">No notes available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md shadow-lg w-[400px] overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-lg font-normal text-gray-800">Please enter a full URL</h2>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">URL:</label>
                <input 
                  type="text" 
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-[#f4f7fb] border border-blue-400 rounded p-2 text-sm outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description:</label>
                <input 
                  type="text" 
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  className="w-full bg-[#eef2f5] border-transparent rounded p-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 justify-end border-t border-gray-100 mt-2">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="px-6 py-1.5 bg-[#f4f7fb] text-blue-600 text-sm font-medium rounded hover:bg-gray-200 w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddLink}
                className="px-6 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 w-full"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
