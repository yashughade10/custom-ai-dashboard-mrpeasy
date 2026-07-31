"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Link as LinkIcon, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type WorkstationGroupFormProps = {
  id?: string;
  onBack: () => void;
};

const PALETTE = [
  "008000", "9ACD32", "ADFF2F", "006400", "00FF7F", "00FF00", "004000",
  "006600", "000080", "0000CD", "1E90FF", "0073CF", "4B0082", "003366",
  "6A5ACD", "4682B4", "B22222", "FF0033", "8B0000", "FF0000", "CD5C5C",
  "800000", "FF69B4", "FF1493", "FF7F50", "FFD700", "FF4500", "FFFF00",
  "FFA500", "F0E68C", "CCFF00", "FF8C00"
];

export default function WorkstationGroupForm({ id, onBack }: WorkstationGroupFormProps) {
  const isEditing = !!id;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    number: "",
    name: "",
    type: "Active processing",
    instances: "1",
    hourly_rate_enabled: false,
    custom_working_hours: false,
    custom_holidays: false,
    colour: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mrp-workstation-group", id],
    queryFn: () => mrpApi.getWorkstationGroupById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        number: data.data.number || "",
        name: data.data.name || "",
        type: data.data.type || "Active processing",
        instances: data.data.instances?.toString() || "1",
        hourly_rate_enabled: !!data.data.hourly_rate_enabled,
        custom_working_hours: !!data.data.custom_working_hours,
        custom_holidays: !!data.data.custom_holidays,
        colour: data.data.colour || ""
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (dataToSave: any) => {
      if (isEditing) {
        return mrpApi.updateWorkstationGroup(id, dataToSave);
      }
      return mrpApi.createWorkstationGroup(dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrp-workstation-groups"] });
      // Invalidate the all-groups query used for the dropdowns
      queryClient.invalidateQueries({ queryKey: ["mrp-workstation-groups-all"] });
      toast.success(`Workstation group ${isEditing ? "updated" : "created"} successfully`);
      onBack();
    },
    onError: () => {
      toast.error("An error occurred");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteWorkstationGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrp-workstation-groups"] });
      queryClient.invalidateQueries({ queryKey: ["mrp-workstation-groups-all"] });
      toast.success("Workstation group deleted successfully");
      onBack();
    },
    onError: () => {
      toast.error("Failed to delete workstation group");
    }
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Please fill in all required fields (*)");
      return;
    }
    const dataToSave = {
      ...formData,
      instances: parseInt(formData.instances) || 1
    };
    mutation.mutate(dataToSave);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const renderButtons = () => (
    <div className="flex gap-2">
      <Button variant="outline" className="bg-[#f0f4ff] text-blue-600 border-none hover:bg-[#e0e7ff] h-8 px-4" onClick={onBack}>
        Back
      </Button>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4" onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save"}
      </Button>
      {isEditing && (
        <>
          <Button variant="outline" className="bg-[#f0f4ff] text-blue-600 border-none hover:bg-[#e0e7ff] h-8 px-4" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4">
            Reports
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col bg-white min-h-[500px]">
      {/* Title */}
      <div className="px-6 pt-4 pb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? `Workstation group ${formData.number} ${formData.name} details` : "Create a workstation group"}
        </h1>
      </div>

      <div className="px-6 py-2 pb-6 flex flex-col gap-6">
        {/* Top Buttons */}
        {renderButtons()}

        {/* Form Fields */}
        <div className="flex flex-col gap-3 max-w-2xl text-[13px] text-gray-700">
          {isEditing && (
            <div className="flex items-center gap-3">
              <label className="w-[180px] text-right font-medium">Number *</label>
              <input
                type="text"
                className="flex-1 h-[32px] bg-[#E8EAEF] border border-gray-300 rounded-sm px-3 focus:outline-none text-gray-700 font-medium"
                value={formData.number}
                readOnly
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right font-medium">Name</label>
            <input
              type="text"
              className={`flex-1 h-[32px] border rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing ? "bg-[#E6F0FF] border-blue-300" : "bg-[#F3F4F6] border-gray-300"}`}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-3">
              <label className="w-[180px] text-right">Number of instances</label>
              <input
                type="text"
                className="flex-1 h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.instances}
                onChange={(e) => handleChange("instances", e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Type</label>
            {isEditing ? (
              <div className="flex-1 font-medium pl-1 text-gray-900">
                {formData.type}
              </div>
            ) : (
              <select
                className="flex-1 h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option value="Active processing">Active processing</option>
                <option value="Sub-contracting">Sub-contracting</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Hourly rate</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-sm border-gray-300 accent-blue-600"
                checked={formData.hourly_rate_enabled}
                onChange={(e) => handleChange("hourly_rate_enabled", e.target.checked)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Custom working hours</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-sm border-gray-300 accent-blue-600"
                checked={formData.custom_working_hours}
                onChange={(e) => handleChange("custom_working_hours", e.target.checked)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Custom holidays</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-sm border-gray-300 accent-blue-600"
                checked={formData.custom_holidays}
                onChange={(e) => handleChange("custom_holidays", e.target.checked)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 h-8">
            <label className="w-[180px] text-right">Files</label>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#f0f4ff] rounded cursor-pointer"><DownloadCloud className="w-4 h-4 text-blue-600" /></div>
              <div className="p-1.5 bg-[#f0f4ff] rounded cursor-pointer"><div className="w-4 h-4 text-blue-600 flex items-center justify-center font-bold text-xs bg-blue-100 rounded-sm">Db</div></div>
              <div className="p-1.5 bg-[#f0f4ff] rounded cursor-pointer"><DownloadCloud className="w-4 h-4 text-blue-600" /></div>
              <div className="p-1.5 bg-[#f0f4ff] rounded cursor-pointer"><LinkIcon className="w-4 h-4 text-blue-600" /></div>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-2">
            <label className="w-[180px] text-right pt-2">Colour</label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1 max-w-[280px]">
                {PALETTE.map((hex) => (
                  <div
                    key={hex}
                    className={`w-[34px] h-[34px] cursor-pointer border ${formData.colour === hex ? 'border-gray-500 shadow-sm ring-2 ring-gray-300 ring-offset-1' : 'border-transparent'}`}
                    style={{ backgroundColor: `#${hex}` }}
                    onClick={() => handleChange("colour", hex)}
                  />
                ))}
              </div>
              <input
                type="text"
                className="w-[280px] h-[28px] bg-[#E8EAEF] border border-gray-300 rounded-sm px-2 mt-1 focus:outline-none text-gray-700 text-xs font-mono"
                value={formData.colour}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="pt-6">
          {renderButtons()}
        </div>
      </div>
    </div>
  );
}
