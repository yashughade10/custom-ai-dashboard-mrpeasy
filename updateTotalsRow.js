const fs = require('fs');

let code = fs.readFileSync('src/components/procurement/PurchaseOrdersTable.tsx', 'utf8');

const TOTALS_ROW_REPLACEMENT = `            {/* Totals Row */}
            {orders.length > 0 && (
              <tr className="bg-white font-bold border-b border-gray-300">
                <td className="p-2 text-right pr-6 border-r border-gray-300">Total:</td>
                {ALL_COLUMNS.map(col => {
                  if (!visibleCols[col.id]) return null;
                  
                  if (col.id === 'total') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_cost || 0).toFixed(2)}</td>;
                  if (col.id === 'tax') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_tax || 0).toFixed(2)}</td>;
                  if (col.id === 'total_including_tax') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_including_tax || 0).toFixed(2)}</td>;
                  if (col.id === 'paid') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_paid || 0).toFixed(2)}</td>;
                  if (col.id === 'unpaid') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_unpaid || 0).toFixed(2)}</td>;
                  
                  if (col.id === 'total_in_currency') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_in_currency || 0).toFixed(2)}</td>;
                  if (col.id === 'tax_in_currency') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.tax_in_currency || 0).toFixed(2)}</td>;
                  if (col.id === 'total_including_tax_in_currency') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.total_including_tax_in_currency || 0).toFixed(2)}</td>;
                  if (col.id === 'paid_in_currency') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.paid_in_currency || 0).toFixed(2)}</td>;
                  if (col.id === 'unpaid_in_currency') return <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">\\\${Number(response?.summary?.unpaid_in_currency || 0).toFixed(2)}</td>;
                  
                  return <td key={col.id} className="p-2 border-r border-gray-300"></td>;
                })}
                <td colSpan={2}></td>
              </tr>
            )}`;

code = code.replace(/\{\/\* Totals Row \*\/\}[\s\S]*?<\/tr>\n            \}/, TOTALS_ROW_REPLACEMENT);

fs.writeFileSync('src/components/procurement/PurchaseOrdersTable.tsx', code);
console.log('Updated Totals Row');
