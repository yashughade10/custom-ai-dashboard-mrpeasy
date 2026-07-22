import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  name: string;
  href: string;
}

interface MrpTabBarProps {
  tabs: Tab[];
}

export function MrpTabBar({ tabs }: MrpTabBarProps) {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-gray-200 mb-4 bg-white">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
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
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
