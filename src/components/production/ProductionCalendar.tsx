"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO, isSameDay, getWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Search, RefreshCw, Settings2, Plus, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";

export default function ProductionCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Default to July 2026 to match data
  
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["mrp-manufacturing-orders-all"],
    queryFn: () => mrpApi.getManufacturingOrders(1, 2000),
  });

  const orders = ordersData?.data || [];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date(2026, 6, 1)); // Hardcoded for this demo so it shows the data

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days by weeks
  const weeks: Date[][] = [];
  let daysArray: Date[] = [];
  days.forEach((day) => {
    if (daysArray.length === 7) {
      weeks.push(daysArray);
      daysArray = [];
    }
    daysArray.push(day);
  });
  if (daysArray.length > 0) weeks.push(daysArray);

  const getEventStyle = (status: string) => {
    // Generate distinct styles based on status. If not status, fallback to order.
    // In screenshot: Scheduled = purple border/light bg. Received/In Progress = green border/striped bg.
    if (status === "Scheduled") {
      return "border-[#E1BEE7] bg-[#F3E5F5] text-[#4A148C]";
    }
    if (status === "In progress") {
      return "border-[#FFCC80] bg-[#FFF3E0] text-[#E65100]";
    }
    // Default to striped green
    return "border-[#A5D6A7] text-[#1B5E20] bg-[repeating-linear-gradient(45deg,#E8F5E9,#E8F5E9_5px,#F1F8E9_5px,#F1F8E9_10px)]";
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      
      {/* Calendar Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-sm border border-gray-200 overflow-hidden bg-gray-50/50">
            <button onClick={prevMonth} className="px-2 py-1 border-r border-gray-200 hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="px-2 py-1 border-r border-gray-200 hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={goToToday} className="px-3 py-1 text-[13px] font-medium text-gray-700 hover:bg-gray-100">
              Today
            </button>
          </div>
        </div>

        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight ml-32">
          {format(currentDate, dateFormat)}
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex rounded-sm border border-gray-200 overflow-hidden bg-gray-50/50 text-[12px] font-medium">
            <button className="px-3 py-1 bg-blue-50 text-blue-700 border-b-2 border-blue-600">Month</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-b-2 border-transparent border-l border-gray-200">Week</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-b-2 border-transparent border-l border-gray-200">Day</button>
          </div>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white ml-8">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center py-2 text-[12px] font-bold text-gray-900">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week, weekIndex) => {
          const weekNumber = getWeek(week[0], { weekStartsOn: 1 });

          // Find events for this week
          const weekStart = week[0];
          const weekEnd = week[6];
          
          // Map orders that intersect this week
          const eventsInWeek = orders.filter((o: any) => {
            if (!o.start_datetime || !o.finish_datetime) return false;
            const s = parseISO(o.start_datetime);
            const e = parseISO(o.finish_datetime);
            // Intersects if event start <= week end AND event end >= week start
            return s <= weekEnd && e >= weekStart;
          }).map((o: any) => {
            const s = parseISO(o.start_datetime);
            const e = parseISO(o.finish_datetime);
            
            // Constrain to week bounds
            const drawStart = s < weekStart ? weekStart : s;
            const drawEnd = e > weekEnd ? weekEnd : e;
            
            // Calculate column span (1 to 7)
            const startCol = drawStart.getDay() === 0 ? 7 : drawStart.getDay(); 
            const endCol = drawEnd.getDay() === 0 ? 7 : drawEnd.getDay();
            const span = endCol - startCol + 1;

            return {
              id: o.id || o.mo_number,
              data: o,
              startCol,
              span,
              style: getEventStyle(o.status)
            };
          });

          return (
            <div key={weekIndex} className="relative border-b border-gray-200 min-h-[140px] flex">
              {/* Week Number Edge */}
              <div className="w-8 flex-shrink-0 border-r border-gray-100 bg-gray-50/30 flex justify-center pt-2">
                <span className="text-[11px] font-medium text-gray-400">W{weekNumber}</span>
              </div>

              {/* Grid Container */}
              <div className="flex-1 relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                  {week.map((_, i) => (
                    <div key={i} className="border-r border-gray-100 h-full" />
                  ))}
                </div>

                {/* Content Grid */}
                <div className="relative z-10 grid grid-cols-7 gap-y-0.5 pt-1 pb-2" style={{ gridAutoRows: 'min-content' }}>
                  
                  {/* Day Numbers (Row 1) */}
                  {week.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    return (
                      <div 
                        key={day.toISOString()} 
                        style={{ gridColumn: i + 1, gridRow: 1 }} 
                        className={`text-right p-1.5 ${isCurrentMonth ? 'text-gray-900 font-medium' : 'text-gray-400'} text-[12px]`}
                      >
                        {format(day, "d")}
                      </div>
                    );
                  })}

                  {/* Events (Row 2+) */}
                  {eventsInWeek.map((evt: any, idx: number) => {
                    const o = evt.data;
                    const startTime = format(parseISO(o.start_datetime), "dd/MM H:mm");
                    const endTime = format(parseISO(o.finish_datetime), "dd/MM H:mm");
                    const qtyStr = parseFloat(o.quantity) > 0 ? ` (${parseFloat(o.quantity)} pcs)` : "";
                    
                    return (
                      <div 
                        key={`${evt.id}-${weekIndex}-${idx}`}
                        style={{ gridColumn: `${evt.startCol} / span ${evt.span}`, gridRow: 'auto' }}
                        className={`mx-1 my-[1px] px-1.5 py-1 text-[10px] leading-tight border rounded-[2px] truncate cursor-pointer shadow-sm hover:opacity-90 ${evt.style}`}
                        title={`${o.mo_number}: ${o.part_description}`}
                      >
                        <span className="font-bold mr-1">{startTime} - {endTime}</span> 
                        <span className="font-bold opacity-80">{o.mo_number},</span> {o.part_no} {o.part_description}
                        <span className="opacity-80">{qtyStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
