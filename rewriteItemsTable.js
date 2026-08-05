const fs = require('fs');

let content = fs.readFileSync('./src/components/procurement/ProcurementItemsTable.tsx', 'utf-8');

// 1. Rename Component
content = content.replace(/export default function PurchaseOrdersTable\(\)/g, 'export default function ProcurementItemsTable()');

// 2. Replace ALL_COLUMNS
const allColumnsReplacement = `const ALL_COLUMNS = [
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
  { id: 'vendor_name', label: 'Vendor name' },
  { id: 'free_text', label: 'Free text' },
  { id: 'total', label: 'Total' },
  { id: 'tax', label: 'Tax' },
  { id: 'total_including_tax', label: 'Total including tax' },
  { id: 'unit_cost', label: 'Unit price' },
  { id: 'currency', label: 'Currency' },
  { id: 'total_in_currency', label: 'Total in summary' },
  { id: 'tax_in_currency', label: 'Tax in summary' },
  { id: 'total_including_tax_in_currency', label: 'Total including tax in summary' },
  { id: 'invoice_status', label: 'Invoice status' },
  { id: 'created_by', label: 'Created by' },
  { id: 'arrival_date', label: 'Arrival date' },
  { id: 'order_id', label: 'Order ID' },
  { id: 'order_date', label: 'Order date' },
  { id: 'invoice_id', label: 'Invoice ID' },
  { id: 'invoice_date', label: 'Invoice date' },
  { id: 'due_date', label: 'Due date' },
  { id: 'shipped_on', label: 'Shipped on' },
  { id: 'po_notes', label: 'PO Notes' },
  { id: 'bwe_job_id', label: 'BWE Job ID' },
  { id: 'po_emailed', label: 'PO Emailed' },
  { id: 'attention', label: 'Attention' },
  { id: 'notes', label: 'NOTES' },
  { id: 'account', label: 'ACCOUNT' }
];`;

content = content.replace(/const ALL_COLUMNS = \[\s*([\s\S]*?)\];/, allColumnsReplacement);

// 3. Replace API Call
content = content.replace(/mrpApi\.getPurchaseOrders\(/g, 'mrpApi.getPurchaseOrderItems(');
content = content.replace(/mrpPurchaseOrders/g, 'mrpPurchaseOrderItems');
content = content.replace(/exportPurchaseOrders/g, 'getPurchaseOrderItems');

// 4. In fetchAllData, replace exportPurchaseOrders with getPurchaseOrderItems(1, 99999, activeFilters)
content = content.replace(/await mrpApi\.getPurchaseOrderItems\(activeFilters\)/g, 'await mrpApi.getPurchaseOrderItems(1, 99999, activeFilters)');

// 5. Replace PDF Cols
content = content.replace(/const pdfCols = \[\s*([\s\S]*?)\];/, `const pdfCols = ALL_COLUMNS.slice(0, 10);`);

// 6. Simplify the thead completely
const theadReplacement = `<thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
              <tr>
                <th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>
                {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                  <th key={col.id} className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-white print:hidden">
                <td className="p-1 border-r border-gray-300 border-b border-gray-300 text-center">
                  <button className="text-gray-500 hover:text-gray-700"><Settings2 className="h-4 w-4" /></button>
                </td>
                {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                  <td key={col.id} className="p-1 border-r border-gray-300 border-b border-gray-300">
                    <input type="text" className="w-full h-7 bg-[#f8fafc] border-transparent rounded text-xs px-2 focus:ring-1 focus:ring-[#1d5ab0] focus:bg-white transition-all outline-none" placeholder={col.label} />
                  </td>
                ))}
              </tr>
            </thead>`;
content = content.replace(/<thead[\s\S]*?<\/thead>/, theadReplacement);

// 7. Simplify tbody
const tbodyReplacement = `<tbody>
              {isLoading && limit === 50 && orders.length === 0 ? (
                <tr>
                  <td colSpan={100} className="text-center py-12 text-gray-500">Loading items...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={100} className="px-4 py-8 text-center text-gray-500">No data available</td>
                </tr>
              ) : (
                orders.map((item: any, i: number) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-2 text-center text-gray-400 text-xs border-r border-gray-200">
                      {i + 1}
                    </td>
                    {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                      <td key={col.id} className="p-2 border-r border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={String(item[col.id] || "")}>
                        {item[col.id] !== null && item[col.id] !== undefined ? String(item[col.id]) : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>`;
content = content.replace(/<tbody[\s\S]*?<\/tbody>/, tbodyReplacement);

// Remove the hardcoded totals row logic for simplicity (since we made tbody generic)
content = content.replace(/<tfoot[\s\S]*?<\/tfoot>/, '');

fs.writeFileSync('./src/components/procurement/ProcurementItemsTable.tsx', content);
console.log("Done");
