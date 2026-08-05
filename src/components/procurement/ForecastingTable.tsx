"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Save, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { formatShortDate } from "@/lib/dateUtils";
import Link from "next/link";

export default function ForecastingTable() {
  const [filters, setFilters] = useState({
    number: "",
    name: "",
    min_created: "",
    max_created: ""
  });

  const [activeFilters, setActiveFilters] = useState({});

  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_forecasts_saved_searches');
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
    localStorage.setItem('mrp_forecasts_saved_searches', JSON.stringify(newSearches));
    setNewSearchName("");
    setShowSaveModal(false);
    setShowSaveMenu(false);
  };

  const loadSavedSearch = (searchFilters: Record<string, string>) => {
    const emptyFilters = {
      number: "",
      name: "",
      min_created: "",
      max_created: ""
    };
    const newFilters = {...emptyFilters, ...searchFilters};
    setFilters(newFilters as any);
    setActiveFilters(searchFilters);
    setShowSaveMenu(false);
  };

  const deleteSavedSearch = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved search?")) return;
    const newSearches = savedSearches.filter(s => s.name !== name);
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_forecasts_saved_searches', JSON.stringify(newSearches));
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpForecasts", activeFilters],
    queryFn: () => mrpApi.getForecasts(activeFilters)
  });

  const forecasts = response?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = () => {
    setActiveFilters({ ...filters });
  };

  const handleClear = () => {
    const empty = {
      number: "",
      name: "",
      min_created: "",
      max_created: ""
    };
    setFilters(empty);
    setActiveFilters(empty);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full pt-2 px-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-normal text-gray-800">Forecasting</h1>
        <Link href="/dashboard/mrp/procurement/forecasting/create">
          <button className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 font-medium shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            Create
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#e9edf5] text-[#333] font-medium sticky top-0 z-10">
            <tr>
              <th className="p-2 border-r border-gray-300 w-8 text-center font-normal">+</th>
              <th className="p-2 border-r border-gray-300 w-[40%]">
                <div className="flex items-center justify-between">
                  <span>Number</span>
                  <span className="text-[10px]">↓</span>
                </div>
              </th>
              <th className="p-2 border-r border-gray-300 w-[45%]">Name</th>
              <th className="p-2 border-r border-gray-300 min-w-[120px]">Created</th>
              <th className="p-2 w-10 text-center font-normal cursor-pointer">+</th>
            </tr>
            <tr className="bg-white border-b border-gray-200 shadow-sm">
              <th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">
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
                        className="w-full h-8 px-2 border border-gray-300 rounded-sm text-[12px] mb-4 outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setShowSaveModal(false)}
                          className="px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 rounded-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveCurrentSearch}
                          className="px-3 py-1.5 text-[12px] bg-blue-600 text-white hover:bg-blue-700 rounded-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </th>
              <th className="p-1.5 border-r border-gray-300 font-normal">
                <input 
                  type="text" 
                  name="number"
                  value={filters.number}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </th>
              <th className="p-1.5 border-r border-gray-300 font-normal">
                <input 
                  type="text" 
                  name="name"
                  value={filters.name}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </th>
              <th className="p-1.5 border-r border-gray-300 font-normal align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center bg-[#F3F4F6] rounded-sm h-[18px]">
                    <span className="text-[10px] text-gray-500 w-6 text-center leading-none">min</span>
                    <input 
                      type="date" 
                      name="min_created"
                      value={filters.min_created}
                      onChange={handleChange}
                      className="w-full h-full bg-transparent border-none px-1 outline-none text-[10px] focus:ring-0 [&::-webkit-calendar-picker-indicator]:w-3 [&::-webkit-calendar-picker-indicator]:h-3 [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0" 
                    />
                  </div>
                  <div className="flex items-center bg-[#F3F4F6] rounded-sm h-[18px]">
                    <span className="text-[10px] text-gray-500 w-6 text-center leading-none">max</span>
                    <input 
                      type="date" 
                      name="max_created"
                      value={filters.max_created}
                      onChange={handleChange}
                      className="w-full h-full bg-transparent border-none px-1 outline-none text-[10px] focus:ring-0 [&::-webkit-calendar-picker-indicator]:w-3 [&::-webkit-calendar-picker-indicator]:h-3 [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0" 
                    />
                  </div>
                </div>
              </th>
              <th className="p-1 text-center align-top font-normal">
                <div className="flex flex-col gap-1">
                  <button onClick={handleSearch} className="text-[#1e5aa0] hover:underline text-[11px] font-medium leading-tight">Search</button>
                  <button onClick={handleClear} className="text-[#1e5aa0] hover:underline text-[11px] font-medium leading-tight">Clear</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                </td>
              </tr>
            ) : forecasts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">No data available</td>
              </tr>
            ) : (
              forecasts.map((item: any, i: number) => (
                <tr key={item.id || i} className="bg-white border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="p-2 border-r border-gray-200 text-center text-gray-400">{i + 1}</td>
                  <td className="p-2 border-r border-gray-200 text-[#1e5aa0] font-medium">{item.forecast_number}</td>
                  <td className="p-2 border-r border-gray-200">{item.name}</td>
                  <td className="p-2 border-r border-gray-200 text-gray-600">{formatShortDate(item.created_date)}</td>
                  <td className="p-2 border-l border-gray-200 text-center"></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
