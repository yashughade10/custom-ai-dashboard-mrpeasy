const fs = require('fs');

let content = fs.readFileSync('./src/components/procurement/ProcurementItemsTable.tsx', 'utf-8');

// Fix visibleCols
const visibleColsReplacement = `const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    po_number: true,
    part_no: true,
    part_description: true,
    group_number: true,
    group_name: true,
    status: true,
    quantity: true,
    created_date: true,
    expected_date: true,
    vendor_number: true,
    vendor_name: true,
    free_text: true
  });`;

content = content.replace(/const \[visibleCols, setVisibleCols\] = useState<Record<string, boolean>>\(\{[\s\S]*?invoice_date: true,\s*\n\s*\/\/.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\}\);/g, visibleColsReplacement);

// If the regex above fails, let's just do a string replacement on the exact block we saw:
const visibleColsStart = `const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({`;
const visibleColsRegex = new RegExp(visibleColsStart.replace(/[.*+?^$\/{}()|[\\]\\\\]/g, '\\\\$&') + '[\\\\s\\\\S]*?\\\\});');
content = content.replace(visibleColsRegex, visibleColsReplacement);


// Fix the thead to have proper filter inputs and the search button
const newThead = `<thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
              <tr>
                <th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">
                  <div className="relative">
                    <div 
                      className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-gray-200 mt-2 text-gray-600 border border-gray-400 bg-white shadow-sm"
                      onClick={() => setShowSaveMenu(!showSaveMenu)}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </div>
                    {showSaveMenu && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-48 z-50 text-left font-normal flex flex-col p-2 gap-1">
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
                  </div>
                </th>
                {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                  <th key={col.id} className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-white print:hidden">
                <td className="p-1 border-r border-gray-300 border-b border-gray-300 text-center relative">
                  <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-gray-700">
                    <Settings2 className="h-4 w-4" />
                  </button>
                  {showSettings && (
                    <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 shadow-lg rounded-sm p-4 w-64 z-50 text-left font-normal max-h-[60vh] overflow-y-auto">
                      <h4 className="font-semibold text-gray-700 mb-2 mt-0">Visible columns</h4>
                      {ALL_COLUMNS.map(col => (
                        <div key={col.id} className="flex items-center mb-2">
                          <input 
                            type="checkbox" 
                            id={\`col-\${col.id}\`} 
                            checked={visibleCols[col.id] || false}
                            onChange={() => toggleCol(col.id)}
                            className="mr-2"
                          />
                          <label htmlFor={\`col-\${col.id}\`} className="text-sm cursor-pointer select-none">{col.label}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                {ALL_COLUMNS.map((col, index) => visibleCols[col.id] && (
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
                    {index === ALL_COLUMNS.filter(c => visibleCols[c.id]).length - 1 && (
                      <div className="absolute right-0 top-0 h-full flex items-center pr-2 bg-[#f8fafc] pl-2 z-10">
                        <button onClick={handleSearch} className="px-3 py-1 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px] transition-colors cursor-pointer border-none mr-2">Search</button>
                        <button onClick={handleClear} className="text-[#1e5aa0] hover:underline text-[12px] font-medium bg-transparent border-none cursor-pointer">Clear</button>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </thead>`;

content = content.replace(/<thead[\s\S]*?<\/thead>/, newThead);

fs.writeFileSync('./src/components/procurement/ProcurementItemsTable.tsx', content);
console.log("Done");
