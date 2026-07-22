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

export default function CustomersPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomers"],
    queryFn: () => mrpApi.getCustomers(1, 100),
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
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <MrpExportBar createLabel="Create customer" />
            
            <div className="flex-1 min-h-0 mt-4 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading customers...</div>
              ) : (
                <MrpDataTable columns={columns} data={customers} />
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
