import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter } from "lucide-react";
import { useState } from "react";

interface ReportFiltersProps {
  onExport: (type: 'csv' | 'excel') => void;
  onFilterChange: (filters: any) => void;
}

export function ReportFilters({ onExport, onFilterChange }: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const handleFilterApply = () => {
    onFilterChange({ dateRange });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-xl border border-border/50 shadow-sm mb-6">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
          <Input 
            type="date" 
            className="h-8 text-xs border-none bg-transparent"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input 
            type="date" 
            className="h-8 text-xs border-none bg-transparent"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleFilterApply} className="h-8">
          <Filter className="w-3 h-3 mr-2" />
          Apply
        </Button>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" size="sm" onClick={() => onExport('csv')} className="h-8">
          <Download className="w-3 h-3 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
