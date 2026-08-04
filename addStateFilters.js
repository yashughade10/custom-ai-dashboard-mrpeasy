const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `    min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",
  });`;

const replacementStr = `    min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",
    po_emailed: "", attention: "", notes: "", account: "",
  });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content);
  console.log('Replaced state init successfully');
} else {
  console.log('Target string for state init not found');
}
