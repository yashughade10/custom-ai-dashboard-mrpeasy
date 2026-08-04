import React, { useState } from "react";

export function VendorTableSelect({ vendors, value, onChange, disabled }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedVendor = vendors.find((v: any) => v.vendorPartNo === value);
  const displayValue = selectedVendor ? selectedVendor.vendorPartNo || selectedVendor.vendor : (value || "");

  return (
    <div className="relative w-full">
      <div
        className={`bg-[#eef2f5] border-transparent w-full flex items-center justify-between h-9 rounded-md px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayValue || "Select..."}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-1 bg-white border border-blue-500 rounded-md shadow-lg overflow-auto whitespace-nowrap min-w-[500px]" style={{ left: 0 }}>
            <table className="w-full text-sm text-left">
              <thead className="bg-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold border-b">Vendor</th>
                  <th className="px-3 py-2 font-semibold border-b">Priority</th>
                  <th className="px-3 py-2 font-semibold border-b">Vendor part no.</th>
                  <th className="px-3 py-2 font-semibold border-b">Vendor's UoM</th>
                  <th className="px-3 py-2 font-semibold border-b">Lead time</th>
                  <th className="px-3 py-2 font-semibold border-b text-right">Price</th>
                  <th className="px-3 py-2 font-semibold border-b text-right">Min. quantity</th>
                </tr>
              </thead>
              <tbody>
                {(!vendors || vendors.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-gray-500">No vendors found.</td>
                  </tr>
                ) : (
                  vendors.map((v: any, idx: number) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-[#f0f7ff] cursor-pointer border-b last:border-0"
                      onClick={() => {
                        onChange(v);
                        setIsOpen(false);
                      }}
                    >
                      <td className="px-3 py-2">{v.vendor}</td>
                      <td className="px-3 py-2">{v.priority}</td>
                      <td className="px-3 py-2">{v.vendorPartNo}</td>
                      <td className="px-3 py-2">{v.uom}</td>
                      <td className="px-3 py-2">{v.leadTime}</td>
                      <td className="px-3 py-2 text-right">{v.price} $</td>
                      <td className="px-3 py-2 text-right">{v.minQty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
