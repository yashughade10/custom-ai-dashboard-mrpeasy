"use client";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchOrders } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { Badge } from 'lucide-react'
import React from 'react'

function page() {

    const { data: data, error } = useQuery({
        queryKey: ['orders'],
        queryFn: fetchOrders
    })

    return (
        <div>
            <h1 className='text-xl font-bold'>Dashboard</h1>
            <p>Welcome to the dashboard! This is where you can manage your restaurant, view analytics, and more.</p>

            <Card className='mt-4'>
                <CardHeader>
                    <CardTitle className="text-xl">Orders</CardTitle>
                    <CardDescription>List of all orders</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className='bg-gray-100'>
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
                            <TableRow>
                                <TableCell className="font-medium">
                                    <div>
                                        <p className="font-semibold">CVL2500NT</p>
                                        <p className="text-xs text-muted-foreground">Description for CVL2500NT</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    plan type
                                </TableCell>
                                <TableCell>Something crazy</TableCell>
                                <TableCell>Something crazy</TableCell>
                                <TableCell>Something crazy</TableCell>
                                <TableCell>
                                    Active
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    10-05-2001
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default page