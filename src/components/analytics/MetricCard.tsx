import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentClass?: string;
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass = "bg-[#FCD900] text-[#5C4A00]",
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm pt-0">
      <CardHeader className={`flex flex-row items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 ${accentClass}`}>
        <CardTitle className="text-sm font-medium leading-none">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>

      <CardContent className="pt-4">
        <div className="text-2xl font-semibold text-slate-950">
          {value}
        </div>

        {subtitle ? (
          <p className="mt-2 inline-block text-xs px-2 py-1 rounded-md bg-black/5 text-slate-700">
            {subtitle}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}