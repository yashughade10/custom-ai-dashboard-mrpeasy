const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'procurement', 'PurchaseOrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add a print header
const printHeader = `
      {/* Print Header */}
      <div className="hidden print:flex justify-between items-end mb-6 w-full text-black">
        <h1 className="text-2xl font-bold m-0 p-0">Purchase orders</h1>
        <div className="text-sm font-medium">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
      
      <div className="print:hidden">
        <MrpExportBar 
          createLabel="Create PO" 
          onDownloadPDF={handleDownloadPDF} 
          onDownloadCSV={handleDownloadCSV} 
        />
      </div>
`;

if (!content.includes('Print Header')) {
  content = content.replace(
    '<div className="w-full bg-white text-[12px] text-gray-800 flex flex-col flex-1 min-h-0 relative">',
    `<div className="w-full bg-white text-[12px] text-gray-800 flex flex-col flex-1 min-h-0 relative print:p-0 print:m-0 print:block">`
  );
  
  content = content.replace(
    `<MrpExportBar \n        createLabel="Create PO" \n        onDownloadPDF={handleDownloadPDF} \n        onDownloadCSV={handleDownloadCSV} \n      />`,
    printHeader
  );
}

// Remove overflow for print
if (!content.includes('print:overflow-visible')) {
  content = content.replace(
    '<div className="overflow-auto w-full flex-1 border border-gray-200 shadow-sm rounded-sm relative">',
    '<div className="overflow-auto print:overflow-visible w-full flex-1 border border-gray-200 shadow-sm rounded-sm relative print:border-none print:shadow-none">'
  );
}

// Hide filter row
if (!content.includes('print:hidden bg-white border-b border-gray-300')) {
  content = content.replace(
    '<tr className="bg-white border-b border-gray-300">',
    '<tr className="print:hidden bg-white border-b border-gray-300">'
  );
}

// Ensure the outer table is good for print
if (!content.includes('print:text-[10px]')) {
  content = content.replace(
    '<table className="w-full text-left table-auto">',
    '<table className="w-full text-left table-auto print:text-[10px]">'
  );
}

// Hide first and last + columns and settings column
content = content.replace(
  '<th className="font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>',
  '<th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>'
);

content = content.replace(
  '<th className="font-medium p-2 w-8 text-center text-gray-400 font-bold border-b border-gray-300">+</th>',
  '<th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-b border-gray-300">+</th>'
);

content = content.replace(
  '<th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">',
  '<th className="print:hidden p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">'
);

// We need to hide the + and settings in the body tr too!
const bodyPlusRegex = /<td className="p-2 border-b border-gray-200 border-r border-gray-300">[\s\S]*?<div className="w-4 h-4 rounded-sm border border-gray-300 bg-white">[\s\S]*?<\/div>[\s\S]*?<\/td>/;
if (bodyPlusRegex.test(content) && !content.includes('print:hidden p-2 border-b border-gray-200 border-r border-gray-300">')) {
  content = content.replace(bodyPlusRegex, `<td className="print:hidden p-2 border-b border-gray-200 border-r border-gray-300">\n                    <div className="w-4 h-4 rounded-sm border border-gray-300 bg-white flex items-center justify-center cursor-pointer">\n                      {/* <Plus className="w-3 h-3 text-gray-400" /> */}\n                    </div>\n                  </td>`);
}

content = content.replace(
  /<td className="p-2 border-b border-gray-200 border-r border-gray-300 bg-[#f9fafb]">[\s\S]*?<\/td>/,
  '<td className="print:hidden p-2 border-b border-gray-200 border-r border-gray-300 bg-[#f9fafb]"></td>'
);

content = content.replace(
  /<td className="p-2 border-b border-gray-200 bg-[#f9fafb]">[\s\S]*?<\/td>/,
  '<td className="print:hidden p-2 border-b border-gray-200 bg-[#f9fafb]"></td>'
);

// Settings col
content = content.replace(
  '<th className="font-medium p-2 w-16 text-center border-r border-gray-300 border-b border-gray-300 relative">',
  '<th className="print:hidden font-medium p-2 w-16 text-center border-r border-gray-300 border-b border-gray-300 relative">'
);

fs.writeFileSync(filePath, content);
console.log('Script done');
