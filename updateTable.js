const fs = require('fs');

const ALL_COLUMNS = `
const ALL_COLUMNS = [
  { id: 'po_number', label: 'Number' },
  { id: 'total', label: 'Total' },
  { id: 'tax', label: 'Tax' },
  { id: 'total_including_tax', label: 'Total including tax' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'currency', label: 'Currency' },
  { id: 'status', label: 'Status' },
  { id: 'invoice_status', label: 'Invoice status' },
  { id: 'payment_status', label: 'Payment status' },
  { id: 'created_by', label: 'Created by' },
  { id: 'created_date', label: 'Created' },
  { id: 'expected_date', label: 'Expected date' },
  { id: 'order_date', label: 'Order date' },
  { id: 'due_date', label: 'Due date' },
  { id: 'shipped_on', label: 'Shipped on' },
  { id: 'delay', label: 'Delay' },
  { id: 'vendor_number', label: 'Vendor number' },
  { id: 'vendor_name', label: 'Vendor name' },
  { id: 'total_quantity', label: 'Total quantity' },
  { id: 'attention', label: 'Attention' },
];

export default function PurchaseOrdersTable() {`;

const STATES = `
  const [activeFilters, setActiveFilters] = useState({});
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    po_number: true,
    total: true,
    status: true,
    created_date: true,
    expected_date: true,
    vendor_number: true,
    vendor_name: true,
  });
  const [showColDropdown, setShowColDropdown] = useState(false);

  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };`;

const HEADERS = `
            {/* Main Header */}
            <tr>
              <th className="font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>
              {visibleCols.total && <th className="font-medium p-2 text-right border-r border-gray-300 border-b border-gray-300">Total</th>}
              {visibleCols.tax && <th className="font-medium p-2 text-right border-r border-gray-300 border-b border-gray-300">Tax</th>}
              {visibleCols.total_including_tax && <th className="font-medium p-2 text-right border-r border-gray-300 border-b border-gray-300">Total including tax</th>}
              {visibleCols.paid && <th className="font-medium p-2 text-right border-r border-gray-300 border-b border-gray-300">Paid</th>}
              {visibleCols.unpaid && <th className="font-medium p-2 text-right border-r border-gray-300 border-b border-gray-300">Unpaid</th>}
              {visibleCols.currency && <th className="font-medium p-2 border-r border-gray-300 border-b border-gray-300">Currency</th>}
              
              {visibleCols.po_number && (
                <th className="font-medium p-2 leading-tight flex items-center gap-1 border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                  Number <span className="text-gray-400">↓</span>
                </th>
              )}
              {visibleCols.status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Status</th>}
              {visibleCols.invoice_status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Invoice status</th>}
              {visibleCols.payment_status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Payment status</th>}
              {visibleCols.created_by && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Created by</th>}
              {visibleCols.created_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 w-[130px]">Created</th>}
              {visibleCols.expected_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 w-[130px]">Expected date</th>}
              {visibleCols.order_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Order date</th>}
              {visibleCols.due_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Due date</th>}
              {visibleCols.shipped_on && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Shipped on</th>}
              {visibleCols.delay && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 text-center">Delay</th>}
              {visibleCols.vendor_number && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Vendor number</th>}
              {visibleCols.vendor_name && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Vendor name</th>}
              {visibleCols.total_quantity && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 text-center">Total quantity</th>}
              {visibleCols.attention && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300">Attention</th>}
              
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
                    {ALL_COLUMNS.map(col => (
                      <label key={col.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#eef2f9] cursor-pointer text-gray-700 select-none">
                        <input 
                          type="checkbox" 
                          checked={!!visibleCols[col.id]} 
                          onChange={() => toggleCol(col.id)}
                          className="w-3.5 h-3.5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[12px] whitespace-nowrap">{col.label}</span>
                      </label>
                    ))}
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
              {visibleCols.total && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total" value={filters.min_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total" value={filters.max_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.tax && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.total_including_tax && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.paid && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.unpaid && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.currency && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}

              {visibleCols.po_number && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="po_number" value={filters.po_number} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.status && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-28">
                  <div className="relative">
                    <select 
                      name="status" 
                      value={filters.status} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, status: val }));
                        setActiveFilters(prev => ({ ...prev, status: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="New PO">New PO</option>
                      <option value="RFQ">RFQ</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Received">Received</option>
                      <option value="Archived">Archived</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.invoice_status && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.payment_status && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.created_by && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.created_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_created" value={filters.min_created} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_created" value={filters.max_created} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.expected_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_expected" value={filters.min_expected} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_expected" value={filters.max_expected} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.order_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.due_date && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.shipped_on && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.delay && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.vendor_number && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="vendor_number" value={filters.vendor_number} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.vendor_name && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="vendor_name" value={filters.vendor_name} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.total_quantity && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.attention && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
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

const ROWS = `
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
                {visibleCols.total && <td className="p-2 border-r border-gray-200 text-right font-medium">\${Number(order.total || 0).toFixed(2)}</td>}
                {visibleCols.tax && <td className="p-2 border-r border-gray-200 text-right font-medium">\${Number(order.tax || 0).toFixed(2)}</td>}
                {visibleCols.total_including_tax && <td className="p-2 border-r border-gray-200 text-right font-medium">\${Number(order.total_including_tax || 0).toFixed(2)}</td>}
                {visibleCols.paid && <td className="p-2 border-r border-gray-200 text-right font-medium">\${Number(order.paid || 0).toFixed(2)}</td>}
                {visibleCols.unpaid && <td className="p-2 border-r border-gray-200 text-right font-medium">\${Number(order.unpaid || 0).toFixed(2)}</td>}
                {visibleCols.currency && <td className="p-2 border-r border-gray-200 text-center">{order.currency}</td>}
                
                {visibleCols.po_number && <td className="p-2 border-r border-gray-200">{order.po_number}</td>}
                {visibleCols.status && <td className="p-2 border-r border-gray-200">{order.status}</td>}
                {visibleCols.invoice_status && <td className="p-2 border-r border-gray-200">{order.invoice_status}</td>}
                {visibleCols.payment_status && <td className="p-2 border-r border-gray-200">{order.payment_status}</td>}
                {visibleCols.created_by && <td className="p-2 border-r border-gray-200">{order.created_by}</td>}
                {visibleCols.created_date && <td className="p-2 border-r border-gray-200">{formatShortDate(order.created_date)}</td>}
                {visibleCols.expected_date && <td className="p-2 border-r border-gray-200">{formatShortDate(order.expected_date)}</td>}
                {visibleCols.order_date && <td className="p-2 border-r border-gray-200">{formatShortDate(order.order_date)}</td>}
                {visibleCols.due_date && <td className="p-2 border-r border-gray-200">{formatShortDate(order.due_date)}</td>}
                {visibleCols.shipped_on && <td className="p-2 border-r border-gray-200">{formatShortDate(order.shipped_on)}</td>}
                {visibleCols.delay && <td className="p-2 border-r border-gray-200 text-center">{order.delay}</td>}
                {visibleCols.vendor_number && <td className="p-2 border-r border-gray-200">{order.vendor_number}</td>}
                {visibleCols.vendor_name && <td className="p-2 border-r border-gray-200">{order.vendor_name}</td>}
                {visibleCols.total_quantity && <td className="p-2 border-r border-gray-200 text-center">{order.total_quantity}</td>}
                {visibleCols.attention && <td className="p-2 border-r border-gray-200">{order.attention}</td>}
                
                <td className="p-2 border-r border-gray-200 text-center">
                  <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 mx-auto cursor-pointer" />
                </td>
                <td className="p-2 text-center"></td>
              </tr>
            ))}`;

let code = fs.readFileSync('src/components/procurement/PurchaseOrdersTable.tsx', 'utf8');

code = code.replace('export default function PurchaseOrdersTable() {', ALL_COLUMNS);
code = code.replace('const [activeFilters, setActiveFilters] = useState({});', STATES);

// Replace everything from Main Header tr to the end of thead
code = code.replace(/\{\/\* Main Header \*\/\}[\s\S]*?<\/thead>/, HEADERS + '\n          </thead>');

// Replace everything inside tbody
code = code.replace(/<tbody>[\s\S]*?<\/tbody>/, '<tbody>\n' + ROWS + '\n          </tbody>');

fs.writeFileSync('src/components/procurement/PurchaseOrdersTable.tsx', code);
console.log('Successfully updated PurchaseOrdersTable.tsx');
