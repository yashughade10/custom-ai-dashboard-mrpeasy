const fs = require('fs');

const path = 'src/components/procurement/ProcurementItemsTable.tsx';
let content = fs.readFileSync(path, 'utf8');

const newAllColumns = `const ALL_COLUMNS = [
  { id: 'po_number', label: 'Number', filter: 'text' },
  { id: 'part_no', label: 'Part No.', filter: 'text' },
  { id: 'part_description', label: 'Part description', filter: 'text' },
  { id: 'group_number', label: 'Group number', filter: 'text' },
  { id: 'group_name', label: 'Group name', filter: 'text' },
  { id: 'status', label: 'Status', filter: 'text' },
  { id: 'quantity', label: 'Quantity', filter: 'range', minKey: 'min_quantity', maxKey: 'max_quantity' },
  { id: 'created_date', label: 'Created', filter: 'range', minKey: 'min_created_date', maxKey: 'max_created_date' },
  { id: 'expected_date', label: 'Expected date', filter: 'range', minKey: 'min_expected_date', maxKey: 'max_expected_date' },
  { id: 'vendor_number', label: 'Vendor number', filter: 'text' },
  { id: 'vendor_name', label: 'Vendor name', filter: 'text' },
  { id: 'free_text', label: 'Free text', filter: 'text' },
  { id: 'total', label: 'Total', filter: 'range', minKey: 'min_total', maxKey: 'max_total' },
  { id: 'tax', label: 'Tax', filter: 'range', minKey: 'min_tax', maxKey: 'max_tax' },
  { id: 'total_including_tax', label: 'Total including tax', filter: 'range', minKey: 'min_total_including_tax', maxKey: 'max_total_including_tax' },
  { id: 'unit_cost', label: 'Unit price', filter: 'range', minKey: 'min_unit_cost', maxKey: 'max_unit_cost' },
  { id: 'currency', label: 'Currency', filter: 'text' },
  { id: 'total_in_currency', label: 'Total in summary', filter: 'range', minKey: 'min_total_in_currency', maxKey: 'max_total_in_currency' },
  { id: 'tax_in_currency', label: 'Tax in summary', filter: 'range', minKey: 'min_tax_in_currency', maxKey: 'max_tax_in_currency' },
  { id: 'total_including_tax_in_currency', label: 'Total including tax in summary', filter: 'range', minKey: 'min_total_including_tax_in_currency', maxKey: 'max_total_including_tax_in_currency' },
  { id: 'invoice_status', label: 'Invoice status', filter: 'text' },
  { id: 'created_by', label: 'Created by', filter: 'text' },
  { id: 'arrival_date', label: 'Arrival date', filter: 'range', minKey: 'min_arrival_date', maxKey: 'max_arrival_date' },
  { id: 'order_id', label: 'Order ID', filter: 'text' },
  { id: 'order_date', label: 'Order date', filter: 'range', minKey: 'min_order_date', maxKey: 'max_order_date' },
  { id: 'invoice_id', label: 'Invoice ID', filter: 'text' },
  { id: 'invoice_date', label: 'Invoice date', filter: 'range', minKey: 'min_invoice_date', maxKey: 'max_invoice_date' },
  { id: 'due_date', label: 'Due date', filter: 'range', minKey: 'min_due_date', maxKey: 'max_due_date' },
  { id: 'shipped_on', label: 'Shipped on', filter: 'range', minKey: 'min_shipped_on', maxKey: 'max_shipped_on' },
  { id: 'po_notes', label: 'PO Notes', filter: 'text' },
  { id: 'bwe_job_id', label: 'BWE Job ID', filter: 'text' },
  { id: 'po_emailed', label: 'PO Emailed', filter: 'text' },
  { id: 'attention', label: 'Attention', filter: 'text' },
  { id: 'notes', label: 'NOTES', filter: 'text' },
  { id: 'account', label: 'ACCOUNT', filter: 'text' }
];`;

const newEmptyFilters = `const emptyFilters = {
  po_number: "", part_no: "", part_description: "", group_number: "", group_name: "", status: "", vendor_number: "", vendor_name: "", free_text: "", currency: "", invoice_status: "", created_by: "", order_id: "", invoice_id: "", po_notes: "", bwe_job_id: "", po_emailed: "", attention: "", notes: "", account: "",
  min_quantity: "", max_quantity: "",
  min_created_date: "", max_created_date: "",
  min_expected_date: "", max_expected_date: "",
  min_total: "", max_total: "",
  min_tax: "", max_tax: "",
  min_total_including_tax: "", max_total_including_tax: "",
  min_unit_cost: "", max_unit_cost: "",
  min_total_in_currency: "", max_total_in_currency: "",
  min_tax_in_currency: "", max_tax_in_currency: "",
  min_total_including_tax_in_currency: "", max_total_including_tax_in_currency: "",
  min_arrival_date: "", max_arrival_date: "",
  min_order_date: "", max_order_date: "",
  min_invoice_date: "", max_invoice_date: "",
  min_due_date: "", max_due_date: "",
  min_shipped_on: "", max_shipped_on: ""
};`;

content = content.replace(/const ALL_COLUMNS = \[[\s\S]*?\];/, newAllColumns);
content = content.replace(/const emptyFilters = \{[\s\S]*?\};/, newEmptyFilters);
content = content.replace(/const \[filters, setFilters\] = useState\(\{[\s\S]*?\}\);/, 'const [filters, setFilters] = useState(emptyFilters);');

// Replace the table header input rendering
const oldInputRender = `{ALL_COLUMNS.map((col) => visibleCols[col.id] && (
                  <td key={col.id} className="p-1 border-r border-gray-300 border-b border-gray-300 relative">
                    <input 
                      type="text" 
                      name={col.id}
                      value={filters[col.id as keyof typeof filters] || ""}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      className="w-full h-7 bg-[#f8fafc] border-transparent rounded text-xs px-2 focus:ring-1 focus:ring-[#1d5ab0] focus:bg-white transition-all outline-none" 
                      placeholder={col.label} 
                    />
                  </td>
                ))}`;

const newInputRender = `{ALL_COLUMNS.map((col) => visibleCols[col.id] && (
                  <td key={col.id} className="p-1 border-r border-gray-300 border-b border-gray-300 relative align-bottom">
                    {col.filter === 'range' ? (
                      <div className="flex flex-col gap-[2px]">
                        <input 
                          type="text" 
                          name={col.minKey}
                          value={filters[col.minKey as keyof typeof filters] || ""}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className="w-full h-5 bg-[#f8fafc] border-transparent rounded-sm text-[10px] px-1.5 focus:ring-1 focus:ring-[#1d5ab0] focus:bg-white transition-all outline-none placeholder:text-gray-400" 
                          placeholder="Min" 
                        />
                        <input 
                          type="text" 
                          name={col.maxKey}
                          value={filters[col.maxKey as keyof typeof filters] || ""}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className="w-full h-5 bg-[#f8fafc] border-transparent rounded-sm text-[10px] px-1.5 focus:ring-1 focus:ring-[#1d5ab0] focus:bg-white transition-all outline-none placeholder:text-gray-400" 
                          placeholder="Max" 
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end h-[42px]">
                        <input 
                          type="text" 
                          name={col.id}
                          value={filters[col.id as keyof typeof filters] || ""}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className="w-full h-[22px] bg-[#f8fafc] border-transparent rounded-sm text-[11px] px-1.5 focus:ring-1 focus:ring-[#1d5ab0] focus:bg-white transition-all outline-none placeholder:text-gray-400" 
                          placeholder={col.label} 
                        />
                      </div>
                    )}
                  </td>
                ))}`;

content = content.replace(oldInputRender, newInputRender);
fs.writeFileSync(path, content);
console.log('Frontend updated.');
