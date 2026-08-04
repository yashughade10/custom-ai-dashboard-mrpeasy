const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import jsPDF from "jspdf"')) {
  content = content.replace(
    'import { toast } from "sonner";',
    'import { toast } from "sonner";\nimport jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";'
  );
}

// Replacement for handleDownloadCSV and handleDownloadPDF
const fetchAllData = `
  const fetchAllData = async () => {
    try {
      toast.loading("Fetching all data...", { id: "export" });
      const response = await mrpApi.getPurchaseOrders(1, 10000, activeFilters);
      if (!response.data || response.data.length === 0) {
        toast.dismiss("export");
        toast.error("No data to export");
        return null;
      }
      toast.dismiss("export");
      return response.data;
    } catch (error) {
      toast.dismiss("export");
      toast.error("Failed to fetch data for export");
      return null;
    }
  };

  const handleDownloadCSV = async () => {
    const allData = await fetchAllData();
    if (!allData) return;
    
    const headers = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label);
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    allData.forEach((order: any) => {
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

  const handleDownloadPDF = async () => {
    const allData = await fetchAllData();
    if (!allData) return;

    const doc = new jsPDF('landscape');
    
    // Add header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Purchase orders", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(today, doc.internal.pageSize.width - 14, 15, { align: "right" });

    // Table columns
    // The user wanted columns like: Number, Status, Quantity, Created, Expected date, Vendor number, Vendor name
    // We will use visible columns, but style it like the image
    const head = [ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label)];
    const body = allData.map((order: any) => {
      return ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = order[c.id];
        if (val === null || val === undefined) return "";
        
        // format dates
        if (['created_date', 'expected_date', 'arrival_date', 'order_date', 'invoice_date', 'due_date', 'shipped_on'].includes(c.id)) {
           return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return String(val);
      });
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [220, 220, 220] },
      headStyles: { fillColor: [240, 244, 248], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 20, left: 14, right: 14 },
    });
    
    doc.save('purchase_orders.pdf');
  };
`;

const oldRegex = /const handleDownloadCSV = \(\) => \{[\s\S]*?const handleSearch = \(\) => \{/;

if (oldRegex.test(content)) {
  content = content.replace(oldRegex, fetchAllData + '\n  const handleSearch = () => {');
  fs.writeFileSync(filePath, content);
  console.log('Replaced download logic');
} else {
  console.log('Could not find download logic to replace');
}
