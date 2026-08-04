"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  onAddOption?: (val: string) => void;
  placeholder?: string;
  addNewLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  onAddOption,
  placeholder = "Select...",
  addNewLabel = "Add a new option",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="flex items-center justify-between w-full p-1.5 border border-blue-400 rounded bg-[#e8eff9] cursor-pointer text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900 truncate" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-0.5 bg-white border border-blue-400 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 flex items-center">
            <input 
              type="text"
              className="w-full text-sm outline-none bg-transparent"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {onAddOption && (
            <div 
              className="p-2 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onAddOption(search);
                setIsOpen(false);
                setSearch("");
              }}
            >
              {addNewLabel}
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">No results found</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div 
                key={i}
                className="p-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
