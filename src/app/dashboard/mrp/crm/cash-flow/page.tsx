"use client";

import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Calendar as CalendarIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

const mockData = [
  { week: "27/07/2026 - 02/08/2026", salesInvoices: 7451.40, incomingPayments: -2772.00, incomingInvoices: 117.57, outgoingPayments: 117.57, forecast: 4679.40 },
  { week: "03/08/2026 - 09/08/2026", salesInvoices: 782.10, incomingPayments: 0, incomingInvoices: 0, outgoingPayments: 0, forecast: 782.10 },
  { week: "10/08/2026 - 16/08/2026", salesInvoices: 1250.00, incomingPayments: 500, incomingInvoices: 200, outgoingPayments: 200, forecast: 1750.00 },
  { week: "17/08/2026 - 23/08/2026", salesInvoices: 450.00, incomingPayments: 0, incomingInvoices: 150.00, outgoingPayments: 150.00, forecast: 450.00 },
  { week: "24/08/2026 - 30/08/2026", salesInvoices: 3200.00, incomingPayments: 1000, incomingInvoices: 500, outgoingPayments: 500, forecast: 4200.00 },
  { week: "31/08/2026 - 06/09/2026", salesInvoices: 890.00, incomingPayments: 0, incomingInvoices: 50, outgoingPayments: 50, forecast: 890.00 },
  { week: "07/09/2026 - 13/09/2026", salesInvoices: 5500.00, incomingPayments: 2500, incomingInvoices: 1200, outgoingPayments: 1200, forecast: 8000.00 },
  { week: "14/09/2026 - 20/09/2026", salesInvoices: 0, incomingPayments: 0, incomingInvoices: 800, outgoingPayments: 800, forecast: 0 },
  { week: "21/09/2026 - 27/09/2026", salesInvoices: 150.00, incomingPayments: 0, incomingInvoices: 20, outgoingPayments: 20, forecast: 150.00 },
];

const formatCurrency = (val: number) => {
  if (val === undefined || val === null) return "";
  if (val === 0) return "AUD 0.00";
  return `AUD ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function CashFlowPage() {
  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
            
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <h1 className="text-xl font-bold text-slate-900 mr-2">Cash flow forecast</h1>
                
                <Select defaultValue="period">
                  <SelectTrigger className="h-8 w-[100px] text-xs bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="period">Period</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <CalendarIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                    <Input className="h-8 w-[120px] text-xs pl-8 bg-gray-50" defaultValue="27/07/2026" />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative">
                    <CalendarIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                    <Input className="h-8 w-[120px] text-xs pl-8 bg-gray-50" defaultValue="27/09/2026" />
                  </div>
                </div>

                <Button size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Recharts Chart */}
            <div className="w-full h-[300px] mb-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={(val) => val.split(' - ')[0]} 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    formatter={(value: any) => [`AUD ${Number(value).toLocaleString()}`, undefined as any]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={0} stroke="#9ca3af" />
                  <Bar dataKey="salesInvoices" name="Sales (In)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="incomingInvoices" name="Purchases (Out)" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="forecast" name="Net Forecast" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-sm overflow-x-auto flex-1">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#f0f4f8] text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Week</th>
                    <th className="px-4 py-3 font-medium">Sales invoices</th>
                    <th className="px-4 py-3 font-medium">Incoming payments</th>
                    <th className="px-4 py-3 font-medium">Incoming invoices</th>
                    <th className="px-4 py-3 font-medium">Outgoing payments</th>
                    <th className="px-4 py-3 font-medium text-right">Cash flow forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.week}</td>
                      <td className="px-4 py-3">{formatCurrency(row.salesInvoices)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.incomingPayments)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.incomingInvoices)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.outgoingPayments)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.forecast)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
