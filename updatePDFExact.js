const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update fetchAllData
content = content.replace(
  'const response = await mrpApi.getPurchaseOrders(1, 10000, activeFilters);',
  'const response = await mrpApi.exportPurchaseOrders(activeFilters);'
);

// Update PDF generation
const newPDFLogic = `
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

    // Exact columns from user request
    const pdfCols = [
      { id: 'po_number', label: 'Number' },
      { id: 'part_no', label: 'Part No.' },
      { id: 'part_description', label: 'Part description' },
      { id: 'group_number', label: 'Group number' },
      { id: 'group_name', label: 'Group name' },
      { id: 'status', label: 'Status' },
      { id: 'quantity', label: 'Quantity' },
      { id: 'created_date', label: 'Created' },
      { id: 'expected_date', label: 'Expected date' },
      { id: 'vendor_number', label: 'Vendor number' },
      { id: 'vendor_name', label: 'Vendor name' }
    ];

    const head = [pdfCols.map(c => c.label)];
    
    const body = allData.map((row: any) => {
      return pdfCols.map(c => {
        let val = row[c.id];
        if (val === null || val === undefined) return "";
        
        // format dates
        if (['created_date', 'expected_date'].includes(c.id)) {
           return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        if (c.id === 'quantity') {
           // Display with pcs or just the number
           return Number(val) + ' pcs';
        }
        return String(val);
      });
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [220, 220, 220], overflow: 'linebreak' },
      headStyles: { fillColor: [240, 244, 248], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 20, left: 14, right: 14 },
    });
    
    doc.save('purchase_orders.pdf');
  };
`;

const pdfRegex = /const handleDownloadPDF = async \(\) => \{[\s\S]*?doc\.save\('purchase_orders\.pdf'\);\n  \};/;

if (pdfRegex.test(content)) {
  content = content.replace(pdfRegex, newPDFLogic.trim());
  fs.writeFileSync(filePath, content);
  console.log('PDF logic updated!');
} else {
  console.log('Regex failed to find handleDownloadPDF');
}
