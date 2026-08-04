"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ProductGroupFormPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const isNew = id === "new";

  const [groupNumber, setGroupNumber] = useState("");
  const [groupName, setGroupName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ["mrpProductGroups"],
    queryFn: () => mrpApi.getProductGroups(),
    enabled: !isNew
  });

  useEffect(() => {
    if (!isNew && groupsData?.data) {
      const group = groupsData.data.find((g: any) => g.id.toString() === id);
      if (group) {
        setGroupNumber(group.group_number || "");
        setGroupName(group.group_name || "");
      }
    }
  }, [id, isNew, groupsData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isNew ? mrpApi.createProductGroup(data) : mrpApi.updateProductGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpProductGroups"] });
      toast.success(isNew ? "Product group created" : "Product group updated");
      router.push("/dashboard/mrp/inventory/settings/product-groups");
    },
    onError: (err) => {
      toast.error("Failed to save product group");
      console.error(err);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteProductGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpProductGroups"] });
      toast.success("Product group deleted");
      router.push("/dashboard/mrp/inventory/settings/product-groups");
    },
    onError: (err) => {
      toast.error("Failed to delete product group");
      console.error(err);
    }
  });

  const handleSave = () => {
    if (!groupNumber) {
      toast.error("Number is required");
      return;
    }
    saveMutation.mutate({ group_number: groupNumber, group_name: groupName });
  };

  const handleBack = () => {
    router.push("/dashboard/mrp/inventory/settings/product-groups");
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const title = isNew ? "Create a product group" : `Product group ${groupNumber} ${groupName} details`;

  return (
    <div className="flex flex-col p-6 flex-1">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h1>
      
      <div className="flex gap-2 mb-8">
        <button 
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 text-blue-600 rounded font-medium hover:bg-gray-200"
        >
          Back
        </button>
        <button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        {!isNew && (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-gray-100 text-blue-600 rounded font-medium hover:bg-gray-200 ml-2"
          >
            Delete
          </button>
        )}
      </div>

      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          <label className="w-32 text-right text-gray-700 text-sm">Number *</label>
          <input 
            type="text" 
            value={groupNumber} 
            onChange={e => setGroupNumber(e.target.value)}
            className="flex-1 px-3 py-2 border border-blue-300 rounded bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="w-32 text-right text-gray-700 text-sm">Name</label>
          <input 
            type="text" 
            value={groupName} 
            onChange={e => setGroupName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-8">
        <button 
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 text-blue-600 rounded font-medium hover:bg-gray-200"
        >
          Back
        </button>
        <button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        {!isNew && (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-gray-100 text-blue-600 rounded font-medium hover:bg-gray-200 ml-2"
          >
            Delete
          </button>
        )}
      </div>

      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Product Group"
        description={`Are you sure you want to delete "${groupNumber} ${groupName}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
