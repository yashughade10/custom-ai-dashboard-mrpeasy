import { cn } from "@/lib/utils";
import Link from "next/link";

interface MrpKpiCardProps {
  title: string;
  value: string | number;
  href?: string;
  className?: string;
}

export function MrpKpiCard({ title, value, href, className }: MrpKpiCardProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col bg-white border border-gray-200 border-l-4 border-l-blue-600 shadow-sm p-4 hover:shadow-md transition-shadow h-24 justify-center",
        className
      )}
    >
      <span className="text-gray-500 text-sm font-medium">{title}</span>
      <span className="text-2xl font-bold text-gray-900 mt-1">{value}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
