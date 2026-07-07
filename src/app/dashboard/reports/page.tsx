"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, Scissors, DollarSign, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReportsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/reports/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (error: any) {
        toast.error(error.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const modules = [
    { title: "Sales Reports", desc: "Revenue, customers, products", icon: TrendingUp, href: "/dashboard/reports/sales", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Inventory Reports", desc: "Stock levels, valuation", icon: Package, href: "/dashboard/reports/inventory", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Production Reports", desc: "Efficiency, lead times", icon: Scissors, href: "/dashboard/reports/production", color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Finance Reports", desc: "Receivables, payables", icon: DollarSign, href: "/dashboard/reports/finance", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="p-6 w-full max-w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Executive summary and deep-dive analytics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi: any, i: number) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpi.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val) => [`$${val}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Report Modules</CardTitle>
            <CardDescription>Select a module to view detailed reports</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Link key={i} href={mod.href} className="block group">
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all">
                    <div className={`p-2 rounded-lg ${mod.bg}`}>
                      <Icon className={`w-5 h-5 ${mod.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{mod.title}</div>
                      <div className="text-xs text-muted-foreground">{mod.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
