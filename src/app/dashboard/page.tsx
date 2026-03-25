"use client";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import OrderDetailsDialog from "@/components/product/OrderDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fetchOrders } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import React from "react";

function DashboardPage() {
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [open, setOpen] = React.useState(false);

  const { data, error } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-red-600">Failed to load orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p>Welcome to the dashboard! This is where you can manage your restaurant, view analytics, and more.</p>
      </div>

      <AnalyticsDashboard orders={data ?? []} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Orders</CardTitle>
          <CardDescription>List of all orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Order Code</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Shipment Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((order: any) => {
                const o = order.payload.data;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{o.products?.[0]?.item_code || "-"}</p>
                        <p className="text-xs text-muted-foreground max-w-50 truncate">
                          {o.products?.[0]?.item_title || "No description"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{o.code}</TableCell>

                    <TableCell className="max-w-30">{o.customer_name}</TableCell>

                    <TableCell>
                      <span className="text-blue-600 font-medium">{o.status_txt}</span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "text-red-500",
                          o.payment_status_txt === "Paid" && "text-green-600"
                        )}
                      >
                        {o.payment_status_txt}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-green-600">{o.part_status_txt}</span>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(Number(o.created) * 1000).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OrderDetailsDialog open={open} onClose={() => setOpen(false)} order={selectedOrder} />
    </div>
  );
}

export default DashboardPage;
