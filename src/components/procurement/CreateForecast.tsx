"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Loader2 } from "lucide-react";
import { formatShortDate } from "@/lib/dateUtils";

export default function CreateForecast() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [considerAvailable, setConsiderAvailable] = useState(false);
  const [lineItems, setLineItems] = useState([
    { id: 1, productGroupId: "", productId: "", quantity: "", bomId: "", moStartDate: "", mo: "" }
  ]);
  const [materials, setMaterials] = useState<any[]>([]);

  const { data: groupsRes, isLoading: loadingGroups } = useQuery({
    queryKey: ["productGroups"],
    queryFn: () => mrpApi.getProductGroups()
  });

  const { data: itemsRes, isLoading: loadingItems } = useQuery({
    queryKey: ["items"],
    queryFn: () => mrpApi.getItems(1, 200)
  });

  const { data: bomsRes, isLoading: loadingBoms } = useQuery({
    queryKey: ["boms"],
    queryFn: () => mrpApi.getBoms(1, 200)
  });

  const groups = groupsRes?.data || [];
  const items = itemsRes?.data || [];
  const boms = bomsRes?.data || [];

  const handleLineChange = (index: number, field: string, value: string) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const handleCalculate = () => {
    // Mock calculation
    const validItems = lineItems.filter(li => li.productId && li.quantity);
    if (validItems.length === 0) {
      alert("Please select a Product and enter a Quantity for at least one line item.");
      return;
    }

    const mockMaterials = validItems.map((li, i) => {
      const product = items.find((item: any) => item.id.toString() === li.productId);
      const group = groups.find((g: any) => g.id.toString() === li.productGroupId);
      const price = parseFloat(product?.cost || product?.cost_price || 10);
      const qty = parseInt(li.quantity) || 1;
      
      return {
        id: Date.now() + i,
        productGroup: group?.group_name || group?.name || "Group",
        part: product?.part_description || product?.name || "Part",
        price: price,
        quantity: qty,
        sum: price * qty,
        poQuantity: qty,
        available: 0,
        latestOrderDate: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        vendor: "Vendor A",
        po: ""
      }
    });

    setMaterials(mockMaterials);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    const validItems = lineItems.filter(li => li.productId && li.quantity);
    await mrpApi.createForecast({
      name,
      considerAvailable,
      items: validItems,
      materials
    });
    router.push("/dashboard/mrp/procurement/forecasting");
  };

  const handleBack = () => {
    router.push("/dashboard/mrp/procurement/forecasting");
  };

  const totalSum = materials.reduce((sum, mat) => sum + (mat.sum || 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white -mt-6 -mx-6 rounded-tl-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-normal text-gray-800">Create a forecast</h1>
      </div>
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex gap-2">
          <button onClick={handleBack} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded text-sm hover:bg-blue-100 font-medium border border-blue-200">
            Back
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 font-medium">
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-[1400px]">
        {/* General section */}
        <div className="grid grid-cols-[150px_1fr] gap-4 mb-8">
          <div className="text-sm font-medium text-gray-700 flex justify-end items-center">
            Name <span className="text-red-500 ml-1">*</span>
          </div>
          <div>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full max-w-md h-8 bg-[#F3F4F6] border-none rounded-sm px-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="col-start-2 flex flex-col gap-2 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="consider" 
                checked={!considerAvailable}
                onChange={() => setConsiderAvailable(false)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" 
              />
              Ignore available parts
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="consider" 
                checked={considerAvailable}
                onChange={() => setConsiderAvailable(true)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" 
              />
              Consider available parts
            </label>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#e9edf5] text-gray-600 font-medium text-[13px]">
              <tr>
                <th className="p-2 w-8 border-r border-gray-200 font-normal"></th>
                <th className="p-2 border-r border-gray-200 min-w-[200px] font-normal">Product group</th>
                <th className="p-2 border-r border-gray-200 min-w-[250px] font-normal">Product</th>
                <th className="p-2 border-r border-gray-200 min-w-[100px] font-normal">Quantity</th>
                <th className="p-2 border-r border-gray-200 min-w-[200px] font-normal">BOM</th>
                <th className="p-2 border-r border-gray-200 min-w-[140px] font-normal text-center">MO start date</th>
                <th className="p-2 min-w-[120px] font-normal text-center">MO</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-none">
                  <td className="p-1 border-r border-gray-200 text-center text-gray-400 text-xs">{index + 1}</td>
                  <td className="p-1 border-r border-gray-200">
                    <select 
                      value={item.productGroupId}
                      onChange={(e) => handleLineChange(index, "productGroupId", e.target.value)}
                      className="w-full bg-[#F3F4F6] border-none rounded-sm px-2 h-7 text-xs outline-none"
                    >
                      <option value=""></option>
                      <option value="add_new" className="text-blue-600 font-medium">Add a new group</option>
                      {groups.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.group_name || g.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <select 
                      value={item.productId}
                      onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                      className="w-full bg-[#F3F4F6] border-none rounded-sm px-2 h-7 text-xs outline-none"
                    >
                      <option value=""></option>
                      {items.map((i: any) => (
                        <option key={i.id} value={i.id}>{i.part_no || i.part_number} {i.part_description || i.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                      className="w-full bg-[#F3F4F6] border-none rounded-sm px-2 h-7 text-xs outline-none"
                    />
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <select 
                      value={item.bomId}
                      onChange={(e) => handleLineChange(index, "bomId", e.target.value)}
                      className="w-full bg-[#F3F4F6] border-none rounded-sm px-2 h-7 text-xs outline-none"
                    >
                      <option value=""></option>
                      {boms.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.number || b.code} {b.name || b.title}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input 
                      type="date"
                      value={item.moStartDate}
                      onChange={(e) => handleLineChange(index, "moStartDate", e.target.value)}
                      className="w-full bg-transparent border-none px-2 h-7 text-xs outline-none text-center"
                    />
                  </td>
                  <td className="p-1">
                    <input 
                      type="text"
                      value={item.mo}
                      onChange={(e) => handleLineChange(index, "mo", e.target.value)}
                      className="w-full bg-transparent border-none px-2 h-7 text-xs outline-none text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-center">
            <button 
              onClick={() => {
                const newItems = [...lineItems];
                newItems.push({
                  id: Date.now(),
                  productGroupId: "",
                  productId: "",
                  quantity: "",
                  bomId: "",
                  moStartDate: "",
                  mo: ""
                });
                setLineItems(newItems);
              }}
              className="text-[#1e5aa0] hover:underline text-[13px] font-medium inline-block w-full text-left ml-4"
            >
              + Add new line
            </button>
          </div>
        </div>

        {/* Calculate button */}
        <div className="mb-6 flex gap-4 items-center">
          <p className="text-sm font-medium text-gray-700 min-w-[150px] text-right">Materials</p>
          <button 
            onClick={handleCalculate}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 font-medium"
          >
            Calculate materials and timing
          </button>
        </div>

        {/* Materials Table */}
        <div className="overflow-x-auto mb-8 border-b border-gray-100 pb-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#e9edf5] text-[#333] font-medium text-xs">
                <tr>
                  <th className="p-2 border-r border-gray-300 font-normal">Product group</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Part</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Price</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Quantity</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Sum</th>
                  <th className="p-2 border-r border-gray-300 font-normal">PO quantity</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Available</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Latest order date</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Delivery date</th>
                  <th className="p-2 border-r border-gray-300 font-normal">Vendor</th>
                  <th className="p-2 font-normal">PO</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {materials.length === 0 ? (
                  <tr><td colSpan={11} className="p-4 text-center text-gray-500"></td></tr>
                ) : (
                  materials.map(mat => (
                    <tr key={mat.id} className="border-b border-gray-100">
                      <td className="p-2 border-r border-gray-200">{mat.productGroup}</td>
                      <td className="p-2 border-r border-gray-200 text-[#1e5aa0] cursor-pointer hover:underline">{mat.part}</td>
                      <td className="p-2 border-r border-gray-200">${mat.price?.toFixed(2)}</td>
                      <td className="p-2 border-r border-gray-200">{mat.quantity}</td>
                      <td className="p-2 border-r border-gray-200 font-medium">${mat.sum?.toFixed(2)}</td>
                      <td className="p-2 border-r border-gray-200">{mat.poQuantity}</td>
                      <td className="p-2 border-r border-gray-200">{mat.available}</td>
                      <td className="p-2 border-r border-gray-200">{formatShortDate(mat.latestOrderDate)}</td>
                      <td className="p-2 border-r border-gray-200">{formatShortDate(mat.deliveryDate)}</td>
                      <td className="p-2 border-r border-gray-200 text-[#1e5aa0] cursor-pointer hover:underline">{mat.vendor}</td>
                      <td className="p-2">{mat.po}</td>
                    </tr>
                  ))
                )}
                <tr className="font-medium text-[13px] border-b border-gray-200 bg-white">
                  <td className="p-2 border-r border-gray-200">Total:</td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200">${totalSum.toFixed(2)}</td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2 border-r border-gray-200"></td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2">
          <button onClick={handleBack} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded text-sm hover:bg-blue-100 font-medium border border-blue-200">
            Back
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 font-medium">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
