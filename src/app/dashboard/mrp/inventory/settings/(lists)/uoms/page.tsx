"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { useRouter } from "next/navigation";

export default function UomsList() {
  const router = useRouter();
  
  const { data: uomsData, isLoading } = useQuery({
    queryKey: ["mrpUoms"],
    queryFn: () => mrpApi.getUoms(),
  });

  const columns: Column<any>[] = [
    { header: "Unit of measurement", accessorKey: "name", sortable: true, searchable: true }
  ];

  const data = uomsData?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <>
      <MrpDataTable 
        columns={columns} 
        data={data} 
        onRowClick={(row) => router.push(`/dashboard/mrp/inventory/settings/uoms/${row.id}`)}
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
