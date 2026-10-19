"use client";

import { useState, useEffect } from "react";
import { Cloud, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";

interface CreateManufacturingOrderProps {
  initialData?: any;
  onBack: () => void;
  onSaved?: (order: any) => void;
}

export default function CreateManufacturingOrder({
  initialData,
  onBack,
  onSaved,
}: CreateManufacturingOrderProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData?.id || initialData?.mo_number);

  const formatDateForInput = (d?: string | null) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const formatDateTimeForInput = (d?: string | null) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      const y = date.getFullYear();
      const m = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${y}-${m}-${day}T${h}:${min}`;
    } catch {
      return "";
    }
  };

  const [selectedGroup, setSelectedGroup] = useState(
    initialData?.group_number
      ? `${initialData.group_number} ${initialData.group_name || ""}`.trim()
      : ""
  );
  const [selectedProduct, setSelectedProduct] = useState(initialData?.part_no || "");
  const [quantity, setQuantity] = useState(
    initialData?.quantity ? String(parseFloat(initialData.quantity)) : "1"
  );
  const [dueDate, setDueDate] = useState(formatDateForInput(initialData?.due_date));
  const [startDatetime, setStartDatetime] = useState(
    formatDateTimeForInput(initialData?.start_datetime)
  );
  const [finishDatetime, setFinishDatetime] = useState(
    formatDateTimeForInput(initialData?.finish_datetime)
  );
  const [selectedAssignee, setSelectedAssignee] = useState(
    initialData?.assigned_to || "Kamal"
  );
  const [status, setStatus] = useState(initialData?.status || "Scheduled");
  const [partsStatus, setPartsStatus] = useState(initialData?.parts_status || "Not booked");
  const [doNotBookParts, setDoNotBookParts] = useState(
    initialData?.parts_status === "Not booked"
  );
  const [doNotBookWorkstations, setDoNotBookWorkstations] = useState(false);
  const [wjcProgrammeNumber, setWjcProgrammeNumber] = useState(
    initialData?.wjc_programme_number || ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Product Groups from the database
  const { data: groupsData } = useQuery({
    queryKey: ["mrp-product-groups"],
    queryFn: mrpApi.getProductGroups,
  });

  // Fetch Assignees from the database
  const { data: assigneesData } = useQuery({
    queryKey: ["mrp-assignees"],
    queryFn: mrpApi.getAssignees,
  });

  // Fetch Products (Items) from the database
  const { data: itemsData } = useQuery({
    queryKey: ["mrp-items"],
    queryFn: () => mrpApi.getItems(1, 1000),
  });

  const { data: bomSearchData } = useQuery({
    queryKey: ["mrp-boms-search", selectedProduct],
    queryFn: () => mrpApi.getBoms(1, 10, { search: selectedProduct }),
    enabled: !!selectedProduct,
  });

  const matchingBomId = bomSearchData?.data?.[0]?.id;

  const { data: bomDetailsData, isLoading: isLoadingBom } = useQuery({
    queryKey: ["mrp-bom-details", matchingBomId],
    queryFn: () => mrpApi.getBomById(matchingBomId!),
    enabled: !!matchingBomId && !!selectedProduct,
  });

  const groups = groupsData?.data || [];
  const assignees = assigneesData?.data || ["Kamal"];
  const products = itemsData?.data || [];
  const bomLines = selectedProduct ? bomDetailsData?.data?.items || [] : [];

  // When product is selected, auto-fill group if empty
  const handleProductChange = (prodPartNo: string) => {
    setSelectedProduct(prodPartNo);
    const prod = products.find((p: any) => p.part_no === prodPartNo);
    if (prod && !selectedGroup && (prod.group_number || prod.group_name)) {
      setSelectedGroup(`${prod.group_number || ""} ${prod.group_name || ""}`.trim());
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      toast.error("Please select a Product / Part No.");
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid Quantity greater than 0");
      return;
    }

    setIsSaving(true);
    try {
      const prod = products.find((p: any) => p.part_no === selectedProduct);
      const partDesc =
        prod?.part_description || initialData?.part_description || prod?.description || "";

      let grpNum = "";
      let grpName = "";
      if (selectedGroup) {
        const parts = selectedGroup.split(" ");
        grpNum = parts[0] || "";
        grpName = parts.slice(1).join(" ") || "";
      } else if (prod?.group_number) {
        grpNum = prod.group_number;
        grpName = prod.group_name || "";
      }

      const payload = {
        part_no: selectedProduct,
        part_description: partDesc,
        group_number: grpNum,
        group_name: grpName,
        quantity: qty,
        status: status || "Scheduled",
        parts_status: doNotBookParts ? "Not booked" : partsStatus || "Booked",
        due_date: dueDate || null,
        start_datetime: startDatetime || null,
        finish_datetime: finishDatetime || null,
        assigned_to: selectedAssignee || "Kamal",
        wjc_programme_number: wjcProgrammeNumber || null,
        notes: notes || null,
      };

      if (isEdit && (initialData?.id || initialData?.mo_number)) {
        const targetId = initialData.id || initialData.mo_number;
        await mrpApi.updateManufacturingOrder(targetId, payload);
        toast.success(
          `Manufacturing order ${initialData.mo_number || ""} updated successfully`
        );
      } else {
        const res = await mrpApi.createManufacturingOrder(payload);
        toast.success(
          `Manufacturing order ${res.data?.mo_number || ""} created successfully`
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["mrp-manufacturing-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["mrp-manufacturing-orders-all"] });
      onSaved?.(payload);
      onBack();
    } catch (err: any) {
      console.error("Save manufacturing order failed:", err);
      toast.error(err.message || "Failed to save manufacturing order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id && !initialData?.mo_number) return;
    const moLabel = initialData.mo_number || "this order";
    if (!window.confirm(`Are you sure you want to delete ${moLabel}?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const targetId = initialData.id || initialData.mo_number;
      await mrpApi.deleteManufacturingOrder(targetId);
      toast.success(`Manufacturing order ${moLabel} deleted successfully`);
      await queryClient.invalidateQueries({ queryKey: ["mrp-manufacturing-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["mrp-manufacturing-orders-all"] });
      onBack();
    } catch (err: any) {
      console.error("Delete manufacturing order failed:", err);
      toast.error(err.message || "Failed to delete manufacturing order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-[12.5px] text-gray-800">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          <div className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-3">
            {/* If Edit: display MO number */}
            {isEdit && (
              <>
                <div className="flex items-center justify-end text-gray-600 font-semibold">
                  MO Number
                </div>
                <div className="max-w-[320px]">
                  <input
                    type="text"
                    readOnly
                    value={initialData.mo_number || ""}
                    className="w-full h-[28px] bg-gray-100 text-gray-700 font-mono font-bold border border-gray-200 rounded-sm px-2 cursor-not-allowed"
                  />
                </div>
              </>
            )}

            {/* Product Group */}
            <div className="flex items-center justify-end text-gray-600">Product group</div>
            <div className="max-w-[320px]">
              <SearchableSelect
                options={groups.map((g: any) => ({
                  label: `${g.group_number} ${g.group_name}`,
                  value: `${g.group_number} ${g.group_name}`,
                }))}
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="Select product group..."
              />
            </div>

            {/* Product */}
            <div className="flex items-center justify-end text-gray-600">
              Product <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="max-w-[320px]">
              <SearchableSelect
                options={products.map((p: any) => ({
                  label: `${p.part_no} ${p.part_description || ""}`,
                  value: p.part_no,
                }))}
                value={selectedProduct}
                onChange={handleProductChange}
                placeholder="Select product..."
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-end text-gray-600">
              Quantity <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="max-w-[320px]">
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-right font-medium"
              />
            </div>

            {/* Status (especially useful in Edit mode) */}
            <div className="flex items-center justify-end text-gray-600">Status</div>
            <div className="max-w-[320px]">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In progress">In progress</option>
                <option value="Paused">Paused</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Due date */}
            <div className="flex items-center justify-end text-gray-600">Due date</div>
            <div className="relative max-w-[320px]">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Start */}
            <div className="flex items-center justify-end text-gray-600">Start</div>
            <div className="relative max-w-[320px]">
              <input
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Finish */}
            <div className="flex items-center justify-end text-gray-600">Finish</div>
            <div className="relative max-w-[320px]">
              <input
                type="datetime-local"
                value={finishDatetime}
                onChange={(e) => setFinishDatetime(e.target.value)}
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Assigned to */}
            <div className="flex items-center justify-end text-gray-600">
              Assigned to <span className="text-gray-400 ml-1">*</span>
            </div>
            <div className="max-w-[320px]">
              <SearchableSelect
                options={assignees.map((a: string) => ({
                  label: a,
                  value: a,
                }))}
                value={selectedAssignee}
                onChange={setSelectedAssignee}
                placeholder="Select assignee..."
              />
            </div>

            {/* Checkboxes */}
            <div></div>
            <div className="flex flex-col gap-2 max-w-[320px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doNotBookParts}
                  onChange={(e) => setDoNotBookParts(e.target.checked)}
                  className="w-3 h-3 rounded-sm border-gray-300 accent-blue-600"
                />
                <span>Do not book parts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doNotBookWorkstations}
                  onChange={(e) => setDoNotBookWorkstations(e.target.checked)}
                  className="w-3 h-3 rounded-sm border-gray-300 accent-blue-600"
                />
                <span>Do not book workstations</span>
              </label>
            </div>

            {/* WJC PROGRAMME NUMBER */}
            <div className="flex items-center justify-end text-gray-600 mt-2 uppercase">
              WJC PROGRAMME NUMBER
            </div>
            <div className="max-w-[320px] mt-2 relative">
              <input
                type="text"
                value={wjcProgrammeNumber}
                onChange={(e) => setWjcProgrammeNumber(e.target.value)}
                placeholder="e.g. WJC-0012"
                className="w-full h-[28px] bg-[#EEF0F4] border border-gray-200 rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Notes */}
            <div className="flex items-center justify-end text-gray-600">Notes</div>
            <div className="max-w-[320px]">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Production notes..."
                className="w-full bg-[#EEF0F4] border border-gray-200 rounded-sm p-2 focus:ring-1 focus:ring-blue-500 outline-none resize-y text-xs"
              />
            </div>
          </div>
        </div>

        {/* BOM Table */}
        <div className="mt-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#EEF0F4] text-left">
                <th className="py-1.5 px-4 font-normal text-gray-800 w-[180px] text-right pr-4">
                  Bill of materials <span className="text-gray-400">*</span>
                </th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Bill of materials</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Approximate cost</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Earliest start date</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Earliest finish date</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingBom ? (
                <tr>
                  <td className="py-4 text-right pr-4 text-gray-500">Loading BOM...</td>
                  <td colSpan={4}></td>
                </tr>
              ) : bomLines.length > 0 ? (
                bomLines.map((line: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-2 px-4 text-right pr-4 text-gray-500">
                      {idx === 0 ? "Items" : ""}
                    </td>
                    <td className="py-2 px-2 font-medium">
                      {line.component_part_no} - {line.component_description} (
                      {line.quantity} {line.uom})
                    </td>
                    <td className="py-2 px-2">
                      ${Number(line.approximate_cost || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-gray-400">-</td>
                    <td className="py-2 px-2 text-gray-400">-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-right pr-4 text-gray-400">
                    {selectedProduct ? "No BOM configured for this item" : "Select a product to view BOM"}
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-2 px-6 py-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
