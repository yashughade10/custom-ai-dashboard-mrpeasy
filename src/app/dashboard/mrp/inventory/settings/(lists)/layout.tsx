"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarTabs = [
  { id: "product-groups", name: "Product groups", href: "/dashboard/mrp/inventory/settings/product-groups" },
  { id: "uoms", name: "Units of measurement", href: "/dashboard/mrp/inventory/settings/uoms" },
  { id: "locations", name: "Storage locations", href: "/dashboard/mrp/inventory/settings/locations" },
];

export default function SettingsListsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleCreate = () => {
    if (pathname.includes("/product-groups")) {
      router.push("/dashboard/mrp/inventory/settings/product-groups/new");
    } else if (pathname.includes("/uoms")) {
      router.push("/dashboard/mrp/inventory/settings/uoms/new");
    } else if (pathname.includes("/locations")) {
      router.push("/dashboard/mrp/inventory/settings/locations/new");
    }
  };

  return (
    <div className="px-4 pb-4 flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-6 mt-2">
        <h1 className="text-2xl font-semibold text-gray-900">Stock settings</h1>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>
      
      <div className="flex flex-1 gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-gray-200">
          {sidebarTabs.map(tab => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors block border-l-2",
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-medium border-blue-600" 
                    : "text-gray-600 hover:bg-gray-50 border-transparent"
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>

        {/* Main Content (Tables) */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

