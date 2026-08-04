const fs = require('fs');

const COLUMNS_DEF = [
  { id: 'total', label: 'Total', align: 'right' },
  { id: 'po_number', label: 'Number', sortable: true },
  { id: 'status', label: 'Status' },
  { id: 'created_date', label: 'Created' },
  { id: 'expected_date', label: 'Expected date' },
  { id: 'vendor_number', label: 'Vendor number' },
  { id: 'vendor_name', label: 'Vendor name' },
  { id: 'tax', label: 'Tax', align: 'right' },
  { id: 'total_including_tax', label: 'Total including tax', align: 'right' },
  { id: 'paid', label: 'Paid', align: 'right' },
  { id: 'unpaid', label: 'Unpaid', align: 'right' },
  { id: 'currency', label: 'Currency', align: 'center' },
  { id: 'total_in_currency', label: 'Total (in currency)', align: 'right' },
  { id: 'tax_in_currency', label: 'Tax (in currency)', align: 'right' },
  { id: 'total_including_tax_in_currency', label: 'Total including tax (in currency)', align: 'right' },
  { id: 'paid_in_currency', label: 'Paid (in currency)', align: 'right' },
  { id: 'unpaid_in_currency', label: 'Unpaid (in currency)', align: 'right' },
  { id: 'invoice_status', label: 'Invoice status' },
  { id: 'payment_status', label: 'Payment status' },
  { id: 'created_by', label: 'Created by' },
  { id: 'arrival_date', label: 'Arrival date' },
  { id: 'order_id', label: 'Order ID' },
  { id: 'order_date', label: 'Order date' },
  { id: 'invoice_id', label: 'Invoice ID' },
  { id: 'invoice_date', label: 'Invoice date' },
  { id: 'due_date', label: 'Due date' },
  { id: 'shipped_on', label: 'Shipped on' },
  { id: 'delay', label: 'Delay', align: 'center' },
  { id: 'po_free_text', label: 'PO free text' },
  { id: 'total_quantity', label: 'Total quantity', align: 'center' },
  { id: 'bwe_job_id', label: 'B.W.E. Job ID' },
  { id: 'po_emailed', label: 'PO Emailed' },
  { id: 'attention', label: 'Attention' },
  { id: 'notes', label: 'NOTES' },
  { id: 'account', label: 'ACCOUNT' }
];

const ALL_COLUMNS_CODE = `
const ALL_COLUMNS = [
${COLUMNS_DEF.map(c => "  { id: '" + c.id + "', label: '" + c.label + "' },").join('\\n')}
];
`;

const THEAD_HEADERS = COLUMNS_DEF.map(c => {
  if (c.id === 'po_number') {
    return '              {visibleCols.po_number && (\n' +
           '                <th className="font-medium p-2 leading-tight flex items-center gap-1 border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">\n' +
           '                  Number <span className="text-gray-400">↓</span>\n' +
           '                </th>\n' +
           '              )}';
  }
  let classes = "font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap";
  if (c.align === 'right') classes += " text-right";
  if (c.align === 'center') classes += " text-center";
  return '              {visibleCols.' + c.id + ' && <th className="' + classes + '">' + c.label + '</th>}';
}).join('\\n');

const FILTER_ROW = COLUMNS_DEF.map(c => {
  if (c.id === 'total') {
    return '              {visibleCols.total && (\n' +
           '                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">\n' +
           '                  <input name="min_total" value={filters.min_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />\n' +
           '                  <input name="max_total" value={filters.max_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />\n' +
           '                </th>\n' +
           '              )}';
  }
  if (c.id === 'po_number') {
    return '              {visibleCols.po_number && (\n' +
           '                <th className="p-1.5 align-top border-r border-gray-300 font-normal">\n' +
           '                  <input name="po_number" value={filters.po_number} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />\n' +
           '                </th>\n' +
           '              )}';
  }
  if (c.id === 'status') {
    return '              {visibleCols.status && (\n' +
           '                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-28">\n' +
           '                  <div className="relative">\n' +
           '                    <select \n' +
           '                      name="status" \n' +
           '                      value={filters.status} \n' +
           '                      onChange={(e) => {\n' +
           '                        const val = e.target.value;\n' +
           '                        setFilters(prev => ({ ...prev, status: val }));\n' +
           '                        setActiveFilters(prev => ({ ...prev, status: val }));\n' +
           '                        setLimit(50);\n' +
           '                      }} \n' +
           '                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"\n' +
           '                    >\n' +
           '                      <option value=""></option>\n' +
           '                      <option value="New PO">New PO</option>\n' +
           '                      <option value="RFQ">RFQ</option>\n' +
           '                      <option value="Ordered">Ordered</option>\n' +
           '                      <option value="Shipped">Shipped</option>\n' +
           '                      <option value="Received">Received</option>\n' +
           '                      <option value="Archived">Archived</option>\n' +
           '                      <option value="Canceled">Canceled</option>\n' +
           '                    </select>\n' +
           '                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />\n' +
           '                  </div>\n' +
           '                </th>\n' +
           '              )}';
  }
  if (['created_date', 'expected_date'].includes(c.id)) {
    const prefix = c.id === 'created_date' ? 'created' : 'expected';
    return '              {visibleCols.' + c.id + ' && (\n' +
           '                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">\n' +
           '                  <input name="min_' + prefix + '" value={filters.min_' + prefix + '} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />\n' +
           '                  <input name="max_' + prefix + '" value={filters.max_' + prefix + '} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />\n' +
           '                </th>\n' +
           '              )}';
  }
  if (['vendor_number', 'vendor_name'].includes(c.id)) {
    return '              {visibleCols.' + c.id + ' && (\n' +
           '                <th className="p-1.5 align-top border-r border-gray-300 font-normal">\n' +
           '                  <input name="' + c.id + '" value={filters.' + c.id + '} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />\n' +
           '                </th>\n' +
           '              )}';
  }
  return '              {visibleCols.' + c.id + ' && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}';
}).join('\\n');

const TBODY_ROWS = COLUMNS_DEF.map(c => {
  const isCurrency = ['total', 'tax', 'total_including_tax', 'paid', 'unpaid', 'total_in_currency', 'tax_in_currency', 'total_including_tax_in_currency', 'paid_in_currency', 'unpaid_in_currency'].includes(c.id);
  const isDate = ['created_date', 'expected_date', 'order_date', 'due_date', 'shipped_on', 'arrival_date', 'invoice_date'].includes(c.id);
  
  let classes = "p-2 border-r border-gray-200 whitespace-nowrap";
  if (c.align === 'right') classes += " text-right";
  if (c.align === 'center') classes += " text-center";
  if (isCurrency) classes += " font-medium";

  let content = '{order.' + c.id + '}';
  if (isCurrency) {
    content = '${Number(order.' + c.id + ' || 0).toFixed(2)}';
  } else if (isDate) {
    content = '{formatShortDate(order.' + c.id + ')}';
  }
  
  return '                {visibleCols.' + c.id + ' && <td className="' + classes + '">' + content + '</td>}';
}).join('\\n');

const HEADERS_BLOCK = `
            {/* Main Header */}
            <tr>
              <th className="font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>
${THEAD_HEADERS}
              <th className="font-medium p-2 w-16 text-center border-r border-gray-300 border-b border-gray-300 relative">
                <div 
                  className="flex items-center justify-center cursor-pointer hover:bg-gray-200 p-1 rounded"
                  onClick={() => setShowColDropdown(!showColDropdown)}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </div>
                {showColDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-56 max-h-[400px] overflow-y-auto z-50 text-left font-normal"
                    onMouseLeave={() => setShowColDropdown(false)}
                  >
                    {ALL_COLUMNS.map(col => {
                      const isDisabled = col.id === 'po_number';
                      return (
                        <label key={col.id} className={\`flex items-center gap-2 px-3 py-1.5 select-none text-gray-700 \${isDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-[#eef2f9] cursor-pointer'}\`}>
                          <input 
                            type="checkbox" 
                            checked={!!visibleCols[col.id]} 
                            onChange={() => !isDisabled && toggleCol(col.id)}
                            disabled={isDisabled}
                            className={\`w-3.5 h-3.5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 \${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}\`}
                          />
                          <span className="text-[12px] whitespace-nowrap">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </th>
              <th className="font-medium p-2 w-8 text-center text-gray-400 font-bold border-b border-gray-300">+</th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-b border-gray-300">
              <th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top">
                <Settings2 className="w-4 h-4 mx-auto text-gray-500 mt-2" />
              </th>
${FILTER_ROW}
              <th className="p-1.5 align-top border-r border-gray-300 text-center bg-[#f9fafb]"></th>
              <th className="p-1.5 align-top bg-[#f9fafb]">
                <div className="flex items-center gap-2 pr-2 text-blue-600 font-medium pt-1 ml-1">
                  <button onClick={handleSearch} className="hover:underline text-[12px] bg-transparent border-none cursor-pointer">Search</button>
                  <button onClick={handleClear} className="text-gray-400 hover:underline text-[12px] bg-transparent border-none cursor-pointer">Clear</button>
                </div>
              </th>
            </tr>
            {/* Totals Row */}
            {orders.length > 0 && (
              <tr className="bg-white font-bold border-b border-gray-300">
                <td className="p-2 text-right pr-6 border-r border-gray-300">Total:</td>
                {visibleCols.total && (
                  <td className="p-2 text-right border-r border-gray-300 text-gray-800">
                    \${Number(response?.summary?.total_cost || 0).toFixed(2)}
                  </td>
                )}
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 2}></td>
              </tr>
            )}`;

const ROWS_BLOCK = `
            {isLoading && limit === 50 && orders.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="text-center py-12 text-gray-500">Loading purchase orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="px-4 py-8 text-center text-gray-500">No data available</td>
              </tr>
            ) : orders.map((order: any, i: number) => (
              <tr key={order.id || i} className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer text-gray-600">
                <td className="p-2 text-center text-gray-400 border-r border-gray-200">{i + 1}</td>
${TBODY_ROWS}
                <td className="p-2 border-r border-gray-200 text-center">
                  <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 mx-auto cursor-pointer" />
                </td>
                <td className="p-2 text-center"></td>
              </tr>
            ))`;

let code = fs.readFileSync('src/components/procurement/PurchaseOrdersTable.tsx', 'utf8');

// Replace ALL_COLUMNS array
code = code.replace(/const ALL_COLUMNS = \[[\s\S]*?\];/, ALL_COLUMNS_CODE.trim());

// Replace HEADERS
code = code.replace(/\{\/\* Main Header \*\/\}[\s\S]*?<\/thead>/, HEADERS_BLOCK + '\n          </thead>');

// Replace ROWS
code = code.replace(/<tbody>[\s\S]*?<\/tbody>/, '<tbody>\n' + ROWS_BLOCK + '\n          </tbody>');

fs.writeFileSync('src/components/procurement/PurchaseOrdersTable.tsx', code);
console.log('Successfully updated PurchaseOrdersTable.tsx with new column order');
