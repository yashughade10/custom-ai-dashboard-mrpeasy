"use client";

import React, { useState } from 'react'
import { fetchOrders } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import OrderDetailsDialog from "@/components/product/OrderDetailsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { OrderFilters } from '@/components/ui/order-filters';

interface OrderData {
    customer_name: string;
    code: string;
    shipping_address?: {
        phone?: string;
    };
    products?: Array<{
        item_title?: string;
        item_code?: string;
    }>;
    status_txt: string;
    payment_status_txt: string;
    part_status_txt: string;
    created: number;
}

type Order = {
    id: string;
    payload: {
        data: OrderData;
    };
};

function page() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false)

    const [filters, setFilters] = useState({
        date: "",
        orderStatus: "All",
        paymentStatus: "All",
        shipmentStatus: "All",
    });

    const {
        data: orders,
        error: ordersError,
    } = useQuery({
        queryKey: ["orders"],
        queryFn: fetchOrders,
    });

    if (ordersError) {
        return (
            <div>
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-red-600">Failed to load orders.</p>
            </div>
        );
    }

    const filteredOrders = React.useMemo(() => {
        if (!orders) return [];

        return orders.filter((order: any) => {
            const o = order.payload.data;

            // 🔍 SEARCH
            const search = searchQuery.toLowerCase();

            const matchesSearch =
                o.customer_name?.toLowerCase().includes(search) ||
                o.code?.toLowerCase().includes(search) ||
                o.shipping_address?.phone?.toLowerCase().includes(search) ||
                o.products?.[0]?.item_title?.toLowerCase().includes(search) ||
                o.products?.[0]?.item_code?.toLowerCase().includes(search);

            // 📅 DATE
            const createdDate = new Date(Number(o.created) * 1000);

            const matchesDate = filters.date
                ? createdDate >= new Date(filters.date)
                : true;

            // 📦 ORDER STATUS
            const matchesOrderStatus =
                filters.orderStatus === "All" ||
                o.status_txt === filters.orderStatus;

            // 💳 PAYMENT STATUS
            const matchesPaymentStatus =
                filters.paymentStatus === "All" ||
                o.payment_status_txt === filters.paymentStatus;

            // 🚚 SHIPMENT STATUS
            const matchesShipmentStatus =
                filters.shipmentStatus === "All" ||
                o.part_status_txt === filters.shipmentStatus;

            return (
                matchesSearch &&
                matchesDate &&
                matchesOrderStatus &&
                matchesPaymentStatus &&
                matchesShipmentStatus
            );
        });
    }, [orders, searchQuery, filters]);

    const clearFilters = () => {
        setSearchQuery("");
        setFilters({
            date: "",
            orderStatus: "All",
            paymentStatus: "All",
            shipmentStatus: "All",
        });
    };

    const orderStatuses = React.useMemo(
        () => [...new Set(orders?.map((o: Order) => o.payload.data.status_txt) || [])] as string[],
        [orders]
    );

    const paymentStatuses = React.useMemo(
        () => [...new Set(orders?.map((o: Order) => o.payload.data.payment_status_txt) || [])] as string[],
        [orders]
    );

    const shipmentStatuses = React.useMemo(
        () => [...new Set(orders?.map((o: Order) => o.payload.data.part_status_txt) || [])] as string[],
        [orders]
    );

    return (
        <>
            <Card className="p-4 rounded-md">
                <OrderFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilters={setFilters}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    orderStatuses={orderStatuses}
                    paymentStatuses={paymentStatuses}
                    shipmentStatuses={shipmentStatuses}
                />
            </Card>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders?.length} orders
            </div>

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
                            {filteredOrders.map((order: any) => {
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
        </>
    )
}

export default page