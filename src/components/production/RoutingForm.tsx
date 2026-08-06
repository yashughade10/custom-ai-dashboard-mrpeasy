"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cloud, Link as LinkIcon, Paperclip, GripVertical, Trash2, HardDrive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface RoutingOperationItem {
  id: string; // temp local id for key
  workstationGroupId: string;
  operationDescription: string;
  setupTime: string;
  cycleTime: string;
  fixedCost: string;
  variableCost: string;
  capacity: string;
  departmentWorker: string;
}

interface RoutingFormProps {
  initialProductId?: string; // used when creating
  editingRoutingId?: string; // used when editing
  onBack: () => void;
  onSaved: () => void;
}

export function RoutingForm({ initialProductId, editingRoutingId, onBack, onSaved }: RoutingFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingRoutingId;

  // Form State
  const [productName, setProductName] = useState("");
  const [productNumber, setProductNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [routingName, setRoutingName] = useState("");
  const [operations, setOperations] = useState<RoutingOperationItem[]>([]);

  // Queries
  const { data: routingDetail, isLoading: isLoadingRouting } = useQuery({
    queryKey: ["routing-detail", editingRoutingId],
    queryFn: () => mrpApi.getRoutingById(editingRoutingId!),
    enabled: isEditing,
  });

  const { data: workstationGroupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["workstation-groups"],
    queryFn: () => mrpApi.getWorkstationGroups(),
  });

  const { data: itemsData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["stock-items"],
    queryFn: () => mrpApi.getItems(1, 1000), 
  });

  // Derived options
  const wgOptions = (workstationGroupsData?.data || []).map((wg: any) => ({
    label: wg.name || wg.group_number || "Unnamed Group",
    value: wg.group_number || wg.id?.toString() || Math.random().toString(),
  }));

  useEffect(() => {
    if (isEditing && routingDetail?.success && routingDetail.data) {
      const routing = routingDetail.data;
      setProductName(routing.product_name || "");
      setProductNumber(routing.product_number || "");
      setRoutingNumber(routing.routing_number || "");
      setRoutingName(routing.routing_name || "");
      
      if (routing.operations && routing.operations.length > 0) {
        setOperations(routing.operations.map((o: any) => {
          return {
            id: Math.random().toString(36).substring(7),
            workstationGroupId: o.workstation_group_number || "",
            operationDescription: o.operation_description || "",
            setupTime: o.setup_time?.toString() || "0",
            cycleTime: o.cycle_time?.toString() || "0",
            fixedCost: o.fixed_cost?.toString() || "0",
            variableCost: o.variable_cost?.toString() || "0",
            capacity: o.capacity?.toString() || "1",
            departmentWorker: o.department_worker || "",
          };
        }));
      } else {
        setOperations([createEmptyOperation()]);
      }
    } else if (!isEditing) {
      const product = (itemsData?.data || []).find((i: any) => i.id?.toString() === initialProductId || i.part_number === initialProductId);
      const name = product?.part_description || product?.name || `Product ${initialProductId || ""}`;
      const pNumber = product?.part_number || product?.part_no || "";
      setProductName(name);
      setProductNumber(pNumber);
      setRoutingName(`${name} routing`);
      setOperations([createEmptyOperation()]);
    }
  }, [isEditing, routingDetail, initialProductId, itemsData]);

  const createEmptyOperation = (): RoutingOperationItem => ({
    id: Math.random().toString(36).substring(7),
    workstationGroupId: "",
    operationDescription: "",
    setupTime: "",
    cycleTime: "",
    fixedCost: "",
    variableCost: "",
    capacity: "1",
    departmentWorker: ""
  });

  const addOperation = () => setOperations([...operations, createEmptyOperation()]);
  const removeOperation = (id: string) => setOperations(operations.filter(o => o.id !== id));
  
  const updateOperation = (id: string, field: keyof RoutingOperationItem, value: string) => {
    setOperations(operations.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditing ? mrpApi.updateRouting(editingRoutingId, data) : mrpApi.createRouting(data),
    onSuccess: () => {
      toast.success(isEditing ? "Routing updated successfully" : "Routing created successfully");
      queryClient.invalidateQueries({ queryKey: ["mrp-routings"] });
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save routing");
    }
  });

  const handleSave = () => {
    if (!routingName) {
      toast.error("Routing Name is required");
      return;
    }
    
    // Prepare payload
    const payload: any = {
      routing_name: routingName,
      product_name: productName,
      product_number: productNumber,
      operations: operations.map(o => {
        const wg = (workstationGroupsData?.data || []).find((g: any) => g.group_number === o.workstationGroupId || g.id?.toString() === o.workstationGroupId);
        return {
          workstation_group_number: o.workstationGroupId,
          workstation_group_name: wg?.name || wg?.group_name || "",
          operation_description: o.operationDescription,
          setup_time: parseFloat(o.setupTime) || 0,
          cycle_time: parseFloat(o.cycleTime) || 0,
          fixed_cost: parseFloat(o.fixedCost) || 0,
          variable_cost: parseFloat(o.variableCost) || 0,
          capacity: parseInt(o.capacity) || 1,
          department_worker: o.departmentWorker
        };
      })
    };

    if (isEditing) {
      payload.routing_number = routingNumber;
    }

    saveMutation.mutate(payload);
  };

  if (isEditing && isLoadingRouting) {
    return <div className="p-8 text-center text-gray-500">Loading Routing details...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? `Routing ${routingNumber} ${routingName} details` : `Create a routing`}
        </h1>
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">PDF</Button>
            <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">Excel</Button>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 max-w-[1400px] mx-auto w-full">
        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none hover:bg-[#e0e7ff]" onClick={onBack}>Cancel</Button>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saveMutation.isPending}>Save</Button>
          {isEditing && (
            <Button variant="outline" className="h-8 px-4 text-red-600 border-gray-200">Delete</Button>
          )}
        </div>

        {/* Basic Info Form */}
        <div className="max-w-xl space-y-4 mb-8">
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Product</span>
            <div className="text-sm font-medium text-gray-900 px-3 py-2">{productNumber} {productName || "Unknown Product"}</div>
          </div>
          
          {isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <span className="text-sm text-gray-600 text-right">Number *</span>
              <Input 
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Name *</span>
            <Input 
              value={routingName}
              onChange={(e) => setRoutingName(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Connected BOM</span>
            <div className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              <span>{productNumber} {productName} BOM</span>
            </div>
          </div>

          {!isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <span className="text-sm text-gray-600 text-right">Copy routing</span>
              <select className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value=""></option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Files</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100">
                <LinkIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Detailed view</span>
            <div className="flex items-center">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
            </div>
          </div>
        </div>

        {/* Operations Table */}
        <div className="border border-gray-200 rounded-md overflow-visible mt-6">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fc] border-b border-gray-200">
              <tr>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-8">#</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[250px]">Workstation group</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[200px]">Operation description</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[120px]">Setup time</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[120px]">Cycle time</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[100px]">Fixed cost</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[100px]">Variable cost</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[80px]">Capacity</th>
                <th className="font-medium text-gray-600 text-left py-2 px-3 w-[150px]">Department/Worker</th>
                <th className="font-medium text-gray-600 text-center py-2 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op, index) => (
                <tr key={op.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                  <td className="py-2 px-3">
                    <SearchableSelect 
                      options={wgOptions}
                      value={op.workstationGroupId}
                      onChange={(val) => updateOperation(op.id, "workstationGroupId", val)}
                      placeholder="Select..."
                      isLoading={isGroupsLoading}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      value={op.operationDescription}
                      onChange={(e) => updateOperation(op.id, "operationDescription", e.target.value)}
                      className="h-8 text-xs bg-gray-50 border-gray-200"
                    />
                  </td>
                  <td className="py-2 px-3 flex items-center gap-2">
                    <Input 
                      type="number"
                      value={op.setupTime}
                      onChange={(e) => updateOperation(op.id, "setupTime", e.target.value)}
                      className="h-8 text-xs text-right w-16"
                    />
                    <span className="text-gray-500 text-xs">min.</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={op.cycleTime}
                        onChange={(e) => updateOperation(op.id, "cycleTime", e.target.value)}
                        className="h-8 text-xs text-right w-16"
                      />
                      <span className="text-gray-500 text-xs">min.</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={op.fixedCost}
                        onChange={(e) => updateOperation(op.id, "fixedCost", e.target.value)}
                        className="h-8 text-xs text-right"
                      />
                      <span className="text-gray-500 text-xs">$</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={op.variableCost}
                        onChange={(e) => updateOperation(op.id, "variableCost", e.target.value)}
                        className="h-8 text-xs text-right"
                      />
                      <span className="text-gray-500 text-xs">$</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      type="number"
                      value={op.capacity}
                      onChange={(e) => updateOperation(op.id, "capacity", e.target.value)}
                      className="h-8 text-xs text-right"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      value={op.departmentWorker}
                      onChange={(e) => updateOperation(op.id, "departmentWorker", e.target.value)}
                      className="h-8 text-xs bg-gray-50 border-gray-200"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <GripVertical className="w-4 h-4 cursor-move hover:text-gray-600" />
                      <Trash2 className="w-4 h-4 cursor-pointer hover:text-red-500" onClick={() => removeOperation(op.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 border-t border-gray-100 bg-gray-50 flex">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50" onClick={addOperation}>
              + Add row
            </Button>
          </div>
        </div>

        {/* Bottom Section - Other Costs */}
        <div className="max-w-xl space-y-4 mt-6">
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Other fixed cost</span>
            <div className="flex items-center gap-2">
              <Input className="h-9 max-w-[200px]" />
              <span className="text-gray-500 text-sm">$</span>
            </div>
          </div>
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <span className="text-sm text-gray-600 text-right">Other variable cost</span>
            <div className="flex items-center gap-2">
              <Input className="h-9 max-w-[200px]" />
              <span className="text-gray-500 text-sm">$</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center gap-2 mt-8 pb-12">
          <Button variant="outline" className="h-8 px-4 text-blue-600 bg-[#f0f4ff] border-none hover:bg-[#e0e7ff]" onClick={onBack}>Cancel</Button>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saveMutation.isPending}>Save</Button>
          {isEditing && (
             <Button variant="outline" className="h-8 px-4 text-red-600 border-gray-200">Delete</Button>
          )}
        </div>
      </div>
    </div>
  );
}
