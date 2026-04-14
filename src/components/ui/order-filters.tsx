import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';

interface OrderFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: {
        date: string;
        orderStatus: string;
        paymentStatus: string;
        shipmentStatus: string;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        date: string;
        orderStatus: string;
        paymentStatus: string;
        shipmentStatus: string;
    }>>;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    orderStatuses: string[];
    paymentStatuses: string[];
    shipmentStatuses: string[];
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    orderStatuses,
    paymentStatuses,
    shipmentStatuses,
}) => {
    const clearFilters = () => {
        setSearchQuery("");
        setFilters({
            date: "",
            orderStatus: "All",
            paymentStatus: "All",
            shipmentStatus: "All",
        });
    };

    const hasActiveFilters = searchQuery ||
        filters.date ||
        filters.orderStatus !== "All" ||
        filters.paymentStatus !== "All" ||
        filters.shipmentStatus !== "All";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <SearchInput
                    placeholder="Search by title, customer name, or order code..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="flex-1"
                />
                <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                >
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="gap-2">
                        <X className="w-4 h-4" />
                        Clear
                    </Button>
                )}
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t">

                    {/* Date From */}
                    <Input
                        type="date"
                        value={filters.date}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, date: e.target.value }))
                        }
                    />

                    {/* Order Status */}
                    <select
                        value={filters.orderStatus}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, orderStatus: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="All">All Orders</option>

                        {orderStatuses.map((status: string) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    {/* Payment Status */}
                    <select
                        value={filters.paymentStatus}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="All">All Payments</option>
                        {paymentStatuses.map((status: string) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    {/* Shipment Status */}
                    <select
                        value={filters.shipmentStatus}
                        onChange={(e) =>
                            setFilters(prev => ({ ...prev, shipmentStatus: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="All">All Shipments</option>
                        {shipmentStatuses.map((status: string) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                </div>
            )}
        </div>
    );
};