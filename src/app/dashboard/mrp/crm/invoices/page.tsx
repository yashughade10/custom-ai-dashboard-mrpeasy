"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function InvoicesPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpInvoices"],
    queryFn: () => mrpApi.getInvoices(1, 100),
  });

  const invoices = response?.data || [];

  const columns: Column<any>[] = [
    { header: "Number", accessorKey: "invoice_number", searchable: true, sortable: true },
    { header: "Customer name", accessorKey: "customer_name", searchable: true, sortable: true },
    { header: "Order", accessorKey: "order_number", searchable: true },
    { header: "Type", accessorKey: "type", searchable: true },
    { header: "Status", accessorKey: "status", searchable: true },
    { 
      header: "Total", 
      accessorKey: "total_including_tax", 
      sortable: true,
      cell: (row) => `$${Number(row.total_including_tax || 0).toFixed(2)}`
    },
    { 
      header: "Paid", 
      accessorKey: "paid", 
      sortable: true,
      cell: (row) => `$${Number(row.paid || 0).toFixed(2)}`
    },
    { header: "Due date", accessorKey: "due_date", sortable: true },
  ];

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <MrpExportBar createLabel="Create invoice" />
            
            <div className="flex-1 min-h-0 mt-4 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading invoices...</div>
              ) : (
                <MrpDataTable columns={columns} data={invoices} />
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
