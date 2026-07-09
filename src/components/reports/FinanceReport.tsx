"use client";

import { apiFetch } from "@/lib/api/http";
import { useEffect, useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FinanceReport() {
  const [receivables, setReceivables] = useState<any>(null);
  const [payables, setPayables] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async (filters = {}) => {
    setLoading(true);
    try {
      const [resRec, resPay] = await Promise.all([
        apiFetch("http://localhost:4000/api/reports/receivables"),
        apiFetch("http://localhost:4000/api/reports/payables")
      ]);
      
      if (!resRec.ok || !resPay.ok) throw new Error("Failed to fetch finance data");
      
      const jsonRec = await resRec.json();
      const jsonPay = await resPay.json();
      
      setReceivables(jsonRec);
      setPayables(jsonPay);
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
      // Could pass a specific report type to export
      const res = await apiFetch(`http://localhost:4000/api/reports/export/${type}`);
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

  if (!receivables || !payables) return null;

  return (
    <div className="space-y-6">
      <ReportFilters onExport={handleExport} onFilterChange={fetchReportData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Aging Receivables (Money owed to us)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receivables.agingReceivables} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888888' }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val) => [`$${val}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Aging Payables (Money we owe)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payables.agingPayables} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888888' }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val) => [`$${val}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receivables.topDebtors.map((debtor: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="font-medium text-sm">{debtor.name}</div>
                  <div className="text-sm font-semibold">${debtor.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Creditors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payables.topCreditors.map((creditor: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="font-medium text-sm">{creditor.name}</div>
                  <div className="text-sm font-semibold">${creditor.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
