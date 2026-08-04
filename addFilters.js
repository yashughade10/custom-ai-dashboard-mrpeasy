const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `              {visibleCols.po_emailed && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.attention && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.notes && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}
              {visibleCols.account && <th className="p-1.5 align-top border-r border-gray-300 font-normal bg-[#f9fafb]"></th>}`;

const replacementStr = `              {visibleCols.po_emailed && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  <div className="relative">
                    <select
                      name="po_emailed"
                      value={filters.po_emailed || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, po_emailed: val }));
                        setActiveFilters(prev => ({ ...prev, po_emailed: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.attention && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-32">
                  <div className="relative">
                    <select
                      name="attention"
                      value={filters.attention || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, attention: val }));
                        setActiveFilters(prev => ({ ...prev, attention: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="DAVID C">DAVID C</option>
                      <option value="DERRYN F">DERRYN F</option>
                      <option value="STEPHEN P">STEPHEN P</option>
                      <option value="JOHN Mc">JOHN Mc</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.notes && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="notes" value={filters.notes || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.account && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  <div className="relative">
                    <select
                      name="account"
                      value={filters.account || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, account: val }));
                        setActiveFilters(prev => ({ ...prev, account: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content);
  console.log('Replaced successfully');
} else {
  console.log('Target string not found');
}
