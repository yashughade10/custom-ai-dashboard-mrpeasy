"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AddNotePage() {
  const router = useRouter();
  const params = useParams();
  const poNumber = params.poNumber as string;

  const [isImportant, setIsImportant] = useState(false);
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!note.trim()) {
      toast.error("Please enter a note.");
      return;
    }
    
    // Simulating save logic
    toast.success("Note saved successfully!");
    router.push(`/dashboard/mrp/procurement/${poNumber}`);
  };

  return (
    <div className="flex flex-col h-full bg-white text-[13px] text-gray-800">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-[22px] font-normal text-gray-800 mb-4">Add a new note</h1>
        <div className="flex space-x-2">
          <button onClick={() => router.back()} className="flex items-center justify-center px-6 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
            Back
          </button>
          <button onClick={handleSave} className="flex items-center justify-center px-6 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
            Save
          </button>
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        <div className="flex items-center mb-6">
          <label className="w-32 text-right pr-4 text-[13px] text-gray-600">Important</label>
          <Checkbox 
            checked={isImportant} 
            onCheckedChange={(c) => setIsImportant(c as boolean)} 
            className="rounded-[2px] border-gray-300" 
          />
        </div>

        <div className="flex items-start mb-6">
          <label className="w-32 text-right pr-4 text-[13px] text-gray-600 pt-1">Note <span className="text-red-500">*</span></label>
          <Textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 min-h-[120px] bg-[#f4f7fb] border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm text-[13px] resize-y"
          />
        </div>
      </div>

      <div className="p-4 flex space-x-2">
        <button onClick={() => router.back()} className="flex items-center justify-center px-6 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px]">
          Back
        </button>
        <button onClick={handleSave} className="flex items-center justify-center px-6 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded font-medium text-[12px]">
          Save
        </button>
      </div>
    </div>
  );
}
