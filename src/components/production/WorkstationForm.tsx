"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { CalendarDays, DownloadCloud, Link as LinkIcon, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type WorkstationFormProps = {
  id?: string;
  onBack: () => void;
};

export default function WorkstationForm({ id, onBack }: WorkstationFormProps) {
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    number: "",
    name: "",
    type_group: "",
    hourly_rate_enabled: false,
    hourly_rate: "0.00",
    productivity: "1.00",
    default_department: "",
    idle_time_start: "",
    idle_time_end: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mrp-workstation", id],
    queryFn: () => mrpApi.getWorkstationById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        number: data.data.number || "",
        name: data.data.name || "",
        type_group: data.data.type_group || "",
        hourly_rate_enabled: parseFloat(data.data.hourly_rate) > 0,
        hourly_rate: parseFloat(data.data.hourly_rate || 0).toFixed(2),
        productivity: parseFloat(data.data.productivity || 1).toFixed(2),
        default_department: data.data.default_department || "",
        idle_time_start: data.data.idle_time_start || "",
        idle_time_end: data.data.idle_time_end || ""
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (dataToSave: any) => {
      if (isEditing) {
        return mrpApi.updateWorkstation(id, dataToSave);
      }
      return mrpApi.createWorkstation(dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrp-workstations"] });
      toast.success(`Workstation ${isEditing ? "updated" : "created"} successfully`);
      onBack();
    },
    onError: () => {
      toast.error("An error occurred");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteWorkstation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrp-workstations"] });
      toast.success("Workstation deleted successfully");
      onBack();
    },
    onError: () => {
      toast.error("Failed to delete workstation");
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.type_group || !formData.productivity) {
      toast.error("Please fill in all required fields (*)");
      return;
    }
    const dataToSave = {
      ...formData,
      hourly_rate: formData.hourly_rate_enabled ? parseFloat(formData.hourly_rate) : 0,
      productivity: parseFloat(formData.productivity)
    };
    mutation.mutate(dataToSave);
  };

  const handleChange = (field: string, value: any) => {
    if (field === "type_group" && value === "CREATE_NEW_GROUP") {
      router.push("/dashboard/mrp/production/workstation-groups?create=true");
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { data: groupsData } = useQuery({
    queryKey: ["mrp-workstation-groups-all"],
    queryFn: () => mrpApi.getWorkstationGroups(1, 1000, {}),
  });
  const workstationGroups = groupsData?.data || [];

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
    <div className="flex flex-col bg-white">
      {/* Title */}
      <div className="px-6 pt-4 pb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? `Workstation ${formData.number} ${formData.name} details` : "Create a workstation"}
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
            <label className="w-[180px] text-right font-medium">Name *</label>
            <input
              type="text"
              className={`flex-1 h-[32px] border rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing ? "bg-[#E6F0FF] border-blue-300" : "bg-[#F3F4F6] border-gray-300"}`}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right font-medium">Type *</label>
            <select
              className="flex-1 h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.type_group}
              onChange={(e) => handleChange("type_group", e.target.value)}
            >
              <option value=""></option>
              {workstationGroups.map((group: any) => (
                <option key={group.id} value={group.name}>{group.number} {group.name}</option>
              ))}
              <option value="CREATE_NEW_GROUP" className="text-blue-600 font-medium">
                + Create workstation group
              </option>
            </select>
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
              {formData.hourly_rate_enabled && (
                <>
                  <input
                    type="text"
                    className="w-[120px] h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.hourly_rate}
                    onChange={(e) => handleChange("hourly_rate", e.target.value)}
                  />
                  <span className="font-medium">$</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right font-medium">Productivity *</label>
            <input
              type="text"
              className="flex-1 h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.productivity}
              onChange={(e) => handleChange("productivity", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Default department/worker</label>
            <select
              className="flex-1 h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.default_department}
              onChange={(e) => handleChange("default_department", e.target.value)}
            >
              <option value=""></option>
            </select>
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

          <div className="flex items-center gap-3">
            <label className="w-[180px] text-right">Idle time</label>
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <input type="text" className="w-full h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <CalendarDays className="w-4 h-4 absolute right-2.5 top-2 text-gray-400 pointer-events-none" />
              </div>
              <span>-</span>
              <div className="relative flex-1">
                <input type="text" className="w-full h-[32px] bg-[#F3F4F6] border border-gray-300 rounded-sm pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <CalendarDays className="w-4 h-4 absolute right-2.5 top-2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="pt-2">
          {renderButtons()}
        </div>

        {/* Notes Table for Edit View */}
        {isEditing && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#E8EAEF] text-left text-gray-700">
                  <th className="p-2 font-medium border-r border-white w-48">Created ↓</th>
                  <th className="p-2 font-medium border-r border-white w-48">Modified</th>
                  <th className="p-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {/* Empty notes table */}
                <tr className="bg-white">
                  <td colSpan={3} className="p-2 h-10 border-b border-gray-100"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
