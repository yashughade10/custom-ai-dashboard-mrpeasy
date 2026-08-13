"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, parseISO, getWeek } from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

interface ProductionCalendarProps {
  viewMode?: "calendar" | "gantt";
  searchQuery?: string;
}

export default function ProductionCalendar({ viewMode = "calendar", searchQuery = "" }: ProductionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["mrp-manufacturing-orders-all"],
    queryFn: () => mrpApi.getManufacturingOrders(1, 2000),
  });

  const allOrders = ordersData?.data || [];
  
  // Filter by search query
  const orders = allOrders.filter((o: any) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (o.mo_number && o.mo_number.toLowerCase().includes(lowerQuery)) ||
      (o.part_description && o.part_description.toLowerCase().includes(lowerQuery)) ||
      (o.part_no && o.part_no.toLowerCase().includes(lowerQuery))
    );
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

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
    if (status === "Scheduled") {
      return "border-[#E1BEE7] bg-[#F3E5F5] text-[#4A148C]";
    }
    if (status === "In progress") {
      return "border-[#FFCC80] bg-[#FFF3E0] text-[#E65100]";
    }
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

      {viewMode === "calendar" ? (
        <>
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

          const weekStart = week[0];
          const weekEnd = week[6];
          
          let eventsInWeek = orders.filter((o: any) => {
            if (!o.start_datetime || !o.finish_datetime) return false;
            const s = parseISO(o.start_datetime);
            const e = parseISO(o.finish_datetime);
            return s <= weekEnd && e >= weekStart;
          }).map((o: any) => {
            const s = parseISO(o.start_datetime);
            const e = parseISO(o.finish_datetime);
            
            const drawStart = s < weekStart ? weekStart : s;
            const drawEnd = e > weekEnd ? weekEnd : e;
            
            const startCol = drawStart.getDay() === 0 ? 7 : drawStart.getDay(); 
            const endCol = drawEnd.getDay() === 0 ? 7 : drawEnd.getDay();
            const span = endCol - startCol + 1;

            return {
              id: o.id || o.mo_number,
              data: o,
              startCol,
              span,
              style: getEventStyle(o.status),
              row: 2
            };
          });

          // Sort and calculate rows to prevent overlapping/spacing issues
          eventsInWeek.sort((a: any, b: any) => {
            const startA = parseISO(a.data.start_datetime).getTime();
            const startB = parseISO(b.data.start_datetime).getTime();
            if (startA !== startB) return startA - startB;
            return b.span - a.span;
          });

          const rowOccupancy: { [row: number]: boolean[] } = {};
          
          eventsInWeek.forEach((evt: any) => {
            let rowIndex = 2;
            while (true) {
              if (!rowOccupancy[rowIndex]) {
                rowOccupancy[rowIndex] = Array(8).fill(false);
              }
              
              let canFit = true;
              for (let col = evt.startCol; col < evt.startCol + evt.span; col++) {
                if (rowOccupancy[rowIndex][col]) {
                  canFit = false;
                  break;
                }
              }
              
              if (canFit) {
                for (let col = evt.startCol; col < evt.startCol + evt.span; col++) {
                  rowOccupancy[rowIndex][col] = true;
                }
                evt.row = rowIndex;
                break;
              }
              rowIndex++;
            }
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
                        className={`text-right p-1.5 ${isCurrentMonth ? 'text-gray-900 font-medium' : 'text-gray-400'} text-[12px] h-6`}
                      >
                        {format(day, "d")}
                      </div>
                    );
                  })}

                  {/* Events */}
                  {eventsInWeek.map((evt: any, idx: number) => {
                    const o = evt.data;
                    const startTime = format(parseISO(o.start_datetime), "dd/MM H:mm");
                    const endTime = format(parseISO(o.finish_datetime), "dd/MM H:mm");
                    const qtyStr = parseFloat(o.quantity) > 0 ? ` (${parseFloat(o.quantity)} pcs)` : "";
                    
                    return (
                      <div 
                        key={`${evt.id}-${weekIndex}-${idx}`}
                        style={{ gridColumn: `${evt.startCol} / span ${evt.span}`, gridRow: evt.row }}
                        onClick={() => setSelectedOrder(o)}
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
      </>
      ) : (
        <div className="flex-1 overflow-auto p-4 bg-gray-50/50">
          <div className="flex flex-col gap-2 min-w-[800px] h-full">
            <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b">
              <div className="w-[180px] px-3">Order</div>
              <div className="w-[250px] px-3">Product</div>
              <div className="w-[120px] px-3">Start</div>
              <div className="w-[120px] px-3">Finish</div>
              <div className="flex-1 px-3">Timeline (Month View)</div>
            </div>
            
            {orders.map((o: any, idx: number) => {
              if (!o.start_datetime || !o.finish_datetime) return null;
              
              const start = parseISO(o.start_datetime);
              const end = parseISO(o.finish_datetime);
              
              const monthDuration = endDate.getTime() - startDate.getTime();
              const eventStartPct = Math.max(0, (start.getTime() - startDate.getTime()) / monthDuration) * 100;
              const eventEndPct = Math.min(100, (end.getTime() - startDate.getTime()) / monthDuration) * 100;
              const width = Math.max(0.5, eventEndPct - eventStartPct);
              
              return (
                <div key={o.id || idx} className="flex items-center text-[13px] py-1.5 bg-white border border-gray-100 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 group">
                  <div className="w-[180px] font-medium text-blue-600 px-3 cursor-pointer hover:underline" onClick={() => setSelectedOrder(o)}>{o.mo_number}</div>
                  <div className="w-[250px] truncate px-3" title={o.part_description}>{o.part_no} {o.part_description}</div>
                  <div className="w-[120px] px-3 text-gray-600">{format(start, "dd/MM H:mm")}</div>
                  <div className="w-[120px] px-3 text-gray-600">{format(end, "dd/MM H:mm")}</div>
                  <div className="flex-1 px-3 relative h-7 border-l border-gray-100 flex items-center">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(14.28%-1px),#f3f4f6_calc(14.28%-1px),#f3f4f6_14.28%)] pointer-events-none opacity-50" />
                    <div 
                      className={`absolute h-5 rounded-[2px] border cursor-pointer hover:opacity-100 shadow-sm ${getEventStyle(o.status)}`}
                      style={{ 
                        left: `calc(0.75rem + ${eventStartPct * 0.95}%)`, 
                        width: `calc(${width * 0.95}%)`,
                      }}
                      title={`${format(start, "dd MMM")} - ${format(end, "dd MMM")}`}
                      onClick={() => setSelectedOrder(o)}
                    />
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <div className="text-center py-10 text-gray-500">No orders found matching your criteria.</div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden rounded-md border-0 shadow-lg">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-slate-800">Manufacturing order</DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="p-6 pt-4 flex flex-col gap-4 text-[14px]">
              <div className="grid grid-cols-[100px_1fr] gap-x-2">
                <div className="text-slate-500 text-right">Number:</div>
                <div className="font-medium text-slate-900">{selectedOrder.mo_number}</div>
                
                <div className="text-slate-500 text-right mt-3">Product:</div>
                <div className="font-medium text-slate-900 mt-3">{selectedOrder.part_no} {selectedOrder.part_description}</div>
                
                <div className="text-slate-500 text-right mt-3">Quantity:</div>
                <div className="font-medium text-slate-900 mt-3">{parseFloat(selectedOrder.quantity)} pcs</div>
                
                <div className="text-slate-500 text-right mt-3">Assigned to:</div>
                <div className="font-medium text-slate-900 mt-3">{selectedOrder.assigned_to || "Admin"}</div>
                
                <div className="text-slate-500 text-right mt-3">Start:</div>
                <div className="font-medium text-slate-900 mt-3">{format(parseISO(selectedOrder.start_datetime), "dd/MM/yyyy HH:mm")}</div>
                
                <div className="text-slate-500 text-right mt-3">Finish:</div>
                <div className="font-medium text-slate-900 mt-3">{format(parseISO(selectedOrder.finish_datetime), "dd/MM/yyyy HH:mm")}</div>
                
                <div className="text-slate-500 text-right mt-3">Due date:</div>
                <div className="font-medium text-slate-900 mt-3">{selectedOrder.due_date ? format(parseISO(selectedOrder.due_date), "dd/MM/yyyy") : ""}</div>
                
                <div className="text-slate-500 text-right mt-3">Status:</div>
                <div className="font-medium text-slate-900 mt-3">{selectedOrder.status}</div>
              </div>
              
              <div className="mt-4">
                <Link href={`/dashboard/mrp/jobs/${selectedOrder.id || selectedOrder.mo_number}`} passHref>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    View Job Details
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

