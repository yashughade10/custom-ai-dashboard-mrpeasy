"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mrpApi } from "@/services/mrpApi";
import { SearchableSelect, FieldRow } from "@/components/mrp/ItemForm";
import { VendorTableSelect } from "@/components/procurement/VendorTableSelect";
import { Cloud, Link as LinkIcon, FileText, UploadCloud, Trash2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [productGroups, setProductGroups] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [totals, setTotals] = useState({
    discountPercent: '',
    discountAmount: '',
    taxableFees: '',
    taxPercent: '',
    taxAmount: '',
    additionalFees: ''
  });

  const [formData, setFormData] = useState({
    vendor_number: "",
    vendor_name: "",
    status: "New PO",
    currency: "$",
    po_free_text: "",
    bwe_job_id: "",
    po_emailed: "",
    attention: "",
    expected_date: new Date().toISOString().slice(0, 10),
    order_id: "",
    order_date: "",
    invoice_id: "",
    invoice_date: "",
    due_date: "",
    shipped_on: "",
    arrival_date: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<{url: string, description: string}[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");



  const [lineItems, setLineItems] = useState([
    { id: '1', productGroup: '', item: '', vendorPartNo: '', orderedQuantity: '', price: '', subtotal: '', expectedQuantity: '', expectedDate: '', arrivalDate: '', freeText: '' }
  ]);

  const handleLineItemChange = (id: string, field: string, value: string) => {
    setLineItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'productGroup') {
            if (updated.item) {
              const matchedItem = allItems.find(m => String(m.id) === String(updated.item));
              if (matchedItem && String(matchedItem.group_number) !== value) {
                updated.item = '';
                updated.price = '';
                updated.subtotal = '';
              }
            }
          }
          if (field === 'item') {
            const matchedItem = allItems.find(m => String(m.id) === String(value));
            if (matchedItem) {
              const itemPrice = matchedItem.cost || matchedItem.purchase_price || matchedItem.sell_price || 0;
              updated.price = Number(itemPrice).toFixed(2);
              const qty = parseFloat(updated.orderedQuantity) || 0;
              updated.subtotal = (qty * Number(itemPrice)).toFixed(2);
            }
          }
          if (field === 'orderedQuantity' || field === 'price') {
             const qty = parseFloat(updated.orderedQuantity) || 0;
             const prc = parseFloat(updated.price) || 0;
             updated.subtotal = (qty * prc).toFixed(2);
          }
          return updated;
        }
        return item;
      });

      const lastItem = newItems[newItems.length - 1];
      if (lastItem && (lastItem.productGroup || lastItem.item)) {
        newItems.push({
          id: String(Date.now()),
          productGroup: '', item: '', vendorPartNo: '', orderedQuantity: '', price: '', subtotal: '', expectedQuantity: '', expectedDate: '', arrivalDate: '', freeText: ''
        });
      }

      return newItems;
    });
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    const currentRawSubtotal = lineItems.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
    
    setTotals(prev => {
      const updated = { ...prev };
      
      if (updated.discountPercent) {
        const pct = parseFloat(updated.discountPercent) || 0;
        updated.discountAmount = ((currentRawSubtotal * pct) / 100).toFixed(2);
      }
      
      const currentDiscountAmount = parseFloat(updated.discountAmount) || 0;
      const currentTotal = currentRawSubtotal - currentDiscountAmount;
      const currentTaxableFees = parseFloat(updated.taxableFees) || 0;
      const amountToTax = currentTotal + currentTaxableFees;

      if (updated.taxPercent) {
        const pct = parseFloat(updated.taxPercent) || 0;
        updated.taxAmount = ((amountToTax * pct) / 100).toFixed(2);
      }
      
      if (updated.discountAmount !== prev.discountAmount || updated.taxAmount !== prev.taxAmount) {
         return updated;
      }
      return prev;
    });
  }, [lineItems]);

  const handleTotalsChange = (field: string, value: string) => {
    setTotals(prev => {
      const updated = { ...prev, [field]: value };
      
      const currentRawSubtotal = lineItems.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
      
      if (field === 'discountPercent') {
        const pct = parseFloat(value) || 0;
        updated.discountAmount = value === '' ? '' : ((currentRawSubtotal * pct) / 100).toFixed(2);
      } else if (field === 'discountAmount') {
        const amt = parseFloat(value) || 0;
        updated.discountPercent = value === '' || currentRawSubtotal === 0 ? '' : ((amt / currentRawSubtotal) * 100).toFixed(2);
      }

      const currentDiscountAmount = parseFloat(updated.discountAmount) || 0;
      const currentTotal = currentRawSubtotal - currentDiscountAmount;
      
      if (field === 'taxableFees') {
         const currentTaxableFees = parseFloat(value) || 0;
         const amountToTax = currentTotal + currentTaxableFees;
         if (updated.taxPercent) {
           const pct = parseFloat(updated.taxPercent) || 0;
           updated.taxAmount = ((amountToTax * pct) / 100).toFixed(2);
         }
      }

      const currentTaxableFees = parseFloat(updated.taxableFees) || 0;
      const amountToTax = currentTotal + currentTaxableFees;

      if (field === 'taxPercent') {
        const pct = parseFloat(value) || 0;
        updated.taxAmount = value === '' ? '' : ((amountToTax * pct) / 100).toFixed(2);
      } else if (field === 'taxAmount') {
        const amt = parseFloat(value) || 0;
        updated.taxPercent = value === '' || amountToTax === 0 ? '' : ((amt / amountToTax) * 100).toFixed(2);
      }
      
      return updated;
    });
  };

  const currentRawSubtotal = lineItems.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  const totalQty = lineItems.reduce((acc, item) => acc + (parseFloat(item.orderedQuantity) || 0), 0);
  const currentDiscountAmount = parseFloat(totals.discountAmount) || 0;
  const currentTotal = currentRawSubtotal - currentDiscountAmount;
  const currentTaxableFees = parseFloat(totals.taxableFees) || 0;
  const currentTaxAmount = parseFloat(totals.taxAmount) || 0;
  const currentAdditionalFees = parseFloat(totals.additionalFees) || 0;
  const currentGrandTotal = currentTotal + currentTaxableFees + currentTaxAmount + currentAdditionalFees;

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === dropId) return;

    setLineItems(prev => {
      const draggedIndex = prev.findIndex(item => item.id === draggedItemId);
      const dropIndex = prev.findIndex(item => item.id === dropId);
      if (draggedIndex === -1 || dropIndex === -1) return prev;
      
      const newItems = [...prev];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      return newItems;
    });
    setDraggedItemId(null);
  };

  const fetchVendors = async () => {
    try {
      const res = await mrpApi.getVendors();
      if (res.success) {
        setVendors(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors", error);
      toast.error("Failed to load vendors");
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [groupsRes, itemsRes] = await Promise.all([
        mrpApi.getProductGroups(),
        mrpApi.getItems(1, 5000)
      ]);
      if (groupsRes.success) setProductGroups(groupsRes.data);
      if (itemsRes.success) setAllItems(itemsRes.data);
    } catch (error) {
      console.error("Failed to fetch reference data", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchVendors(), fetchReferenceData()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleAddVendor = async (name: string) => {
    if (!name.trim()) {
      toast.error("Vendor name cannot be empty");
      return;
    }
    try {
      const res = await mrpApi.addVendor({ name });
      if (res.success) {
        toast.success("Vendor added successfully");
        await fetchVendors();
        setFormData(prev => ({ 
          ...prev, 
          vendor_number: res.data.vendor_number,
          vendor_name: res.data.name
        }));
      }
    } catch (error) {
      toast.error("Failed to add vendor");
    }
  };

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

  useEffect(() => {
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
      toast.error("Please enter a URL");
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

  const handleVendorSelect = (val: string) => {
    const v = vendors.find(ven => ven.vendor_number === val);
    if (v) {
      setFormData(prev => ({ ...prev, vendor_number: v.vendor_number, vendor_name: v.name }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.vendor_number) {
      toast.error("Vendor is required");
      return;
    }
    if (!formData.bwe_job_id) {
      toast.error("B.W.E Job ID is required");
      return;
    }
    if (!formData.expected_date) {
      toast.error("Expected date is required");
      return;
    }

    setSaving(true);
    try {
      const res = await mrpApi.createPurchaseOrder(formData);
      if (res.success) {
        toast.success("Purchase order created successfully");
        router.push("/dashboard/mrp/procurement");
      } else {
        toast.error("Failed to create purchase order");
      }
    } catch (error) {
      toast.error("An error occurred while creating PO");
    } finally {
      setSaving(false);
    }
  };

  const vendorOptions = vendors.map(v => ({
    label: `${v.vendor_number} ${v.name}`,
    value: v.vendor_number
  }));

  const currencyOptions = [
    { label: "$", value: "$" },
    { label: "AUD", value: "AUD" },
    { label: "USD", value: "USD" },
    { label: "NZD", value: "NZD" }
  ];

  if (loading) return <div className="p-8">Loading...</div>;



  const selectClass = "bg-[#eef2f5] border-transparent w-full flex h-9 rounded-md px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-normal text-gray-800 mb-6">Create a purchase order or input incoming invoice</h1>
      
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => router.back()}
          className="px-6 py-1.5 bg-[#e8eff9] text-[#1d5ab0] text-sm font-medium rounded hover:bg-[#d4e1f4]"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-1.5 bg-[#1d5ab0] text-white text-sm font-medium rounded hover:bg-[#15468d] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-0 flex flex-col lg:flex-row gap-12">
        {/* Left Column */}
        <div className="flex-1 max-w-2xl">
          <FieldRow label="Vendor" required>
            <SearchableSelect
              options={vendorOptions}
              value={formData.vendor_number}
              onChange={handleVendorSelect}
              onAddOption={handleAddVendor}
              addNewLabel="Add a new vendor"
              placeholder="Select or search vendor..."
            />
          </FieldRow>

          <FieldRow label="Status">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="New PO">New PO</option>
              <option value="RFQ">RFQ</option>
            </select>
          </FieldRow>

          <FieldRow label="Currency">
            <SearchableSelect
              options={currencyOptions}
              value={formData.currency}
              onChange={(val: any) => setFormData({ ...formData, currency: val })}
              onAddOption={(val: any) => setFormData({ ...formData, currency: val })}
              addNewLabel="Add new currency"
              placeholder="Select currency..."
            />
          </FieldRow>

          <FieldRow label="Free text">
            <Textarea 
              name="po_free_text"
              value={formData.po_free_text}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent min-h-[60px]"
            />
          </FieldRow>

          <FieldRow label="Files">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div onClick={() => openOAuthPopup('google')} className="p-1.5 bg-[#eef2f5] text-blue-600 rounded cursor-pointer hover:bg-gray-200"><Cloud className="w-4 h-4" /></div>
                <div onClick={() => openOAuthPopup('dropbox')} className="p-1.5 bg-[#eef2f5] text-blue-600 rounded cursor-pointer hover:bg-gray-200"><UploadCloud className="w-4 h-4" /></div>
                <div onClick={() => openOAuthPopup('microsoft')} className="p-1.5 bg-[#eef2f5] text-blue-600 rounded cursor-pointer hover:bg-gray-200"><FileText className="w-4 h-4" /></div>
                <div onClick={() => setShowLinkModal(true)} className="p-1.5 bg-[#eef2f5] text-blue-600 rounded cursor-pointer hover:bg-gray-200"><LinkIcon className="w-4 h-4" /></div>
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
          </FieldRow>

          <FieldRow label="B.W.E. Job ID" required>
            <Input 
              type="text" 
              name="bwe_job_id"
              value={formData.bwe_job_id}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="PO Emailed">
            <select 
              name="po_emailed"
              value={formData.po_emailed}
              onChange={handleChange}
              className={selectClass}
            >
              <option value=""></option>
              <option value="Y">Y</option>
            </select>
          </FieldRow>

          <FieldRow label="Attention" required>
            <select
              name="attention"
              value={formData.attention}
              onChange={handleChange}
              className={selectClass}
            >
              <option value=""></option>
              <option value="DAVID C">DAVID C</option>
              <option value="DERRYN F">DERRYN F</option>
              <option value="STEPHEN P">STEPHEN P</option>
              <option value="JOHN Mc">JOHN Mc</option>
            </select>
          </FieldRow>
        </div>

        {/* Right Column */}
        <div className="flex-1 max-w-2xl">
          <FieldRow label="Expected date" required>
            <Input 
              type="date" 
              name="expected_date"
              value={formData.expected_date}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Order ID">
            <Input 
              type="text" 
              name="order_id"
              value={formData.order_id}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Order date">
            <Input 
              type="date" 
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Invoice ID">
            <Input 
              type="text" 
              name="invoice_id"
              value={formData.invoice_id}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Invoice date">
            <Input 
              type="date" 
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Due date">
            <Input 
              type="date" 
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Shipped on">
            <Input 
              type="date" 
              name="shipped_on"
              value={formData.shipped_on}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>

          <FieldRow label="Arrival date">
            <Input 
              type="date" 
              name="arrival_date"
              value={formData.arrival_date}
              onChange={handleChange}
              className="bg-[#eef2f5] border-transparent"
            />
          </FieldRow>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mt-12 overflow-x-auto pb-8">
        <div className="flex justify-end mb-2">
          <button 
            type="button"
            onClick={() => setShowImportModal(true)}
            className="text-[#1d5ab0] hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Import items from CSV
          </button>
        </div>
        <table className="w-full min-w-[1200px] text-sm text-left">
          <thead className="bg-[#eef1f6] text-gray-600 font-medium">
            <tr>
              <th className="px-2 py-2 font-medium w-8"></th>
              <th className="px-2 py-2 font-medium min-w-[180px]">Product group</th>
              <th className="px-2 py-2 font-medium min-w-[350px]">Item</th>
              <th className="px-2 py-2 font-medium min-w-[150px]">Vendor part no.</th>
              <th className="px-2 py-2 font-medium">Ordered quantity</th>
              <th className="px-2 py-2 font-medium">Price</th>
              <th className="px-2 py-2 font-medium">Subtotal</th>
              <th className="px-2 py-2 font-medium">Expected quantity</th>
              <th className="px-2 py-2 font-medium">Expected date</th>
              <th className="px-2 py-2 font-medium">Arrival date</th>
              <th className="px-2 py-2 font-medium text-right" colSpan={2}>
                <div className="flex items-center justify-end gap-3">
                  <div className="relative group inline-block cursor-pointer">
                    <div className="text-gray-600 hover:text-gray-800 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16"></path>
                        <path d="M12 20V4"></path>
                        <path d="M6 10l6-6 6 6"></path>
                      </svg>
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-[#323c4a] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow">
                      Import from CSV (100 lines max.)
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const matchedItem = allItems.find(i => String(i.id) === String(item.item));
              const itemVendors: any[] = [];
              if (matchedItem) {
                if (matchedItem.supplier_1) {
                  itemVendors.push({
                    vendor: matchedItem.supplier_1,
                    priority: '0',
                    vendorPartNo: matchedItem.vender_part_number || '',
                    uom: matchedItem.uom || 'pcs',
                    leadTime: '-', 
                    price: matchedItem.s1_buy_price || matchedItem.buy_price || 0,
                    minQty: matchedItem.min_qty_manufacturing || 0
                  });
                }
                if (matchedItem.supplier_2) {
                  itemVendors.push({
                    vendor: matchedItem.supplier_2,
                    priority: '0',
                    vendorPartNo: matchedItem.vender_2_part_number || '',
                    uom: matchedItem.uom || 'pcs',
                    leadTime: '-',
                    price: matchedItem.s2_buy_price || 0,
                    minQty: matchedItem.min_qty_manufacturing || 0
                  });
                }
              }

              return (
              <tr 
                key={item.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`border-b border-gray-100 ${draggedItemId === item.id ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
              >
                <td className="px-2 py-3 text-blue-600 font-medium text-sm text-center">{index + 1}</td>
                <td className="px-2 py-3 align-top">
                  <SearchableSelect
                    options={productGroups.map(g => ({ label: `${g.group_number} ${g.group_name}`, value: String(g.group_number) }))}
                    value={item.productGroup}
                    onChange={(val: string) => handleLineItemChange(item.id, 'productGroup', val)}
                    placeholder="Select group..."
                  />
                </td>
                <td className="px-2 py-3 align-top space-y-1">
                  <SearchableSelect
                    options={allItems
                      .filter(i => !item.productGroup || String(i.group_number) === item.productGroup)
                      .map(i => ({ label: `${i.part_no} - ${i.part_description}`, value: String(i.id) }))}
                    value={item.item}
                    onChange={(val: string) => handleLineItemChange(item.id, 'item', val)}
                    placeholder="Select item..."
                  />
                  <div className="mt-1">
                    <textarea 
                      value={item.freeText}
                      onChange={(e) => handleLineItemChange(item.id, 'freeText', e.target.value)}
                      placeholder="Free text" 
                      className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none resize-none h-8 text-sm" 
                    />
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <VendorTableSelect
                    vendors={itemVendors}
                    value={item.vendorPartNo}
                    onChange={(v: any) => {
                      handleLineItemChange(item.id, 'vendorPartNo', v.vendorPartNo || v.vendor);
                      handleLineItemChange(item.id, 'price', String(v.price));
                    }}
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <input 
                    type="text" 
                    value={item.orderedQuantity}
                    onChange={(e) => handleLineItemChange(item.id, 'orderedQuantity', e.target.value)}
                    className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" 
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={item.price}
                      onChange={(e) => handleLineItemChange(item.id, 'price', e.target.value)}
                      className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" 
                    />
                    <span className="text-gray-600 font-medium text-sm">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={item.subtotal} 
                      readOnly 
                      className="w-16 bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-center text-sm" 
                    />
                    <span className="text-gray-600 font-medium text-sm">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <input 
                    type="text" 
                    value={item.expectedQuantity}
                    onChange={(e) => handleLineItemChange(item.id, 'expectedQuantity', e.target.value)}
                    className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" 
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="relative">
                    <input 
                      type="date" 
                      value={item.expectedDate}
                      onChange={(e) => handleLineItemChange(item.id, 'expectedDate', e.target.value)}
                      className={`w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm ${!item.expectedDate ? 'text-transparent' : 'text-gray-800'}`} 
                    />
                    {!item.expectedDate && (
                      <div className="absolute right-2 top-2 pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                </td>
                <td className="px-2 py-3 align-top text-center w-20">
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <div className="relative group cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      <div className="absolute right-0 top-full mt-2 w-max px-3 py-1.5 bg-[#323c4a] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow">
                        Click and drag (up or down) to change order
                      </div>
                    </div>
                    <button onClick={() => removeLineItem(item.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            {/* Summary Rows */}
            <tr className="border-b border-gray-100">
              <td></td>
              <td colSpan={4} className="px-2 py-3 font-medium text-gray-800 text-sm">Discount:</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.discountPercent} onChange={(e) => handleTotalsChange('discountPercent', e.target.value)} className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">%</span>
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.discountAmount} onChange={(e) => handleTotalsChange('discountAmount', e.target.value)} className="w-full bg-[#e8eff9] border border-blue-200 rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">$</span>
                </div>
              </td>
              <td colSpan={4}></td>
            </tr>
            <tr className="border-b border-gray-100">
              <td></td>
              <td colSpan={3} className="px-2 py-3 font-medium text-gray-800 text-sm">Total:</td>
              <td className="px-2 py-3 text-center text-sm">{totalQty > 0 ? totalQty : ''}</td>
              <td></td>
              <td className="px-2 py-3 font-medium text-gray-800 text-sm whitespace-nowrap">$ {currentTotal.toFixed(2)}</td>
              <td colSpan={4}></td>
            </tr>
            <tr className="border-b border-gray-100 bg-[#f8f9fa]">
              <td></td>
              <td colSpan={5} className="px-2 py-3 font-medium text-gray-800 text-sm">Taxable fees:</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.taxableFees} onChange={(e) => handleTotalsChange('taxableFees', e.target.value)} className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">$</span>
                </div>
              </td>
              <td colSpan={4}></td>
            </tr>
            <tr className="border-b border-gray-100">
              <td></td>
              <td colSpan={4} className="px-2 py-3 font-medium text-gray-800 text-sm">Tax:</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.taxPercent} onChange={(e) => handleTotalsChange('taxPercent', e.target.value)} className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">%</span>
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.taxAmount} onChange={(e) => handleTotalsChange('taxAmount', e.target.value)} className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">$</span>
                </div>
              </td>
              <td colSpan={4}></td>
            </tr>
            <tr className="border-b border-gray-100 bg-[#f8f9fa]">
              <td></td>
              <td colSpan={5} className="px-2 py-3 font-medium text-gray-800 text-sm">Additional fees:</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={totals.additionalFees} onChange={(e) => handleTotalsChange('additionalFees', e.target.value)} className="w-full bg-[#eef2f5] border-transparent rounded p-1.5 outline-none text-sm" />
                  <span className="text-gray-600 font-medium text-sm">$</span>
                </div>
              </td>
              <td colSpan={4}></td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={5} className="px-2 py-3 font-medium text-gray-800 text-sm">Grand total:</td>
              <td className="px-2 py-3 font-medium text-gray-800 text-sm whitespace-nowrap">$ {currentGrandTotal.toFixed(2)}</td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => router.back()}
          className="px-6 py-1.5 bg-[#e8eff9] text-[#1d5ab0] text-sm font-medium rounded hover:bg-[#d4e1f4]"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-1.5 bg-[#1d5ab0] text-white text-sm font-medium rounded hover:bg-[#15468d] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
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
                className="px-6 py-1.5 bg-[#1d5ab0] text-white text-sm font-medium rounded hover:bg-[#15468d] w-full"
              >
                Add file
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-gray-800 text-[15px]">Import items from CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 pb-8">
              <div className="border border-dashed border-[#1d5ab0] rounded p-6 text-center text-[#1d5ab0] text-sm cursor-pointer hover:bg-blue-50/50 transition-colors">
                Drop CSV file here or click to select
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
