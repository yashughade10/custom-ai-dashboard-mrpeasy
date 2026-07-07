"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/admin/audit-log");
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <Card className="w-full border-border/50 shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold">System Audit Log</CardTitle>
        <CardDescription>Track user actions and data changes over time.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 py-4"></TableHead>
                <TableHead className="py-4 font-semibold">User</TableHead>
                <TableHead className="py-4 font-semibold">Action</TableHead>
                <TableHead className="py-4 font-semibold">Entity</TableHead>
                <TableHead className="py-4 font-semibold">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleRow(log.id)}>
                    <TableCell className="py-3">
                      {expandedRows[log.id] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium py-3">{log.user_name || `User ID: ${log.user_id}`}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="uppercase text-xs font-medium">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="capitalize font-medium">{log.entity_type}</span> {log.entity_id ? `#${log.entity_id}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm py-3">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                  {expandedRows[log.id] && (
                    <TableRow className="bg-muted/10 border-b">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Old Values
                            </div>
                            <pre className="bg-background/80 p-4 rounded-md border text-xs overflow-x-auto shadow-sm">
                              {log.old_values ? JSON.stringify(log.old_values, null, 2) : "None"}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> New Values
                            </div>
                            <pre className="bg-background/80 p-4 rounded-md border text-xs overflow-x-auto shadow-sm">
                              {log.new_values ? JSON.stringify(log.new_values, null, 2) : "None"}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p>No audit logs found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
