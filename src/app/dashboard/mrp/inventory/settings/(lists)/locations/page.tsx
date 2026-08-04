"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { useRouter } from "next/navigation";

export default function StorageLocationsList() {
  const router = useRouter();
  
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["mrpStorageLocations"],
    queryFn: () => mrpApi.getStorageLocations(),
  });

  const columns: Column<any>[] = [
    { header: "Storage location", accessorKey: "name", sortable: true, searchable: true }
  ];

  const data = locationsData?.data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <>
      <MrpDataTable 
        columns={columns} 
        data={data} 
        onRowClick={(row) => router.push(`/dashboard/mrp/inventory/settings/locations/${row.id}`)}
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
