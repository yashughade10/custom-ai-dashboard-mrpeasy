"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { Button } from "@/components/ui/button";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function CustomersPage() {
  const router = useRouter();
  const [limit, setLimit] = useState(100);

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomers", limit],
    queryFn: () => mrpApi.getCustomers(1, limit),
  });

  const customers = response?.data || [];

  const columns: Column<any>[] = [
    { header: "Number", accessorKey: "customer_number", searchable: true, sortable: true },
    { header: "Name", accessorKey: "name", searchable: true, sortable: true },
    { header: "Status", accessorKey: "status", searchable: true },
    { header: "Account manager", accessorKey: "account_manager", searchable: true },
    { header: "E-mail", accessorKey: "email", searchable: true },
    { header: "Phone", accessorKey: "phone", searchable: true },
    { header: "Address", accessorKey: "address", searchable: true },
    { header: "Available credit", accessorKey: "available_credit", sortable: true },
  ];

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <MrpExportBar createLabel="Create customer" />
            
            <div className="flex-1 mt-4">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading customers...</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <MrpDataTable 
                    columns={columns} 
                    data={customers} 
                    onRowClick={(row: any) => router.push(`/dashboard/mrp/crm/customers/${row.customer_number || row.id}`)}
                  />
                  {customers.length >= limit && (
                    <div className="text-center py-4">
                      <Button variant="link" onClick={() => setLimit(l => l + 50)} className="text-blue-600 text-[11px]">Load more</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
