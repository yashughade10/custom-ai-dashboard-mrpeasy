"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Cloud, Link as LinkIcon, Paperclip, GripVertical, Trash2, HardDrive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface BomPartItem {
  id: string; // temp local id for key
  groupId: string;
  partId: string;
  notes: string;
  uom: string;
  quantity: string;
}

interface BomFormProps {
  initialProductId?: string; // used when creating
  editingBomId?: string; // used when editing
  onBack: () => void;
  onSaved: () => void;
}

export function BomForm({ initialProductId, editingBomId, onBack, onSaved }: BomFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingBomId;

  // Form State
  const [productName, setProductName] = useState("");
  const [bomNumber, setBomNumber] = useState("");
  const [bomName, setBomName] = useState("");
  const [parts, setParts] = useState<BomPartItem[]>([]);

  // Queries
  const { data: bomDetail, isLoading: isLoadingBom } = useQuery({
    queryKey: ["bom-detail", editingBomId],
    queryFn: () => mrpApi.getBomById(editingBomId!),
    enabled: isEditing,
  });

  const { data: productGroupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["product-groups"],
    queryFn: () => mrpApi.getProductGroups(),
  });

  const { data: itemsData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["stock-items"],
    queryFn: () => mrpApi.getItems(1, 1000), // fetch enough items for dropdown
  });

  // Derived options
  const groupOptions = (productGroupsData?.data || []).map((g: any) => ({
    label: g.group_name || g.name || "Unnamed Group",
    value: g.group_number || g.id?.toString() || g.name || Math.random().toString(),
  }));

  const partOptions = (itemsData?.data || []).map((item: any) => ({
    label: item.part_description || item.name || item.part_number || "Unnamed Part",
    value: item.part_number || item.part_no || item.id?.toString() || Math.random().toString(),
  }));

  useEffect(() => {
    if (isEditing && bomDetail?.success && bomDetail.data) {
      const bom = bomDetail.data;
      setProductName(bom.part_description || bom.product_title || "");
      setBomNumber(bom.number || bom.code || "");
      setBomName(bom.name || bom.title || "");
      
      // If the backend has items attached, populate them (assuming bom.items exists, if not leave empty)
      if (bom.items && bom.items.length > 0) {
        setParts(bom.items.map((i: any) => {
          const matchedItem = (itemsData?.data || []).find((item: any) => 
            item.part_number === i.component_part_no || 
            item.part_no === i.component_part_no ||
            item.id?.toString() === i.component_part_no
          );
          return {
            id: Math.random().toString(36).substring(7),
            groupId: matchedItem?.group_number || matchedItem?.group_id?.toString() || "",
            partId: matchedItem?.part_number || matchedItem?.part_no || matchedItem?.id?.toString() || i.component_part_no || "",
            notes: i.notes || "",
            uom: i.uom || matchedItem?.uom || matchedItem?.unit || "pcs",
            quantity: i.quantity?.toString() || "0",
          };
        }));
      } else {
        // Provide at least one empty row
        setParts([createEmptyPart()]);
      }
    } else if (!isEditing) {
      // In create mode, if initialProductId is passed, we can prefill productName and BOM name.
      // But we have to find it from itemsData.
      const product = (itemsData?.data || []).find((i: any) => i.id?.toString() === initialProductId || i.part_number === initialProductId);
      const name = product?.part_description || product?.name || `Product ${initialProductId || ""}`;
      setProductName(name);
      setBomName(`${name} BOM`);
      setParts([createEmptyPart()]);
    }
  }, [isEditing, bomDetail, initialProductId, itemsData]);

  const createEmptyPart = (): BomPartItem => ({
    id: Math.random().toString(36).substring(7),
    groupId: "",
    partId: "",
    notes: "",
    uom: "m",
    quantity: ""
  });

  const addPart = () => setParts([...parts, createEmptyPart()]);
  const removePart = (id: string) => setParts(parts.filter(p => p.id !== id));
  
  const updatePart = (id: string, field: keyof BomPartItem, value: string) => {
    let updates: Partial<BomPartItem> = { [field]: value };
    
    // Auto-fill Product Group and UoM when Part is selected
    if (field === "partId") {
      const selectedItem = (itemsData?.data || []).find((i: any) => i.part_number === value || i.part_no === value || i.id?.toString() === value);
      if (selectedItem) {
        updates.groupId = selectedItem.group_number || selectedItem.group_id?.toString() || "";
        updates.uom = selectedItem.uom || selectedItem.unit || "pcs";
      }
    }
    
    setParts(parts.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditing ? mrpApi.updateBom(editingBomId, data) : mrpApi.createBom(data),
    onSuccess: () => {
      toast.success(isEditing ? "BOM updated successfully" : "BOM created successfully");
      queryClient.invalidateQueries({ queryKey: ["mrp-boms"] });
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save BOM");
    }
  });

  const handleSave = () => {
    if (!bomName) {
      toast.error("BOM Name is required");
      return;
    }
    
    // Prepare payload
    const payload: any = {
      name: bomName,
      part_description: productName,
      items: parts.filter(p => p.partId && p.quantity).map(p => {
        const item = (itemsData?.data || []).find((i: any) => i.id?.toString() === p.partId || i.part_number === p.partId || i.part_no === p.partId);
        return {
          component_part_no: item?.part_number || item?.part_no || p.partId,
          component_description: item?.part_description || item?.name || "",
          notes: p.notes,
          uom: p.uom,
          quantity: parseFloat(p.quantity)
        };
      })
    };

    if (isEditing) {
      payload.number = bomNumber;
    }

    saveMutation.mutate(payload);
  };

  if (isEditing && isLoadingBom) {
    return <div className="p-8 text-center text-gray-500">Loading BOM details...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? `BOM ${bomNumber} ${bomName} details` : `Create a BOM for ${productName}`}
        </h1>
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">Print BOM</Button>
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">Export to CSV</Button>
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">Indented BOM</Button>
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">Indented CSV</Button>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 max-w-[1400px] mx-auto w-full">
        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none hover:bg-[#e0e7ff]" onClick={onBack}>Back</Button>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saveMutation.isPending}>Save</Button>
          {isEditing && (
            <>
              <Button variant="outline" className="h-8 px-4 text-red-600 border-gray-200">Delete</Button>
              <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none">Reports</Button>
            </>
          )}
        </div>

        {/* Basic Info Form */}
        <div className="max-w-xl space-y-4 mb-8">
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Product</span>
            <div className="text-sm font-medium text-gray-900 px-3 py-2 bg-gray-50 rounded-md border border-gray-100">{productName || "Unknown Product"}</div>
          </div>
          
          {isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <span className="text-sm text-gray-600 text-right">Number *</span>
              <Input 
                value={bomNumber}
                onChange={(e) => setBomNumber(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Name *</span>
            <Input 
              value={bomName}
              onChange={(e) => setBomName(e.target.value)}
              className="h-9"
            />
          </div>

          {!isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <span className="text-sm text-gray-600 text-right">Copy BOM</span>
              <select className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value=""></option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Routings</span>
            <div className="h-9"></div> {/* Empty space for Routings per screenshot */}
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Files</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <HardDrive className="w-4 h-4" /> {/* Stand-in for Google Drive icon */}
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <Cloud className="w-4 h-4" /> {/* Stand-in for Dropbox icon */}
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <LinkIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">Parts</span>
        </div>
        
        <div className="border border-gray-200 rounded-md overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fc] border-b border-gray-200">
              <tr>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-8">#</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[250px]">Product group</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[350px]">Part</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3">Notes</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[100px]">UoM</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[120px]">Quantity</th>
                <th className="font-medium text-gray-600 text-center py-2 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={part.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                  <td className="py-2 px-3">
                    <SearchableSelect 
                      options={groupOptions}
                      value={part.groupId}
                      onChange={(val) => updatePart(part.id, "groupId", val)}
                      placeholder="Select..."
                      isLoading={isGroupsLoading}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <SearchableSelect 
                      options={partOptions}
                      value={part.partId}
                      onChange={(val) => updatePart(part.id, "partId", val)}
                      placeholder="Select part..."
                      isLoading={isItemsLoading}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Input 
                        value={part.notes}
                        onChange={(e) => updatePart(part.id, "notes", e.target.value)}
                        className="h-8 text-xs bg-gray-50 border-gray-200"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <select 
                      className="w-full h-8 px-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent text-gray-500"
                      value={part.uom}
                      onChange={(e) => updatePart(part.id, "uom", e.target.value)}
                    >
                      <option value="m">m</option>
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                      <option value="m²">m²</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 flex gap-2 items-center">
                    <Input 
                      type="number"
                      value={part.quantity}
                      onChange={(e) => updatePart(part.id, "quantity", e.target.value)}
                      className="h-8 text-xs text-right"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <GripVertical className="w-4 h-4 cursor-move hover:text-gray-600" />
                      <Trash2 className="w-4 h-4 cursor-pointer hover:text-red-500" onClick={() => removePart(part.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 border-t border-gray-100 bg-gray-50 flex">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50" onClick={addPart}>
              + Add row
            </Button>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center gap-2 mt-8 pb-12">
          <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none hover:bg-[#e0e7ff]" onClick={onBack}>Back</Button>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saveMutation.isPending}>Save</Button>
          {isEditing && (
            <>
              <Button variant="outline" className="h-8 px-4 text-red-600 border-gray-200">Delete</Button>
              <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none">Reports</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
