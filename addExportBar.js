const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import { MrpExportBar } from "@/components/mrp/MrpExportBar";')) {
  content = content.replace(
    'import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2 } from "lucide-react";',
    `import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2 } from "lucide-react";\nimport { MrpExportBar } from "@/components/mrp/MrpExportBar";`
  );
}

const csvLogic = `
  const handleDownloadCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label);
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    orders.forEach((order: any) => {
      const row = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = order[c.id];
        if (val === null || val === undefined) val = "";
        val = String(val).replace(/"/g, '""');
        return \`"\${val}"\`;
      });
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "purchase_orders.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPDF = () => {
    window.print();
  };
`;

if (!content.includes('handleDownloadCSV')) {
  content = content.replace(
    'const handleSearch = () => {',
    csvLogic + '\n  const handleSearch = () => {'
  );
}

const exportBarJSX = `<MrpExportBar 
        createLabel="Create PO" 
        onDownloadPDF={handleDownloadPDF} 
        onDownloadCSV={handleDownloadCSV} 
      />\n      <div className="flex justify-between items-center bg-white p-3 border-b border-gray-200">`;

if (!content.includes('MrpExportBar \n        createLabel=')) {
  content = content.replace(
    '<div className="flex justify-between items-center bg-white p-3 border-b border-gray-200">',
    exportBarJSX
  );
}

fs.writeFileSync(filePath, content);
console.log('Done');
