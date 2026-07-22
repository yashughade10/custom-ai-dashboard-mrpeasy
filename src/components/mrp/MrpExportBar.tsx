import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, MoreHorizontal } from "lucide-react";

interface MrpExportBarProps {
  onCreate?: () => void;
  createLabel?: string;
}

export function MrpExportBar({ onCreate, createLabel = "Create" }: MrpExportBarProps) {
  return (
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="flex items-center gap-2">
        <Button onClick={onCreate} className="bg-[#428bca] hover:bg-[#3071a9] text-white h-8 px-4 text-sm rounded-sm">
          <Plus className="h-4 w-4 mr-1" />
          {createLabel}
        </Button>
        <Button variant="outline" className="h-8 px-3 text-gray-600 rounded-sm border-gray-300">
          PDF
        </Button>
        <Button variant="outline" className="h-8 px-3 text-gray-600 rounded-sm border-gray-300">
          CSV
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-8 px-3 text-gray-600 rounded-sm border-gray-300">
          <Upload className="h-4 w-4 mr-1" />
          Import from CSV
        </Button>
        <Button variant="ghost" className="h-8 px-2 text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
