"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { format } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001/api";

interface SyncLog {
  id: number;
  direction: string;
  entity_type: string;
  entity_id: string;
  xero_id: string;
  status: string;
  error_message: string | null;
  synced_at: string;
}

function XeroSettingsPage() {
  const [status, setStatus] = useState<{ connected: boolean; tenantName?: string; lastUpdated?: string } | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/xero/auth/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch Xero status", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/xero/sync/log`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API_BASE}/xero/auth/login`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Xero?")) return;
    try {
      await fetch(`${API_BASE}/xero/auth/disconnect`, { method: "POST" });
      setStatus({ connected: false });
    } catch (err) {
      console.error("Failed to disconnect", err);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/xero/sync/pull-all`, { method: "POST" });
      alert("Sync completed successfully!");
      fetchLogs();
    } catch (err) {
      console.error("Failed to sync", err);
      alert("Failed to sync with Xero.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Xero settings...</div>;
  }

  return (
    <div className="w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Xero Integration</h2>
        <p className="text-muted-foreground">Manage your connection to Xero and view sync history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Connect your Xero account to enable two-way sync for invoices, bills, and contacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              {status?.connected ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className="bg-green-500">Connected</Badge>
                    <span className="font-semibold">{status.tenantName}</span>
                  </div>
                  {status.lastUpdated && (
                    <p className="text-sm text-muted-foreground">
                      Last token refresh: {format(new Date(status.lastUpdated), "PP pp")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Not Connected</Badge>
                  <span className="text-sm text-muted-foreground">Authorize this app to sync data with Xero.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          {status?.connected ? (
            <>
              <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
              <Button onClick={handleSyncAll} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync All Now"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect}>Connect to Xero</Button>
          )}
        </CardFooter>
      </Card>

      {status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>The last 50 sync events with Xero.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No sync logs found.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.synced_at), "PP pp")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.direction === 'to_xero' ? 'To Xero' : 'From Xero'}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{log.entity_type}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? "bg-green-500 hover:bg-green-600" : ""}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function XeroSettingsPageGuarded() {
  return (
    <RouteGuard module="admin">
      <XeroSettingsPage />
    </RouteGuard>
  );
}
