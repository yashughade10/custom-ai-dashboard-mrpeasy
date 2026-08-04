const fs = require('fs');

let code = fs.readFileSync('src/components/procurement/PurchaseOrdersTable.tsx', 'utf8');

const regex = /(\{visibleCols\.arrival_date && \()[\s\S]*?(\{visibleCols\.bwe_job_id && \([\s\S]*?<\/th>\n              \)\})/;

const emptyThs = `{visibleCols.arrival_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.order_id && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.order_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.invoice_id && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.invoice_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.due_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.shipped_on && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.delay && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.po_free_text && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.total_quantity && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.bwe_job_id && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}`;

code = code.replace(regex, emptyThs);

// also remove state initialization
const stateRegex = /min_arrival_date: "", max_arrival_date: "",\n    order_id: "",\n    min_order_date: "", max_order_date: "",\n    invoice_id: "",\n    min_invoice_date: "", max_invoice_date: "",\n    min_due_date: "", max_due_date: "",\n    min_shipped_on: "", max_shipped_on: "",\n    min_delay: "", max_delay: "",\n    po_free_text: "",\n    min_total_quantity: "", max_total_quantity: "",\n    bwe_job_id: "",\n/;
code = code.replace(stateRegex, "");

fs.writeFileSync('src/components/procurement/PurchaseOrdersTable.tsx', code);
console.log('Reverted PurchaseOrdersTable.tsx');
