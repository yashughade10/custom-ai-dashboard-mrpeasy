"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Conversion {
  name: string;
  rate: number;
}

export default function UomFormPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: uomsData, isLoading } = useQuery({
    queryKey: ["mrpUoms"],
    queryFn: () => mrpApi.getUoms(),
    enabled: !isNew
  });

  useEffect(() => {
    if (!isNew && uomsData?.data) {
      const uom = uomsData.data.find((u: any) => u.id.toString() === id);
      if (uom) {
        setName(uom.name || "");
        if (uom.conversions && Array.isArray(uom.conversions)) {
          setConversions(uom.conversions);
        } else if (typeof uom.conversions === "string") {
          try {
            setConversions(JSON.parse(uom.conversions));
          } catch (e) {
            setConversions([]);
          }
        }
      }
    }
  }, [id, isNew, uomsData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isNew ? mrpApi.createUom(data) : mrpApi.updateUom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpUoms"] });
      toast.success(isNew ? "UOM created" : "UOM updated");
      router.push("/dashboard/mrp/inventory/settings/uoms");
    },
    onError: (err) => {
      toast.error("Failed to save UOM");
      console.error(err);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => mrpApi.deleteUom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mrpUoms"] });
      toast.success("UOM deleted");
      router.push("/dashboard/mrp/inventory/settings/uoms");
    },
    onError: (err) => {
      toast.error("Failed to delete UOM");
      console.error(err);
    }
  });

  const handleSave = () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    // Filter out invalid conversions
    const validConversions = conversions.filter(c => c.name && c.rate);
    saveMutation.mutate({ name, conversions: validConversions.length > 0 ? validConversions : null });
  };

  const handleBack = () => {
    router.push("/dashboard/mrp/inventory/settings/uoms");
  };

  const addConversion = () => {
    setConversions([...conversions, { name: "", rate: 1 }]);
  };

  const updateConversion = (index: number, field: keyof Conversion, value: any) => {
    const newConversions = [...conversions];
    newConversions[index] = { ...newConversions[index], [field]: value };
    setConversions(newConversions);
  };

  const removeConversion = (index: number) => {
    const newConversions = [...conversions];
    newConversions.splice(index, 1);
    setConversions(newConversions);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const title = isNew ? "Create unit of measurement" : `Unit of measurement ${name} details`;

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
        
        <div className="flex items-start gap-4 mb-4">
          <label className="w-32 text-right text-gray-700 text-sm pt-2">Unit conversions</label>
          <div className="flex-1">
            <div className="bg-gray-50 rounded border border-gray-200 p-4">
              <div className="flex mb-2 text-sm font-medium text-gray-600 px-2">
                <div className="w-24">Name</div>
                <div className="flex-1 text-center">Rate</div>
                <div className="w-8"></div>
              </div>
              
              {conversions.map((conv, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 bg-white p-2 rounded shadow-sm border border-gray-100">
                  <div className="text-gray-500 text-sm pl-2">1</div>
                  <input 
                    type="text" 
                    value={conv.name}
                    placeholder="e.g. pcs"
                    onChange={e => updateConversion(index, "name", e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <div className="text-gray-500 mx-2">=</div>
                  <input 
                    type="number" 
                    value={conv.rate}
                    min="0"
                    step="0.0001"
                    onChange={e => updateConversion(index, "rate", parseFloat(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <div className="text-gray-700 text-sm font-medium ml-2 w-12">{name || "UNIT"}</div>
                  <button 
                    onClick={() => removeConversion(index)}
                    className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button 
                onClick={addConversion}
                className="mt-2 text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add conversion
              </button>
            </div>
          </div>
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
        title="Delete Unit of Measurement"
        description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
