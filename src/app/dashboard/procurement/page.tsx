"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, ShoppingCart, Users, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchSuppliers, fetchPurchaseOrders } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RouteGuard } from "@/components/auth/RouteGuard";

function ProcurementDashboard() {
  const { data: suppliersData } = useQuery({ queryKey: ["procurement-suppliers"], queryFn: fetchSuppliers });
  const { data: ordersData } = useQuery({ queryKey: ["procurement-orders"], queryFn: fetchPurchaseOrders });

  const suppliersCount = suppliersData?.length || 0;
  const orders = ordersData || [];
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: any) => o.status === 'draft' || o.status === 'sent' || o.status === 'partial_received').length;
  
  const totalSpend = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

  // Mock data for chart if real data is scarce
  const chartData = [
    { name: 'Jan', spend: 4000 },
    { name: 'Feb', spend: 3000 },
    { name: 'Mar', spend: 2000 },
    { name: 'Apr', spend: 2780 },
    { name: 'May', spend: 1890 },
    { name: 'Jun', spend: totalSpend > 0 ? totalSpend : 2390 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground mt-1">
            Manage suppliers, purchase orders, and receiving.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/procurement/suppliers">
            <Button variant="outline">Manage Suppliers</Button>
          </Link>
          <Link href="/dashboard/procurement/orders">
            <Button>View Purchase Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active vendors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time purchase orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              POs awaiting receipt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime PO value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Spend Overview</CardTitle>
            <CardDescription>Monthly procurement expenditure</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: any) => [`$${value}`, 'Spend']} />
                <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest purchase orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none">{order.po_number}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.supplier_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${parseFloat(order.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.status}</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProcurementDashboardGuarded() {
  return (
    <RouteGuard module="procurement">
      <ProcurementDashboard />
    </RouteGuard>
  );
}
