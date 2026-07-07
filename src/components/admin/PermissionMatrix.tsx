"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { RoleForm } from "@/components/admin/RoleForm";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MODULES = ["CRM", "Sales", "Production", "Procurement", "Inventory", "Reports", "Admin"];
const ACTIONS = ["read", "create", "update", "delete"];

export function PermissionMatrix() {
  const [roles, setRoles] = useState<any[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
      if (data.length > 0 && !activeRoleId) {
        setActiveRoleId(data[0].id);
        setPermissions(data[0].permissions || []);
      } else if (activeRoleId) {
        const updatedActive = data.find((r: any) => r.id === activeRoleId);
        if (updatedActive) setPermissions(updatedActive.permissions || []);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRoleSelect = (roleId: number) => {
    setActiveRoleId(roleId);
    const role = roles.find(r => r.id === roleId);
    setPermissions(role?.permissions || []);
  };

  const togglePermission = (moduleName: string, actionName: string) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module === moduleName && p.action === actionName);
      if (existing) {
        return prev.map(p => 
          p.module === moduleName && p.action === actionName 
            ? { ...p, is_allowed: p.is_allowed ? 0 : 1 } 
            : p
        );
      } else {
        return [...prev, { module: moduleName, action: actionName, is_allowed: 1 }];
      }
    });
  };

  const isAllowed = (moduleName: string, actionName: string) => {
    const p = permissions.find(p => p.module === moduleName && p.action === actionName);
    return p ? Boolean(p.is_allowed) : false;
  };

  const handleSavePermissions = async () => {
    if (!activeRoleId) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:4000/api/admin/roles/${activeRoleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions })
      });
      if (!res.ok) throw new Error("Failed to save permissions");
      toast.success("Permissions updated successfully");
      fetchRoles();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/admin/roles/${roleToDelete}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }
      toast.success("Role deleted");
      if (activeRoleId === roleToDelete) setActiveRoleId(null);
      fetchRoles();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
      setRoleToDelete(null);
    }
  };

  if (loading && roles.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  const activeRole = roles.find(r => r.id === activeRoleId);

  return (
    <Card className="w-full border-border/50 shadow-sm">
      <CardContent className="p-6 flex flex-col md:flex-row gap-8">
        {/* Roles List sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Roles</h3>
            <Button size="icon" variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setIsRoleFormOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {roles.map(role => (
              <div 
                key={role.id} 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeRoleId === role.id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'hover:bg-muted/50 border-transparent hover:border-border/50'}`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <div>
                  <div className={`font-medium ${activeRoleId === role.id ? 'text-primary' : ''}`}>{role.name}</div>
                  {role.is_system ? (
                    <span className="text-xs text-muted-foreground font-medium">System Role</span>
                  ) : null}
                </div>
                {activeRoleId === role.id && !role.is_system && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); setRoleToDelete(role.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="flex-1 space-y-6">
          {activeRole ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{activeRole.name} Permissions</h3>
                  <p className="text-sm text-muted-foreground">{activeRole.description || "Configure access levels for this role."}</p>
                </div>
                <Button onClick={handleSavePermissions} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
              
              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="py-4 font-semibold">Module</TableHead>
                      {ACTIONS.map(action => (
                        <TableHead key={action} className="text-center capitalize py-4 font-semibold">{action}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map(moduleName => (
                      <TableRow key={moduleName} className="hover:bg-muted/20">
                        <TableCell className="font-medium py-3">{moduleName}</TableCell>
                        {ACTIONS.map(action => (
                          <TableCell key={action} className="text-center py-3">
                            <Checkbox 
                              checked={isAllowed(moduleName, action)} 
                              onCheckedChange={() => togglePermission(moduleName, action)}
                              disabled={activeRole.name === 'Admin'} // Admin has implicit full access
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {activeRole.name === 'Admin' && (
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Note: The Admin role has implicit bypass for all permissions.
                </p>
              )}
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10 gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p>Select or create a role to configure permissions.</p>
            </div>
          )}
        </div>

        <RoleForm open={isRoleFormOpen} onOpenChange={setIsRoleFormOpen} onSuccess={fetchRoles} />

        <Dialog open={roleToDelete !== null} onOpenChange={(open) => !open && setRoleToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this role? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleToDelete(null)} disabled={isDeleting}>Cancel</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteRole} disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
