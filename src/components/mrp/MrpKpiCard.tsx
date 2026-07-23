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
        "flex flex-col bg-white border border-gray-200 border-l-4 border-l-blue-600 p-3 hover:shadow-md transition-shadow min-h-[90px] justify-between",
        className
      )}
    >
      <span className="text-2xl font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-gray-500 text-xs font-normal mt-2 leading-tight">{title}</span>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
