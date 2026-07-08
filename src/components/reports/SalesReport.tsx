"use client";

import { useEffect, useState } from "react";
import { ReportFilters } from "./ReportFilters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/http";

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

export function SalesReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async (filters = {}) => {
    setLoading(true);
    try {
      // In a real app, pass filters as query params
      const res = await apiFetch("/reports/sales");
      if (!res.ok) throw new Error("Failed to fetch report data");
      const json = await res.json();
      setData(json);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExport = async (type: 'csv' | 'excel') => {
    try {
      const res = await apiFetch(`/reports/export/${type}`);
      const json = await res.json();
      toast.success(`Exported as ${json.type} successfully!`);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <ReportFilters onExport={handleExport} onFilterChange={fetchReportData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue by Period</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueByPeriod} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickMargin={12} />
                <YAxis width={45} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickFormatter={(val) => val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`} tickMargin={8} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val) => [`$${val}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue by Product</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                <Pie
                  data={data.revenueByProduct}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.revenueByProduct.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  formatter={(val) => [`$${val}`, 'Revenue']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', bottom: -10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCustomer} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickFormatter={(val) => val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val) => [`$${val}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
