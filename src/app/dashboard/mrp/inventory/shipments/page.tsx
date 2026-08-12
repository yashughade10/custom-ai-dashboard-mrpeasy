"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import Link from "next/link";
import { Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ShipmentsPage() {
  const [filters, setFilters] = useState<any>({});
  const [rangeFilters, setRangeFilters] = useState<any>({});
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpShipments", filters, rangeFilters],
    queryFn: () => mrpApi.getShipments(1, 100, "", filters, rangeFilters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => mrpApi.deleteShipment(id),
    onSuccess: () => {
      toast.success("Shipment deleted");
      queryClient.invalidateQueries({ queryKey: ["mrpShipments"] });
    },
    onError: () => toast.error("Failed to delete shipment")
  });

  const shipments = response?.data || [];

  const columns: Column<any>[] = [
    { 
      header: "Number", 
      accessorKey: "shipment_number", 
      sortable: true, 
      searchable: true,
      cell: (r) => (
        <Link href={`/dashboard/mrp/inventory/shipments/${r.id}`} className="text-[#1a73e8] hover:underline">
          {r.shipment_number}
        </Link>
      )
    },
    { 
      header: "Created", 
      accessorKey: "created_date", 
      filterType: "date",
      cell: (r) => r.created_date ? new Date(r.created_date).toLocaleDateString() : "" 
    },
    { 
      header: "Delivery date", 
      accessorKey: "delivery_date", 
      filterType: "date",
      cell: (r) => r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "" 
    },
    { header: "Status", accessorKey: "status", searchable: true },
    { header: "Order", accessorKey: "order_number", searchable: true },
    { header: "Customer number", accessorKey: "customer_number", searchable: true },
    { header: "Customer name", accessorKey: "customer_name", searchable: true },
    {
      header: "",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/mrp/inventory/shipments/${row.id}`}>
            <button className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit shipment">
              <Edit className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this shipment?")) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="text-gray-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete shipment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading shipments...</div>;
  }

  return (
    <MrpDataTable 
      data={shipments} 
      columns={columns} 
      onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
    />
  );
}
