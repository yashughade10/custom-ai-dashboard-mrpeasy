"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { useRouter } from "next/navigation";

export default function ProductGroupsList() {
  const router = useRouter();
  
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ["mrpProductGroups"],
    queryFn: () => mrpApi.getProductGroups(),
  });

  const columns: Column<any>[] = [
    { header: "Number", accessorKey: "group_number", sortable: true, searchable: true },
    { header: "Name", accessorKey: "group_name", sortable: true, searchable: true }
  ];

  const data = groupsData?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <>
      <MrpDataTable 
        columns={columns} 
        data={data} 
        onRowClick={(row) => router.push(`/dashboard/mrp/inventory/settings/product-groups/${row.id}`)}
      />
      {data.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button className="text-blue-600 hover:underline text-sm font-medium">
            Load more
          </button>
        </div>
      )}
    </>
  );
}
