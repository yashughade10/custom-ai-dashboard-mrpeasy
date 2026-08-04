const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `
    // Add data rows
    allData.forEach((row: any) => {
      body.push(pdfCols.map(c => {
        let val = row[c.id];
        
        if (c.id === 'quantity') {
           const qty = row['item_quantity'] || row['total_quantity'] || 0;
           return Number(qty) + ' pcs';
        }
        
        if (val === null || val === undefined) return "";
        
        // format dates
        if (['created_date', 'expected_date'].includes(c.id)) {
           return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        
        return String(val);
      }));
    });
`;

const replaceRegex = /\/\/ Add data rows\s*allData\.forEach\(\(row: any\) => \{[\s\S]*?\}\)\);\s*\}\);/;

if (replaceRegex.test(content)) {
  content = content.replace(replaceRegex, replacement.trim());
  fs.writeFileSync(filePath, content);
  console.log('Fixed undefined check blocking quantity column');
} else {
  console.log('Regex failed');
}
