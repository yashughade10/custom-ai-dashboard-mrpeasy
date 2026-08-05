"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

export default function AddVendorNotePage() {
  const router = useRouter();
  const params = useParams();
  const vendorNumber = params.vendorNumber as string;
  const queryClient = useQueryClient();

  const [note, setNote] = useState("");

  const addNoteMutation = useMutation({
    mutationFn: (data: any) => mrpApi.addVendorNote({ vendorNumber, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorNotes", vendorNumber] });
      router.back();
    },
    onError: (error) => {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  });

  const handleSave = () => {
    if (!note.trim()) {
      alert("Note is required");
      return;
    }
    addNoteMutation.mutate({ note });
  };

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 text-[13px] text-gray-700 font-sans">
      <div className="px-8 py-6 max-w-6xl">
        <h1 className="text-[22px] text-[#1e293b] font-normal mb-6">
          Add a new note
        </h1>

        {/* Top Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={() => router.back()} 
            className="px-6 py-1.5 bg-[#eef2f9] text-[#1e5aa0] rounded hover:bg-[#e4ebf7] border-none font-medium cursor-pointer"
          >
            Back
          </button>
          <button 
            onClick={handleSave} 
            disabled={addNoteMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {addNoteMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-start">
            <label className="w-40 text-right pr-4 text-gray-600 mt-1">Note *</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 bg-[#e4ebf7] border border-[#7b98d1] rounded-sm h-32 p-2 outline-none resize-y focus:border-[#4068ad]" 
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex items-center gap-3 mt-12">
          <button 
            onClick={() => router.back()} 
            className="px-6 py-1.5 bg-[#eef2f9] text-[#1e5aa0] rounded hover:bg-[#e4ebf7] border-none font-medium cursor-pointer"
          >
            Back
          </button>
          <button 
            onClick={handleSave} 
            disabled={addNoteMutation.isPending}
            className="px-6 py-1.5 bg-[#1e5aa0] text-white rounded hover:bg-[#164785] border-none font-medium cursor-pointer"
          >
            {addNoteMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}
