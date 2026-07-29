"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, GripVertical, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomer", customerId],
    queryFn: () => mrpApi.getCustomerById(customerId),
  });

  const customer = response?.data;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Customer not found.</div>;
  }

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-6 py-4 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Customer {customer.customer_number} {customer.name} details</h1>
              <Button variant="outline" size="sm" className="h-8 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium border-blue-600">
                <Download className="h-3 w-3 mr-1.5" />
                PDF
              </Button>
            </div>

            {/* Top Toolbar */}
            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Back</Button>
              <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Delete</Button>
              <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Reports</Button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-12 w-full mb-8">
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Number *</label>
                  <Input readOnly value={customer.customer_number} className="h-7 text-xs bg-gray-100" />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Name *</label>
                  <Input defaultValue={customer.name} className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Status</label>
                  <Select value={customer.status || "Active"}>
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Reg no.</label>
                  <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Tax/VAT number</label>
                  <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start gap-2 pt-2">
                  <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Contact information</label>
                  <div className="border-t border-gray-100 pt-2 w-full">
                    <div className="grid grid-cols-[100px_1fr_40px] gap-2 mb-1">
                      <span className="text-[11px] text-gray-500 font-semibold pl-1">Type</span>
                      <span className="text-[11px] text-gray-500 font-semibold pl-1">Value</span>
                    </div>
                    {/* Phone */}
                    <div className="grid grid-cols-[100px_1fr_40px] gap-2 items-center mb-2">
                      <Select defaultValue="Phone">
                        <SelectTrigger className="h-7 text-xs bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                          <SelectItem value="Address">Address</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input defaultValue={customer.phone} className="h-7 text-xs bg-gray-50" />
                      <div className="flex gap-1 items-center justify-end text-gray-400">
                        <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                        <GripVertical className="w-3.5 h-3.5 cursor-move" />
                      </div>
                    </div>
                    {/* E-mail */}
                    <div className="grid grid-cols-[100px_1fr_40px] gap-2 items-center mb-2">
                      <Select defaultValue="E-mail">
                        <SelectTrigger className="h-7 text-xs bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                          <SelectItem value="Address">Address</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input defaultValue={customer.email} className="h-7 text-xs bg-gray-50" />
                      <div className="flex gap-1 items-center justify-end text-gray-400">
                        <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                        <GripVertical className="w-3.5 h-3.5 cursor-move" />
                      </div>
                    </div>
                    {/* Address block */}
                    <div className="grid grid-cols-[100px_1fr_40px] gap-2 items-start mb-2">
                      <Select defaultValue="Address">
                        <SelectTrigger className="h-7 text-xs bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                          <SelectItem value="Address">Address</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-1">
                        <Input placeholder="First name" className="h-7 text-xs bg-gray-50" />
                        <Input placeholder="Last name" className="h-7 text-xs bg-gray-50" />
                        <Input placeholder="Company name" className="h-7 text-xs bg-gray-50" />
                        <Input defaultValue={customer.address} className="h-7 text-xs bg-gray-50" />
                        <Input placeholder="Second line of address" className="h-7 text-xs bg-gray-50" />
                        <Input defaultValue="GEEBUNG" className="h-7 text-xs bg-gray-50" />
                        <Input defaultValue="QLD" className="h-7 text-xs bg-gray-50" />
                        <Input defaultValue="4034" className="h-7 text-xs bg-gray-50" />
                      </div>
                      <div className="flex gap-1 items-center justify-end text-gray-400 mt-1">
                        <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                        <GripVertical className="w-3.5 h-3.5 cursor-move" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Files</label>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold text-[10px]">A</div>
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold text-[10px]">B</div>
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold text-[10px]">C</div>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">P.O.</label>
                  <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr_20px] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Contact started *</label>
                  <Input type="date" defaultValue="2025-06-12" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[140px_1fr_20px] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Next contact</label>
                  <Input type="date" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Account manager</label>
                  <Select defaultValue="none">
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Tax rate</label>
                  <div className="flex items-center gap-1">
                    <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                    <span className="text-gray-500 text-xs">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Default discount</label>
                  <div className="flex items-center gap-1">
                    <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                    <span className="text-gray-500 text-xs">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Payment period</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Input defaultValue="" className="h-7 w-20 text-xs bg-gray-50" />
                    <span>days after</span>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium"></label>
                  <Select defaultValue="invoice">
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">the invoice date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Trade credit limit</label>
                  <div className="flex items-center gap-1">
                    <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                    <span className="text-gray-500 text-xs">$</span>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Language</label>
                  <Select defaultValue="English">
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Currency</label>
                  <Select defaultValue="AUD">
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD">$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="flex gap-2 mb-8">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Back</Button>
              <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Delete</Button>
              <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Reports</Button>
            </div>

            {/* Sub-tables */}
            <div className="space-y-6">
              {/* Contacts */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Contacts</h3>
                <div className="border border-gray-200 rounded-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f1f5f9] text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Name ↑</th>
                        <th className="px-3 py-2 font-semibold">Position</th>
                        <th className="px-3 py-2 font-semibold">Phone</th>
                        <th className="px-3 py-2 font-semibold">Teams</th>
                        <th className="px-3 py-2 font-semibold">E-mail</th>
                        <th className="px-3 py-2 font-semibold text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customers/${customerId}/contacts/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr onClick={() => router.push(`/dashboard/mrp/crm/customers/${customerId}/contacts/paul-turner`)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-3 py-2 text-gray-600 uppercase">PAUL TURNER</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customers/${customerId}/contacts/paul-turner`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Notes</h3>
                <div className="border border-gray-200 rounded-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f1f5f9] text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold w-32 cursor-pointer">Created ↓</th>
                        <th className="px-3 py-2 font-semibold w-32">Modified</th>
                        <th className="px-3 py-2 font-semibold">Note</th>
                        <th className="px-3 py-2 w-10 text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customers/${customerId}/notes/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td colSpan={4} className="px-3 py-2 text-gray-400 italic">No notes found.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
