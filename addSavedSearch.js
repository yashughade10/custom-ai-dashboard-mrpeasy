const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
if (!content.includes('useEffect')) {
  content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";');
}
if (!content.includes(', Save, X } from "lucide-react";')) {
  content = content.replace(
    'import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2 } from "lucide-react";',
    'import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2, Save, X } from "lucide-react";'
  );
}

// 2. Define emptyFilters outside so it can be reused
const emptyFilters = `
const emptyFilters = {
  min_total: "", max_total: "", po_number: "", status: "", 
  min_created: "", max_created: "", min_expected: "", max_expected: "", 
  vendor_number: "", vendor_name: "",
  min_tax: "", max_tax: "", min_total_including_tax: "", max_total_including_tax: "",
  min_paid: "", max_paid: "", min_unpaid: "", max_unpaid: "",
  currency: "",
  min_total_in_currency: "", max_total_in_currency: "",
  min_tax_in_currency: "", max_tax_in_currency: "",
  min_total_including_tax_in_currency: "", max_total_including_tax_in_currency: "",
  min_paid_in_currency: "", max_paid_in_currency: "",
  min_unpaid_in_currency: "", max_unpaid_in_currency: "",
  invoice_status: "", payment_status: "", created_by: "",
  min_arrival_date: "", max_arrival_date: "", order_id: "", min_order_date: "", max_order_date: "",
  invoice_id: "", min_invoice_date: "", max_invoice_date: "", min_due_date: "", max_due_date: "",
  min_shipped_on: "", max_shipped_on: "", min_delay: "", max_delay: "", po_free_text: "",
  min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",
  po_emailed: "", attention: "", notes: "", account: "",
};
`;

if (!content.includes('const emptyFilters = {')) {
  content = content.replace(
    'export default function PurchaseOrdersTable() {',
    emptyFilters + '\nexport default function PurchaseOrdersTable() {'
  );
  
  // Remove inner emptyFilters
  const innerEmptyFiltersRegex = /const emptyFilters = \{[\s\S]*?\};\n\s*setFilters\(emptyFilters\);/;
  content = content.replace(innerEmptyFiltersRegex, 'setFilters(emptyFilters);');
}

// 3. Add states and logic
const savedSearchLogic = `
  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_saved_searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveCurrentSearch = () => {
    if (!newSearchName.trim()) return;
    const newSearches = [...savedSearches, { name: newSearchName, filters: filters }];
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_saved_searches', JSON.stringify(newSearches));
    setNewSearchName("");
    setShowSaveModal(false);
    setShowSaveMenu(false);
  };

  const loadSavedSearch = (searchFilters: Record<string, string>) => {
    const newFilters = {...emptyFilters, ...searchFilters};
    setFilters(newFilters as any);
    setActiveFilters(searchFilters);
    setLimit(50);
    setShowSaveMenu(false);
  };

  const deleteSavedSearch = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSearches = savedSearches.filter(s => s.name !== name);
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_saved_searches', JSON.stringify(newSearches));
  };
`;

if (!content.includes('savedSearches')) {
  content = content.replace(
    'const [showColDropdown, setShowColDropdown] = useState(false);',
    'const [showColDropdown, setShowColDropdown] = useState(false);\n' + savedSearchLogic
  );
}

// 4. Update the UI
const uiOld = `<th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top">
                <Settings2 className="w-4 h-4 mx-auto text-gray-500 mt-2" />
              </th>`;
const uiNew = `<th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">
                <div 
                  className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-gray-200 mt-2 text-gray-600 border border-gray-400 bg-white shadow-sm"
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                >
                  <Save className="w-3.5 h-3.5" />
                </div>
                {showSaveMenu && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-48 z-50 text-left font-normal flex flex-col p-2 gap-1">
                    <button 
                      onClick={() => { setShowSaveModal(true); setShowSaveMenu(false); }}
                      className="w-full text-center bg-[#1d5ab0] text-white py-1.5 rounded-sm hover:bg-[#15468d] text-[12px] font-medium border-none cursor-pointer"
                    >
                      Save this search
                    </button>
                    {savedSearches.length > 0 && <div className="border-b border-gray-100 my-1"></div>}
                    {savedSearches.map(s => (
                      <div 
                        key={s.name} 
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded-sm group text-[11px] text-blue-600"
                        onClick={() => loadSavedSearch(s.filters)}
                      >
                        <span className="truncate flex-1" title={s.name}>{s.name}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <input type="checkbox" className="mr-2 w-3 h-3 cursor-pointer" readOnly />
                          <button onClick={(e) => deleteSavedSearch(s.name, e)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Modal for saving search */}
                {showSaveModal && (
                  <>
                    <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setShowSaveModal(false)}></div>
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-xl border border-gray-200 z-[70] w-[300px] flex flex-col p-4 text-left">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[14px] font-medium text-gray-800 m-0 p-0 leading-none">Save this search</h3>
                        <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600 p-0 bg-transparent border-none cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={newSearchName}
                        onChange={e => setNewSearchName(e.target.value)}
                        placeholder="Description"
                        className="w-full bg-[#f0f4fc] border border-blue-400 focus:border-blue-500 rounded-sm px-2 py-1.5 mb-4 outline-none text-[12px]"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveCurrentSearch(); }}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowSaveModal(false)} className="px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded-sm font-medium text-[12px] border-none cursor-pointer">Cancel</button>
                        <button onClick={saveCurrentSearch} className="px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded-sm font-medium text-[12px] border-none cursor-pointer">Save</button>
                      </div>
                    </div>
                  </>
                )}
              </th>`;

if (content.includes(uiOld)) {
  content = content.replace(uiOld, uiNew);
  console.log("Replaced UI");
} else {
  console.log("Could not find uiOld");
}

fs.writeFileSync(filePath, content);
console.log('Script done');
