const fs = require('fs');

let code = fs.readFileSync('src/components/procurement/PurchaseOrdersTable.tsx', 'utf8');

// 1. Update filters state initialization
const stateRegex = /(const \[filters, setFilters\] = useState\(\{[\s\S]*?)(  \}\);)/;
const newFields = `    min_arrival_date: "", max_arrival_date: "",
    order_id: "",
    min_order_date: "", max_order_date: "",
    invoice_id: "",
    min_invoice_date: "", max_invoice_date: "",
    min_due_date: "", max_due_date: "",
    min_shipped_on: "", max_shipped_on: "",
    min_delay: "", max_delay: "",
    po_free_text: "",
    min_total_quantity: "", max_total_quantity: "",
    bwe_job_id: "",\n`;
code = code.replace(stateRegex, `$1${newFields}$2`);

// 2. Update emptyFilters
const emptyFiltersRegex = /(const emptyFilters = \{[\s\S]*?)(    \};)/;
const newEmptyFields = `      min_arrival_date: "", max_arrival_date: "", order_id: "", min_order_date: "", max_order_date: "",
      invoice_id: "", min_invoice_date: "", max_invoice_date: "", min_due_date: "", max_due_date: "",
      min_shipped_on: "", max_shipped_on: "", min_delay: "", max_delay: "", po_free_text: "",
      min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",\n`;
code = code.replace(emptyFiltersRegex, `$1${newEmptyFields}$2`);

// 3. Update the Filter Row
const filterRowRegex = /(\{visibleCols\.arrival_date && <th.*?>.*?<\/th>\})[\s\S]*?(\{visibleCols\.bwe_job_id && <th.*?>.*?<\/th>\})/;

const newFilterRowInputs = `              {visibleCols.arrival_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_arrival_date" value={filters.min_arrival_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_arrival_date" value={filters.max_arrival_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.order_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="order_id" value={filters.order_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.order_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_order_date" value={filters.min_order_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_order_date" value={filters.max_order_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.invoice_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="invoice_id" value={filters.invoice_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.invoice_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_invoice_date" value={filters.min_invoice_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_invoice_date" value={filters.max_invoice_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.due_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_due_date" value={filters.min_due_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_due_date" value={filters.max_due_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.shipped_on && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_shipped_on" value={filters.min_shipped_on} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_shipped_on" value={filters.max_shipped_on} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.delay && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_delay" value={filters.min_delay} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_delay" value={filters.max_delay} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.po_free_text && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="po_free_text" value={filters.po_free_text} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.total_quantity && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total_quantity" value={filters.min_total_quantity} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total_quantity" value={filters.max_total_quantity} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.bwe_job_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="bwe_job_id" value={filters.bwe_job_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}`;

code = code.replace(filterRowRegex, newFilterRowInputs);

fs.writeFileSync('src/components/procurement/PurchaseOrdersTable.tsx', code);
console.log('Updated PurchaseOrdersTable.tsx');
