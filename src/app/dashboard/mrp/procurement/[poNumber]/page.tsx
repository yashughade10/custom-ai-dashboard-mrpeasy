"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import Link from "next/link";
import { 
  ArrowLeft, Save, Trash2, FileText, Copy, Mail, Download, CheckCircle, 
  Printer, MoreHorizontal, Link as LinkIcon, Paperclip, CloudUpload, Cloud, X, Plus, Search, Edit, GripVertical, Check
} from "lucide-react";
import { toast } from "sonner";
import { 
  generateInternalPdf, 
  generateVendorPdf, 
  generateDeliveryNotePdf, 
  generateRfqPdf,
  generateLabelsPdf
} from '@/utils/pdfGenerator';
import { generateCsvDownload } from '@/utils/csvGenerator';
import { Input } from "@/components/ui/input";

export default function PurchaseOrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const poNumber = params.poNumber as string;

  const [attachedFiles, setAttachedFiles] = useState<{url: string, description: string}[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [printLabelItem, setPrintLabelItem] = useState<any>(null);
  const [printLabelCount, setPrintLabelCount] = useState<number>(1);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [discountPercent, setDiscountPercent] = useState<string>("2");
  const [taxPercent, setTaxPercent] = useState<string>("10");
  const [taxableFees, setTaxableFees] = useState<string>("");
  const [additionalFees, setAdditionalFees] = useState<string>("");

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

  const addLink = () => {
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

  const { data: poData, isLoading, error } = useQuery({
    queryKey: ["mrpPurchaseOrder", poNumber],
    queryFn: () => mrpApi.getPurchaseOrder(poNumber),
    enabled: !!poNumber
  });

  const order = poData?.order;
  const items = poData?.items || [];

  useEffect(() => {
    if (items.length > 0 && localItems.length === 0) {
      setLocalItems(items);
    } else if (items.length > 0 && localItems.length > 0 && items.length !== localItems.length) {
      // Basic sync if items change significantly (like delete/add)
      setLocalItems(items);
    }
  }, [items]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    // required for firefox
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newItems = [...localItems];
    const item = newItems.splice(draggedIdx, 1)[0];
    newItems.splice(index, 0, item);
    setDraggedIdx(index);
    setLocalItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const subtotal = localItems.reduce((acc, item) => {
    // For MRP easy items, subtotal might be mapped to 'subtotal' or 'total_in_currency'
    // but in local table we might just compute qty * price
    const qty = parseFloat(item.quantity || item.expected_quantity || '0');
    const price = parseFloat(item.price || item.unit_cost_in_currency || '0');
    let itemSubtotal = parseFloat(item.subtotal || item.total_in_currency || '0');
    
    // If we have qty and price but no subtotal string, compute it
    if (qty > 0 && price >= 0) {
      itemSubtotal = qty * price;
    }
    return acc + (isNaN(itemSubtotal) ? 0 : itemSubtotal);
  }, 0);

  const discountAmount = subtotal * ((parseFloat(discountPercent) || 0) / 100);
  const total = subtotal - discountAmount;
  const taxableFeesAmount = parseFloat(taxableFees) || 0;
  const taxAmount = (total + taxableFeesAmount) * ((parseFloat(taxPercent) || 0) / 100);
  const additionalFeesAmount = parseFloat(additionalFees) || 0;
  const grandTotal = total + taxableFeesAmount + taxAmount + additionalFeesAmount;

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading Purchase Order {poNumber}...</div>;
  }

  if (error || !poData) {
    return <div className="p-8 text-red-500">Error loading Purchase Order {poNumber}. It may not exist.</div>;
  }


  const formatDate = (d: string | null) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatDateForInput = (d: string | null) => {
    if (!d) return "";
    try {
      // If it's strictly just YYYY-MM-DD with no time component
      if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
      
      // If it's DD/MM/YYYY or D/M/YYYY
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].substring(0, 4); // In case of times attached
          return `${year}-${month}-${day}`;
        }
      }

      // Fallback: Parse the date and get local Year, Month, Day
      const date = new Date(d);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return d;
    } catch {
      return "";
    }
  };

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  return (
    <div className="flex flex-col h-full bg-white text-[13px] text-gray-800 pb-20">
      
      {/* Header & Title */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-4">
              <h1 className="text-[22px] font-normal text-gray-800">Purchase order {order.po_number}</h1>
              <button 
                onClick={() => router.push(`/dashboard/mrp/procurement/${poNumber}/notes/add`)}
                className="ml-3 p-1 hover:bg-gray-100 rounded text-blue-600"
                title="Add a new note"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => router.back()} className="flex items-center px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
                Cancel
              </button>
              <button className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
                Save
              </button>
              <button className="flex items-center px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
                Delete
              </button>
              <button onClick={() => router.push(`/dashboard/mrp/procurement/${poNumber}/reports`)} className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
                Reports
              </button>
              <button onClick={() => router.push(`/dashboard/mrp/procurement/create?copyFrom=${poNumber}`)} className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
                Copy
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1.5 mt-1">
            <div className="flex space-x-1.5">
              <button 
                onClick={() => {
                  const subject = encodeURIComponent(`Purchase order ${order.po_number} from Blue Water Engineering Group Pty Ltd`);
                  const body = encodeURIComponent(`Dear vendor ${order.vendor_name},\n\nYour customer [Blue Water Engineering Pty Ltd] has sent you a purchase order. You can download it here: https://app.mrpeasy.com/link/NTcxNzFzMTBoNTA3dDNuYTBlOA\n\nBest regards,\nBlue Water Engineering Group Pty Ltd`);
                  window.location.href = `mailto:stephenm@midwaymetals.com.au?subject=${subject}&body=${body}`;
                }}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                Send PO
              </button>
              <button 
                onClick={() => generateInternalPdf(poData)}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                <Download className="w-3 h-3 mr-1.5" /> Internal PDF
              </button>
              <button 
                onClick={() => generateVendorPdf(poData)}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                <Download className="w-3 h-3 mr-1.5" /> PDF for vendor
              </button>
              <button 
                onClick={() => {
                  window.location.href = `mailto:stephenm@midwaymetals.com.au?subject=${encodeURIComponent(`Note regarding Purchase order ${order.po_number}`)}`;
                }}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                Send note
              </button>
              <button 
                onClick={() => generateDeliveryNotePdf(poData)}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                <Download className="w-3 h-3 mr-1.5" /> Delivery note
              </button>
            </div>
            <div className="flex space-x-1.5 items-center">
              <button 
                onClick={() => {
                  window.location.href = `mailto:stephenm@midwaymetals.com.au?subject=${encodeURIComponent(`Request for quote ${order.po_number}`)}`;
                }}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                Send RFQ
              </button>
              <button 
                onClick={() => generateRfqPdf(poData)}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                <Download className="w-3 h-3 mr-1.5" /> RFQ
              </button>
              <button 
                onClick={() => generateCsvDownload(poData)}
                className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]"
              >
                <Download className="w-3 h-3 mr-1.5" /> CSV
              </button>
              <button 
                disabled 
                title={`Please enter vendor's 'Invoice ID' into PO details, and then you\nwill be able to post it to Xero or it will be posted automatically within 5 minutes.`}
                className="flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-100 rounded-full text-[8px] font-bold mx-1 cursor-not-allowed opacity-60"
              >
                XERO
              </button>
              <button className="flex items-center px-3 py-1.5 bg-[#e8ecef] text-gray-600 hover:bg-gray-300 rounded-sm text-[11px]">
                Book items
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="p-4 grid grid-cols-2 gap-x-12 gap-y-1">
        
        {/* Left Column */}
        <div className="space-y-1">
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Number<span className="text-red-500">*</span></label>
            <input type="text" defaultValue={order.po_number} className="flex-1 bg-[#f4f7fb] border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1 rounded-sm text-[12px]" />
          </div>
          
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Vendor<span className="text-red-500">*</span></label>
            <div className="flex-1 flex bg-[#e9ecef] border border-gray-300 rounded-sm overflow-hidden text-gray-500 cursor-not-allowed">
              <input type="text" disabled defaultValue={`${order.vendor_number || ''} ${order.vendor_name || ''}`} className="flex-1 bg-transparent px-2 py-1 focus:outline-none text-[12px] cursor-not-allowed" />
              <button disabled className="px-2 text-gray-500 cursor-not-allowed"><LinkIcon className="w-3 h-3" /></button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Status</label>
            <select defaultValue={order.status} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]">
              <option value="New PO">New PO</option>
              <option value="Ordered">Ordered</option>
              <option value="Shipped">Shipped</option>
              <option value="Received">Received</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Currency rate<span className="text-red-500">*</span></label>
            <input type="text" defaultValue="1.00" className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-start">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500 pt-1">Free text</label>
            <textarea defaultValue={order.po_free_text || ''} rows={2} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px] resize-y"></textarea>
          </div>

          <div className="flex items-start">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500 pt-1">Files</label>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex gap-2 text-[#1e5aa0]">
                <button onClick={() => openOAuthPopup('google')} className="p-1.5 bg-[#f4f7fb] text-blue-600 rounded cursor-pointer hover:bg-[#e4ebf7]"><Cloud className="w-4 h-4" /></button>
                <button onClick={() => openOAuthPopup('dropbox')} className="p-1.5 bg-[#f4f7fb] text-blue-600 rounded cursor-pointer hover:bg-[#e4ebf7]"><CloudUpload className="w-4 h-4" /></button>
                <button onClick={() => openOAuthPopup('microsoft')} className="p-1.5 bg-[#f4f7fb] text-blue-600 rounded cursor-pointer hover:bg-[#e4ebf7]"><FileText className="w-4 h-4" /></button>
                <button onClick={() => setShowLinkModal(true)} className="p-1.5 bg-[#f4f7fb] text-blue-600 rounded cursor-pointer hover:bg-[#e4ebf7]"><LinkIcon className="w-4 h-4" /></button>
              </div>
              
              {attachedFiles.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-[11px] font-medium text-gray-700 bg-[#f4f7fb] px-2 py-0.5 rounded w-fit mb-1">File</div>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <a href={file.url} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 hover:underline">
                        {file.description}
                      </a>
                      <Trash2 
                        className="w-3 h-3 text-gray-400 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => removeFile(idx)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">BWE JOB ID<span className="text-red-500">*</span></label>
            <select defaultValue={order.bwe_job_id || ''} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]">
              <option value="JET">JET</option>
              <option value="STOCK">STOCK</option>
              <option value="">-- None --</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">PO emailed<span className="text-red-500">*</span></label>
            <select defaultValue={order.po_emailed || 'Y'} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]">
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Attention<span className="text-red-500">*</span></label>
            <select defaultValue={order.attention || ''} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]">
              <option value="DERWYN P">DERWYN P</option>
              <option value="JOHN MC">JOHN MC</option>
              <option value="STEPHEN">STEPHEN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="">-- None --</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1">
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Created</label>
            <div className="flex-1 text-[12px] font-medium">{formatDate(order.created_date)}</div>
          </div>
          
          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Created by</label>
            <div className="flex-1 text-[12px] font-medium">{order.created_by || 'Admin'}</div>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Expected date</label>
            <input type="date" defaultValue={formatDateForInput(order.expected_date)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Order ID</label>
            <input type="text" defaultValue={order.order_id || ''} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Order date</label>
            <input type="date" defaultValue={formatDateForInput(order.order_date)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Invoice ID</label>
            <input type="text" defaultValue={order.invoice_id || ''} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Invoice date</label>
            <input type="date" defaultValue={formatDateForInput(order.invoice_date)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Due date</label>
            <input type="date" defaultValue={formatDateForInput(order.due_date)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Shipped on</label>
            <input type="date" defaultValue={formatDateForInput(order.shipped_on)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>

          <div className="flex items-center">
            <label className="w-32 text-right pr-4 text-[12px] text-gray-500">Arrival date</label>
            <input type="date" defaultValue={formatDateForInput(order.arrival_date)} className="flex-1 bg-[#f4f7fb] border border-gray-300 focus:outline-none px-2 py-1 rounded-sm text-[12px]" />
          </div>
        </div>
      </div>

      {/* Items Table Area */}
      <div className="mt-8 px-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f0f4f8] text-gray-600 font-medium text-[11px] text-left">
              <th className="px-3 py-4 border-r border-white w-8">#</th>
              <th className="px-3 py-4 border-r border-white w-32">Product group</th>
              <th className="px-3 py-4 border-r border-white min-w-[200px]">Item</th>
              <th className="px-3 py-4 border-r border-white w-32">Vendor part no.</th>
              <th className="px-3 py-4 border-r border-white w-24">Ordered quantity</th>
              <th className="px-3 py-4 border-r border-white w-24">Price</th>
              <th className="px-3 py-4 border-r border-white w-24">Subtotal</th>
              <th className="px-3 py-4 border-r border-white w-24">Target lot</th>
              <th className="px-3 py-4 border-r border-white w-24">Expected quantity</th>
              <th className="px-3 py-4 border-r border-white w-32">Expected date</th>
              <th className="px-3 py-4 border-r border-white w-32">Arrival date</th>
              <th className="px-3 py-4 w-16 text-center text-gray-400 border-r border-white">
                 <div className="flex items-center justify-center space-x-2">
                   <Printer 
                     className="w-4 h-4 cursor-pointer hover:text-gray-700" 
                     onClick={() => generateLabelsPdf(items, order, 1)}
                   />
                   <MoreHorizontal className="w-4 h-4" />
                 </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {(localItems.length > 0 ? localItems : items).map((item: any, i: number) => (
              <tr 
                key={item.id || i} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`border-b border-gray-100 hover:bg-[#f9fafb] group text-gray-700 ${draggedIdx === i ? 'opacity-40 bg-gray-50' : ''} cursor-move`}
              >
                <td className="px-3 py-4 text-gray-400 text-xs text-center border-r border-gray-100">{i + 1}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">{item.group_name || ''}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <Link href={`/dashboard/mrp/inventory/${item.item_id || item.id || item.part_no}`}>
                    <div className="text-[#1e5aa0] font-medium hover:underline cursor-pointer">{item.part_no}</div>
                  </Link>
                  <div className="text-gray-500 truncate">{item.part_description}</div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <select className="w-full bg-transparent border border-gray-300 rounded-sm focus:outline-none p-2 text-gray-600">
                    <option>{item.vendor_part_number || ''}</option>
                  </select>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <div className="flex items-center">
                    <input type="text" defaultValue={item.quantity} className="flex-1 w-12 bg-transparent focus:bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:outline-none p-2 rounded-sm text-right" />
                    <span className="text-gray-500 w-6 ml-1">{item.unit || ''}</span>
                  </div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <div className="flex items-center">
                    <input type="text" defaultValue={item.unit_cost_in_currency} className="flex-1 w-12 bg-transparent focus:bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:outline-none p-2 rounded-sm text-right" />
                    <span className="text-gray-500 w-8 ml-1">{order.currency || 'AUD'}</span>
                  </div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <div className="flex items-center justify-end pr-1 text-gray-800">
                    <span className="flex-1 text-right">{formatCurrency(item.total_in_currency)}</span>
                    <span className="text-gray-500 w-8 ml-1">{order.currency || 'AUD'}</span>
                  </div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <div className="text-[#1e5aa0] hover:underline cursor-pointer">{item.lot || ''}</div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <div className="flex items-center">
                    <input type="text" defaultValue={item.quantity} className="flex-1 w-12 bg-transparent focus:bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:outline-none p-2 rounded-sm text-right" />
                  </div>
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <input type="date" defaultValue={formatDateForInput(item.expected_date || order.expected_date)} className="w-full bg-transparent focus:bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:outline-none px-2 py-2 rounded-sm text-[11px] text-gray-600" />
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-[11px]">
                  <input type="date" defaultValue={formatDateForInput(item.arrival_date)} className="w-full bg-transparent focus:bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:outline-none px-2 py-2 rounded-sm text-[11px] text-gray-600" />
                </td>
                <td className="px-3 py-4 text-center text-gray-400 border-r border-gray-100">
                  <div className="flex items-center justify-center space-x-2">
                    <Printer 
                      className="w-4 h-4 cursor-pointer hover:text-gray-700" 
                      onClick={() => {
                        const defaultQty = Math.max(1, Math.ceil(parseFloat(item.quantity || item.expected_quantity || '1')));
                        setPrintLabelCount(defaultQty);
                        setPrintLabelItem(item);
                      }}
                    />
                    <GripVertical className="w-4 h-4 cursor-grab hover:text-gray-700" />
                    <Trash2 className="w-4 h-4 cursor-pointer hover:text-red-500" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mt-8 bg-[#f9fafb] border-t border-b border-gray-200 py-4 w-full">
        <div className="grid grid-cols-[1fr,400px] gap-x-12 px-4 max-w-[1400px]">
          <div></div>
          <div className="space-y-[6px]">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-gray-800 font-bold w-32">Discount:</label>
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <input 
                  type="number" 
                  value={discountPercent} 
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-16 bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none p-1 rounded-sm text-right text-[12px] text-gray-700" 
                />
                <span className="text-[12px] text-gray-700 w-4 text-center">%</span>
                <span className="text-[12px] text-gray-700 w-20 text-right">{formatCurrency(discountAmount)}</span>
                <span className="text-[12px] text-gray-700 font-bold w-8 ml-1">{order?.currency || 'AUD'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-gray-800 font-bold w-32">Total:</label>
              <div className="flex items-center space-x-1 flex-1 justify-end">
                <span className="text-[12px] text-gray-700 font-bold w-8 text-right">{order?.currency || 'AUD'}</span>
                <span className="text-[12px] font-bold w-20 text-right">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="text-[12px] text-gray-800 font-bold w-32">Taxable fees:</label>
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <input 
                  type="number" 
                  value={taxableFees}
                  onChange={(e) => setTaxableFees(e.target.value)}
                  className="w-20 bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none p-1 rounded-sm text-right text-[12px] text-gray-700" 
                />
                <span className="text-[12px] text-gray-700 font-bold w-8 ml-1">{order?.currency || 'AUD'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[12px] text-gray-800 font-bold w-32">Tax:</label>
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <input 
                  type="number" 
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-16 bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none p-1 rounded-sm text-right text-[12px] text-gray-700" 
                />
                <span className="text-[12px] text-gray-700 w-4 text-center">%</span>
                <span className="text-[12px] text-gray-700 font-bold w-8 text-right">{order?.currency || 'AUD'}</span>
                <span className="text-[12px] font-bold w-20 text-right">{formatCurrency(taxAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="text-[12px] text-gray-800 font-bold w-32">Additional fees:</label>
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <input 
                  type="number" 
                  value={additionalFees}
                  onChange={(e) => setAdditionalFees(e.target.value)}
                  className="w-20 bg-[#f4f7fb] border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none p-1 rounded-sm text-right text-[12px] text-gray-700" 
                />
                <span className="text-[12px] text-gray-700 font-bold w-8 ml-1">{order?.currency || 'AUD'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-[12px] text-gray-800 font-bold w-32">Grand total:</label>
              <div className="flex items-center space-x-1 flex-1 justify-end">
                <span className="text-[12px] text-gray-700 font-bold w-8 text-right">{order?.currency || 'AUD'}</span>
                <span className="text-[12px] font-bold w-20 text-right">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 flex space-x-2">
        <button onClick={() => router.back()} className="flex items-center px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
          Back
        </button>
        <button className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
          Save
        </button>
        <button className="flex items-center px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
          Delete
        </button>
        <button onClick={() => router.push(`/dashboard/mrp/procurement/${poNumber}/reports`)} className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
          Reports
        </button>
        <button onClick={() => router.push(`/dashboard/mrp/procurement/create?copyFrom=${poNumber}`)} className="flex items-center px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
          Copy
        </button>
      </div>

      {/* Payments Section */}
      <div className="px-4 mt-2">
        <h2 className="text-[16px] font-normal text-gray-800 border-b border-gray-200 pb-2">Payments</h2>
        <table className="w-full mt-2">
          <thead>
            <tr className="text-gray-500 text-[11px] font-medium border-b border-gray-200 text-left">
              <th className="py-2 font-normal w-1/4">Created</th>
              <th className="py-2 font-normal w-1/4">Sum</th>
              <th className="py-2 font-normal w-1/2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 font-medium text-[12px] text-gray-600">Total</td>
              <td className="py-2 font-medium text-[12px] text-gray-600">{order.currency || 'AUD'} 0.00</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      <div className="px-4 mt-8 pb-12">
        <h2 className="text-[16px] font-normal text-gray-800 border-b border-gray-200 pb-2">Notes</h2>
        <table className="w-full mt-2">
          <thead>
            <tr className="text-gray-500 text-[11px] font-medium border-b border-gray-200 text-left">
              <th className="py-2 font-normal w-40">Created ↓</th>
              <th className="py-2 font-normal w-40">Modified</th>
              <th className="py-2 font-normal relative">
                Note
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={() => router.push(`/dashboard/mrp/procurement/${poNumber}/notes/add`)}
                    className="w-5 h-5 flex items-center justify-center bg-[#e4ebf7] text-[#1e5aa0] rounded-full hover:bg-[#d0def0]"
                    title="Create a note"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="py-8 text-left text-gray-400 text-[12px]"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-xl w-[400px]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-gray-800 text-[15px]">Attach a link</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">URL <span className="text-red-500">*</span></label>
                <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://" className="h-8" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <Input value={linkDescription} onChange={e => setLinkDescription(e.target.value)} placeholder="Link description" className="h-8" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={addLink} className="px-4 py-1.5 text-sm bg-[#1d5ab0] text-white rounded hover:bg-[#15468d]">Add link</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Labels Modal */}
      {printLabelItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-lg w-[400px]">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-[#f4f7fb]">
              <h2 className="text-[13px] font-semibold text-gray-700">Print labels</h2>
              <button onClick={() => setPrintLabelItem(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                  How many labels do you want to print?
                </label>
                <Input
                  type="number"
                  min={1}
                  value={printLabelCount}
                  onChange={(e) => setPrintLabelCount(parseInt(e.target.value) || 1)}
                  className="w-full h-8 text-[12px]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setPrintLabelItem(null)}
                  className="px-4 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    generateLabelsPdf([printLabelItem], order, printLabelCount);
                    setPrintLabelItem(null);
                  }}
                  className="px-4 py-1.5 text-[12px] bg-[#1e5aa0] text-white hover:bg-blue-700 rounded-sm"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
