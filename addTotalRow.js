const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `
    const head = [pdfCols.map(c => c.label)];
    
    // Calculate total quantity
    const totalQty = allData.reduce((sum: number, row: any) => sum + Number(row.quantity || 0), 0);

    const body: any[] = [];
    
    // Add Total row
    const totalRow = pdfCols.map(c => {
      if (c.id === 'po_number') return 'Total:';
      if (c.id === 'quantity') return totalQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return '';
    });
    body.push(totalRow);

    // Add data rows
    allData.forEach((row: any) => {
      body.push(pdfCols.map(c => {
        let val = row[c.id];
        if (val === null || val === undefined) return "";
        
        // format dates
        if (['created_date', 'expected_date'].includes(c.id)) {
           return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        if (c.id === 'quantity') {
           return Number(val) + ' pcs';
        }
        return String(val);
      }));
    });
`;

const replaceRegex = /const head = \[pdfCols\.map\(c => c\.label\)\];\s*const body = allData\.map\(\(row: any\) => \{[\s\S]*?\}\);\s*\}\);/;

if (replaceRegex.test(content)) {
  content = content.replace(replaceRegex, replacement.trim());
  fs.writeFileSync(filePath, content);
  console.log('Added total row');
} else {
  console.log('Regex failed');
}
