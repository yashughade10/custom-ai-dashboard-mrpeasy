"use client";

import { useState } from "react";
import { ChevronDown, CalendarDays, Lock, Cloud, Link as LinkIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

export default function CreateManufacturingOrder({ onBack }: { onBack: () => void }) {
  const [groupOpen, setGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");
  
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("Kamal");

  // Fetch Product Groups from the database
  const { data: groupsData } = useQuery({
    queryKey: ["mrp-product-groups"],
    queryFn: mrpApi.getProductGroups,
  });
  
  // Fetch Assignees from the database
  const { data: assigneesData } = useQuery({
    queryKey: ["mrp-assignees"],
    queryFn: mrpApi.getAssignees,
  });

  // Fetch Products (Items) from the database
  const { data: itemsData } = useQuery({
    queryKey: ["mrp-items"],
    queryFn: () => mrpApi.getItems(1, 1000), // Get a large list for dropdown
  });

  const groups = groupsData?.data || [];
  const assignees = assigneesData?.data || ["Kamal"]; // fallback
  const products = itemsData?.data || [];

  return (
    <div className="flex flex-col h-full bg-white text-[12.5px] text-gray-800">
      {/* Top Action Bar */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <button 
          onClick={onBack}
          className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-sm transition-colors"
        >
          Back
        </button>
        <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors shadow-sm">
          Save
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          <div className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-3">
            
            {/* Product Group */}
            <div className="flex items-center justify-end text-gray-600">Product group</div>
            <div className="relative max-w-[320px]">
              <div 
                className="flex items-center justify-between w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 cursor-pointer"
                onClick={() => setGroupOpen(!groupOpen)}
              >
                <span className="truncate">{selectedGroup}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </div>
              
              {groupOpen && (
                <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white border border-[#90A4E4] rounded-sm shadow-lg overflow-hidden">
                  <div className="p-2 hover:bg-blue-50 cursor-pointer font-bold text-gray-900 border-b border-gray-100">
                    Add a new group
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {groups.map((g: any) => {
                      const displayStr = `${g.group_number} ${g.group_name}`;
                      return (
                        <div 
                          key={g.group_number} 
                          className="px-2 py-1.5 hover:bg-blue-50 cursor-pointer text-gray-800"
                          onClick={() => { setSelectedGroup(displayStr); setGroupOpen(false); }}
                        >
                          {displayStr}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Product */}
            <div className="flex items-center justify-end text-gray-600">Product</div>
            <div className="relative max-w-[320px]">
              <div 
                className="flex items-center justify-between w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 cursor-pointer"
                onClick={() => setProductOpen(!productOpen)}
              >
                <span className="truncate">{selectedProduct}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </div>

              {productOpen && (
                <div className="absolute z-20 top-full left-0 mt-1 w-[400px] bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto py-1">
                    {products.map((p: any) => {
                      const displayStr = `${p.part_no} ${p.part_description}`;
                      return (
                        <div 
                          key={p.part_no} 
                          className="px-2 py-1.5 hover:bg-blue-50 cursor-pointer text-gray-800 truncate"
                          onClick={() => { setSelectedProduct(displayStr); setProductOpen(false); }}
                        >
                          {displayStr}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Files */}
            <div className="flex items-center justify-end text-gray-600">Files</div>
            <div className="flex items-center gap-2 max-w-[320px]">
              {/* Drive Icon */}
              <div className="w-[26px] h-[26px] bg-[#EEF0F4] rounded-sm flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.333 6.666l-3.333-5.773H5.333l3.334 5.773h6.666z" fill="#0066DA"/>
                  <path d="M8.667 6.666L5.333 12.44 12 24h6.667L12 12.44 8.667 6.666z" fill="#00AA4A"/>
                  <path d="M22 12.44H8.667l3.333 5.773h13.333l-3.333-5.773z" fill="#FFC100"/>
                </svg>
              </div>
              {/* Dropbox Icon */}
              <div className="w-[26px] h-[26px] bg-[#EEF0F4] rounded-sm flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.06 1.846L0 6.223l7.06 4.377 7.06-4.377L7.06 1.846zm9.88 0l-7.06 4.377 7.06 4.377L24 6.223 16.94 1.846zM0 14.977l7.06 4.377 7.06-4.377-7.06-4.377L0 14.977zm16.94-4.377l-7.06 4.377 7.06 4.377L24 14.977l-7.06-4.377zM7.06 20.354l7.06-4.377 7.06 4.377-7.06 4.377-7.06-4.377z" fill="#0061FF"/>
                </svg>
              </div>
              <div className="w-[26px] h-[26px] bg-[#EEF0F4] rounded-sm flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <Cloud className="w-4 h-4 text-blue-600" />
              </div>
              <div className="w-[26px] h-[26px] bg-[#EEF0F4] rounded-sm flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-end text-gray-600">Quantity <span className="text-gray-400 ml-1">*</span></div>
            <div className="max-w-[320px]">
              <input type="text" className="w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>

            {/* Due date */}
            <div className="flex items-center justify-end text-gray-600">Due date</div>
            <div className="relative max-w-[320px]">
              <input type="text" className="w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
              <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* Start */}
            <div className="flex items-center justify-end text-gray-600">Start</div>
            <div className="relative max-w-[320px]">
              <input type="text" className="w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
              <CalendarDays className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* Finish */}
            <div className="flex items-center justify-end text-gray-600">Finish</div>
            <div className="relative max-w-[320px]">
              <input type="text" className="w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
              <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* Assigned to */}
            <div className="flex items-center justify-end text-gray-600">Assigned to <span className="text-gray-400 ml-1">*</span></div>
            <div className="relative max-w-[320px]">
              <div 
                className="flex items-center justify-between w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 cursor-pointer"
                onClick={() => setAssigneeOpen(!assigneeOpen)}
              >
                <span>{selectedAssignee}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </div>

              {assigneeOpen && (
                <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto py-1">
                    {assignees.map((a: string) => (
                      <div 
                        key={a} 
                        className="px-2 py-1.5 hover:bg-blue-50 cursor-pointer text-gray-800"
                        onClick={() => { setSelectedAssignee(a); setAssigneeOpen(false); }}
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div></div>
            <div className="flex flex-col gap-2 max-w-[320px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 rounded-sm border-gray-300 accent-blue-600" />
                <span>Do not book parts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 rounded-sm border-gray-300 accent-blue-600" />
                <span>Do not book workstations</span>
              </label>
            </div>

            {/* WJC PROGRAME NUMBER */}
            <div className="flex items-center justify-end text-gray-600 mt-2 uppercase">WJC PROGRAME NUMBER</div>
            <div className="max-w-[320px] mt-2 relative">
              <input type="text" className="w-full h-[28px] bg-[#EEF0F4] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
              {/* small grip lines icon at bottom right of input */}
              <svg className="w-2 h-2 absolute right-0.5 bottom-0.5 text-gray-400 pointer-events-none" viewBox="0 0 10 10" fill="currentColor">
                <path d="M10 0L0 10H10V0Z" fill="currentColor" opacity="0.2"/>
              </svg>
            </div>
            
          </div>
        </div>

        {/* BOM Table */}
        <div className="mt-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#EEF0F4] text-left">
                <th className="py-1.5 px-4 font-normal text-gray-800 w-[180px] text-right pr-4">Bill of materials <span className="text-gray-400">*</span></th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Bill of materials</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Approximate cost</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Earliest start date</th>
                <th className="py-1.5 px-2 font-normal text-gray-800">Earliest finish date</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty row for spacing */}
              <tr>
                <td className="py-4"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Bottom Action Bar */}
        <div className="flex items-center gap-2 px-6 py-4 mt-8">
          <button 
            onClick={onBack}
            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-sm transition-colors"
          >
            Back
          </button>
          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
