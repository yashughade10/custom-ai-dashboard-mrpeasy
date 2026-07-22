"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpKanbanBoard } from "@/components/mrp/MrpKanbanBoard";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { RouteGuard } from "@/components/auth/RouteGuard";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

const ORDER_STATUSES = [
  "Quotation",
  "Waiting for confirmation",
  "Confirmed",
  "Waiting for production",
  "In production",
  "Ready for shipment"
];

export default function CRMPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomerOrders"],
    queryFn: mrpApi.getCustomerOrders,
  });

  const orders = response?.data || [];

  // Group orders into columns
  const columns = ORDER_STATUSES.map(status => {
    const statusOrders = orders.filter((o: any) => o.status === status);
    const totalValue = statusOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    
    return {
      id: status,
      title: status,
      totalValue,
      items: statusOrders.map((o: any) => ({
        id: o.order_number,
        title: o.customer_name,
        subtitle: `Ref: ${o.reference || '-'}`,
        amount: Number(o.total || 0)
      }))
    };
  });

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <MrpExportBar createLabel="Create customer order" />
            
            <div className="flex-1 min-h-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading orders...</div>
              ) : (
                <MrpKanbanBoard columns={columns} />
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
