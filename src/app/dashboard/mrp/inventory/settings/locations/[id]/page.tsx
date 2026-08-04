"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function StorageLocationFormPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["mrpStorageLocations"],
    queryFn: () => mrpApi.getStorageLocations(),
    enabled: !isNew
  });

  useEffect(() => {
    if (!isNew && locationsData?.data) {
      const loc = locationsData.data.find((l: any) => l.id.toString() === id);
      if (loc) {
        setName(loc.name || "");
      }
    }
  }, [id, isNew, locationsData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isNew ? mrpApi.createStorageLocation(data) : mrpApi.updateStorageLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpStorageLocations"] });
      toast.success(isNew ? "Storage location created" : "Storage location updated");
      router.push("/dashboard/mrp/inventory/settings/locations");
    },
    onError: (err) => {
      toast.error("Failed to save storage location");
      console.error(err);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteStorageLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpStorageLocations"] });
      toast.success("Storage location deleted");
      router.push("/dashboard/mrp/inventory/settings/locations");
    },
    onError: (err) => {
      toast.error("Failed to delete storage location");
      console.error(err);
    }
  });

  const handleSave = () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    saveMutation.mutate({ name });
  };

  const handleBack = () => {
    router.push("/dashboard/mrp/inventory/settings/locations");
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const title = isNew ? "Create storage location" : `Storage location ${name} details`;

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
          <label className="w-32 text-right text-gray-700 text-sm">Name *</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="flex-1 px-3 py-2 border border-blue-300 rounded bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        title="Delete Storage Location"
        description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
