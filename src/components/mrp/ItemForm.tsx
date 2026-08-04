"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface ItemFormProps {
  initialData?: any;
  isEdit?: boolean;
}

function SearchableSelect({ options, value, onChange, placeholder, disabled }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedOption = options.find((o: any) => o.value === value);
  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : (value || ""));

  const filteredOptions = options.filter((o: any) => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          onChange(e.target.value); // Let them type raw text as well
        }}
        onFocus={() => {
          setSearch("");
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="bg-[#eef2f5] border-transparent w-full flex h-9 rounded-md px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No results found.</div>
          ) : (
            filteredOptions.map((option: any) => (
              <div
                key={option.value}
                className="p-2 text-sm hover:bg-[#f0f7ff] cursor-pointer text-gray-800"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ItemForm({ initialData, isEdit }: ItemFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, setValue, reset, watch } = useForm({
    defaultValues: initialData || {
      part_no: "",
      part_description: "",
      group_number: "",
      group_name: "",
      uom: "pcs",
      is_procured_item: false,
      not_for_sale: false,
      standalone_mo: false,
      selling_price: 0,
      notes: "",
      bwe_added_value_cost: 0,
      buy_price: 0,
      supplier_1: "",
      s1_buy_price: 0,
      vender_part_number: "",
      supplier_2: "",
      s2_buy_price: 0,
      vender_2_part_number: "",
      sell_price: 0,
      default_storage_location: "",
      reorder_point: 0,
      min_qty_manufacturing: 1,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    async function loadData() {
      try {
        if (!isEdit) {
          const itemsRes = await mrpApi.getItems(1, 1000);
          if (itemsRes.success) setItems(itemsRes.data);
        }
        const groupsRes = await mrpApi.getProductGroups();
        if (groupsRes.success) setGroups(groupsRes.data);

        const uomsRes = await mrpApi.getUoms();
        if (uomsRes.success) setUoms(uomsRes.data);

        const locsRes = await mrpApi.getStorageLocations();
        if (locsRes.success) setLocations(locsRes.data);
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    }
    loadData();
  }, [isEdit]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await mrpApi.updateItem(initialData.id, data);
      } else {
        await mrpApi.createItem(data);
      }
      router.push("/dashboard/mrp/inventory");
    } catch (err) {
      console.error("Failed to save item", err);
      alert("Failed to save item. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyItem = (itemId: string) => {
    const item = items.find(i => i.id.toString() === itemId);
    if (item) {
      // Copy all fields except part_no
      const { id, part_no, created_at, updated_at, ...rest } = item;
      Object.keys(rest).forEach(key => {
        setValue(key as any, rest[key]);
      });
    }
  };

  const handleGroupSelect = (groupNum: string) => {
    const group = groups.find(g => g.group_number === groupNum);
    if (group) {
      setValue("group_number", group.group_number);
      setValue("group_name", group.group_name);
    } else {
      setValue("group_number", groupNum);
    }
  };

  // MRPeasy style field row
  const FieldRow = ({ label, children, required = false }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 gap-2 sm:gap-4 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/3 text-right text-sm text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <div className="sm:w-2/3">
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded shadow-sm border border-gray-200">
      {/* Top Action Bar */}
      <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-b border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/dashboard/mrp/inventory")}
          className="text-[#428bca] border-transparent hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#2a5fc1] hover:bg-[#1d448f] text-white"
        >
          Save
        </Button>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-12">
        {/* Left Column */}
        <div className="flex-1 max-w-2xl">
          <FieldRow label="Part No." required>
            <Input {...register("part_no")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          {!isEdit && (
            <FieldRow label="Copy item">
              <SearchableSelect
                placeholder="Type to search and select an item..."
                options={items.map(i => ({ value: i.id.toString(), label: `${i.part_no} - ${i.part_description}` }))}
                onChange={handleCopyItem}
              />
            </FieldRow>
          )}

          <FieldRow label="Part description" required>
            <Input {...register("part_description")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Product group">
            <SearchableSelect
              placeholder="Type to search product group..."
              options={groups.map(g => ({ value: g.group_number, label: `${g.group_number} ${g.group_name}` }))}
              value={watch("group_number")}
              onChange={handleGroupSelect}
            />
          </FieldRow>

          <FieldRow label="Unit of measurement">
            <SearchableSelect
              placeholder="Type to search UOM..."
              options={uoms.map(u => ({ value: u.name, label: u.name }))}
              value={watch("uom")}
              onChange={(val: string) => setValue("uom", val)}
            />
          </FieldRow>

          <FieldRow label="This is a procured item">
            <Controller
              name="is_procured_item"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
          </FieldRow>

          <FieldRow label="Not for sale">
            <Controller
              name="not_for_sale"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
          </FieldRow>

          <FieldRow label="Selling price">
            <div className="relative">
              <Input type="number" step="0.0001" {...register("selling_price")} className="bg-[#eef2f5] border-transparent pr-8" />
              <span className="absolute right-3 top-2 text-sm font-bold">$</span>
            </div>
          </FieldRow>

          <FieldRow label="Notes">
            <Textarea {...register("notes")} className="bg-[#eef2f5] border-transparent min-h-[80px]" />
          </FieldRow>

          <FieldRow label="BWE added value cost">
            <Input type="number" step="0.0001" {...register("bwe_added_value_cost")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Buy Price">
            <Input type="number" step="0.0001" {...register("buy_price")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Supplier 1">
            <Input {...register("supplier_1")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="S1 Buy price">
            <Input type="number" step="0.0001" {...register("s1_buy_price")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Vender Part Number">
            <Input {...register("vender_part_number")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Supplier 2">
            <Input {...register("supplier_2")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="S2 Buy Price">
            <Input type="number" step="0.0001" {...register("s2_buy_price")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Vender 2 Part Number">
            <Input {...register("vender_2_part_number")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Sell Price">
            <Input type="number" step="0.0001" {...register("sell_price")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>
        </div>

        {/* Right Column */}
        <div className="flex-1 max-w-lg">
          <FieldRow label="Default storage location">
            <SearchableSelect
              placeholder="Type to search storage location..."
              options={locations.map(l => ({ value: l.name, label: l.name }))}
              value={watch("default_storage_location")}
              onChange={(val: string) => setValue("default_storage_location", val)}
            />
          </FieldRow>

          <FieldRow label="Reorder point">
            <Input type="number" step="0.0001" {...register("reorder_point")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Min. quantity for manufacturing">
            <Input type="number" step="0.0001" {...register("min_qty_manufacturing")} className="bg-[#eef2f5] border-transparent" />
          </FieldRow>

          <FieldRow label="Standalone MO">
            <Controller
              name="standalone_mo"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
          </FieldRow>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-[#f2f2f2] px-4 py-3 flex gap-2 border-t border-gray-200 mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/dashboard/mrp/inventory")}
          className="text-[#428bca] border-transparent hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#2a5fc1] hover:bg-[#1d448f] text-white"
        >
          Save
        </Button>
      </div>
    </form>
  );
}
