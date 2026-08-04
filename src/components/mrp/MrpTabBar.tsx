"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

interface Tab {
  name: string;
  href: string;
  isActiveOverride?: boolean;
}

interface MrpTabBarProps {
  tabs: Tab[];
}

export function MrpTabBar({ tabs }: MrpTabBarProps) {
  const pathname = usePathname();

  const { data: countsData } = useQuery({
    queryKey: ["mrp-production-counts"],
    queryFn: () => mrpApi.getProductionCounts(),
    refetchInterval: 30000 // Refetch every 30s to keep it fresh
  });

  const bomsCount = countsData?.data?.boms || 0;
  const routingsCount = countsData?.data?.routings || 0;

  return (
    <div className="flex border-b border-gray-200 mb-4 bg-white">
      {tabs.map((tab) => {
        const isActive = tab.isActiveOverride !== undefined ? tab.isActiveOverride : pathname === tab.href;
        
        let tabName = tab.name;
        // Dynamically update BOM and Routings names with real counts if they match the original format
        if (tabName.startsWith("BOM")) {
          tabName = `BOM (${bomsCount})`;
        } else if (tabName.startsWith("Routings")) {
          tabName = `Routings (${routingsCount})`;
        }

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tabName}
          </Link>
        );
      })}
    </div>
  );
}
