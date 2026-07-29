"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, Cloud, HardDrive, Share2 } from "lucide-react";

export default function AddNewOrderNotePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Add a new note</h1>

        {/* Top Toolbar */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>

        {/* Form Fields */}
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div className="grid grid-cols-[100px_1fr] items-baseline gap-4">
              <label className="text-sm text-right text-gray-700">Company</label>
              <div className="text-sm text-gray-900">CU01439 1770 CASTAWAY SURVIVER PTY LTD ATF SEQ CRANE HIRE</div>
            </div>

            <div className="grid grid-cols-[100px_1fr] items-start gap-4">
              <label className="text-sm text-right text-gray-700 pt-2">Note *</label>
              <Textarea className="min-h-[120px] bg-blue-50/30 border-blue-200 focus-visible:ring-blue-500 rounded-sm" />
            </div>

            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label className="text-sm text-right text-gray-700">Files</label>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Link className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}
