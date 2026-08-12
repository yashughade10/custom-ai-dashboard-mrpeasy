"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import Link from "next/link";
import { Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ShipmentItemsPage() {
  const [filters, setFilters] = useState<any>({});
  const [rangeFilters, setRangeFilters] = useState<any>({});
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpShipmentItems", filters, rangeFilters],
    queryFn: () => mrpApi.getShipmentItems(1, 100, "", filters, rangeFilters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => mrpApi.deleteShipmentItem(id),
    onSuccess: () => {
      toast.success("Shipment item deleted");
      queryClient.invalidateQueries({ queryKey: ["mrpShipmentItems"] });
    },
    onError: () => toast.error("Failed to delete shipment item")
  });

  const items = response?.data || [];

  const columns: Column<any>[] = [
    { 
      header: "Number", 
      accessorKey: "shipment_number", 
      sortable: true, 
      searchable: true,
      cell: (r) => (
        <Link href={`/dashboard/mrp/inventory/shipments/${r.shipment_id || r.shipment_number}`} className="text-[#1a73e8] hover:underline">
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
    { header: "Part No.", accessorKey: "part_no", searchable: true },
    { header: "Part description", accessorKey: "part_description", searchable: true },
    { header: "Picked quantity", accessorKey: "picked_quantity", filterType: "range" },
    { header: "Remains to ship", accessorKey: "remains_to_ship", filterType: "range" },
    {
      header: "",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/mrp/inventory/shipments/items/${row.id}`}>
            <button className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit item">
              <Edit className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this shipment item?")) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="text-gray-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading shipment items...</div>;
  }

  return (
    <MrpDataTable 
      data={items} 
      columns={columns} 
      onFilterChange={(f, rf) => { setFilters(f); setRangeFilters(rf); }}
    />
  );
}
