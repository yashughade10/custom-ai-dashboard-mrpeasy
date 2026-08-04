const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const totalQty = allData\.reduce\(\(sum: number, row: any\) => sum \+ Number\(row\.quantity \|\| 0\), 0\);/;

const replacement = `
    const totalQty = allData.reduce((sum: number, row: any) => sum + Number(row.item_quantity || row.total_quantity || 0), 0);
`;

if (regex.test(content)) {
  content = content.replace(regex, replacement.trim());
  fs.writeFileSync(filePath, content);
  console.log('Fixed total quantity summation');
} else {
  console.log('Could not find totalQty summation');
}
