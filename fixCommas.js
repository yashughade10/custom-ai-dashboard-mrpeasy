const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of .toFixed(2) in the table cells with .toLocaleString
// We will look for `.toFixed(2)}</td>` and replace the logic before it.
// Actually, it's easier to find `Number(X).toFixed(2)` and replace with `formatCurrency(X)`
// Let's add the formatCurrency function right before `return (`

if (!content.includes('const formatCurrency')) {
    const returnIndex = content.indexOf('return (');
    const funcStr = `  const formatCurrency = (val: any) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n\n  `;
    content = content.slice(0, returnIndex) + funcStr + content.slice(returnIndex);
}

// Now replace `Number(X).toFixed(2)` with `formatCurrency(X)`
content = content.replace(/Number\(([^)]+)\)\.toFixed\(2\)/g, 'formatCurrency($1)');

fs.writeFileSync(filePath, content);
console.log('Fixed commas in PurchaseOrdersTable.tsx');
