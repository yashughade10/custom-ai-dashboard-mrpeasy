const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /if \(c\.id === 'quantity'\) \{\s*return Number\(val\) \+ ' pcs';\s*\}/;

const replacement = `
        if (c.id === 'quantity') {
           const qty = row['item_quantity'] || row['total_quantity'] || 0;
           return Number(qty) + ' pcs';
        }
`;

if (regex.test(content)) {
  content = content.replace(regex, replacement.trim());
  fs.writeFileSync(filePath, content);
  console.log('Fixed quantity in frontend PDF');
} else {
  console.log('Could not find quantity handling in frontend');
}
