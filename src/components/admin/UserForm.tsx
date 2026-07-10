"use client";

import { apiFetch } from "@/lib/api/http";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSuccess: () => void;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [systemRoles, setSystemRoles] = useState<string[]>([]);
  const [systemModules, setSystemModules] = useState<string[]>([]);
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    permissions: [] as string[]
  });

  useEffect(() => {
    if (open) {
      fetchConstants();
      if (user) {
        setFormData({ 
          name: user.name || "", 
          email: user.email || "", 
          password: "", 
          role: user.role || "user",
          permissions: user.permissions || []
        });
      } else {
        setFormData({ name: "", email: "", password: "", role: "user", permissions: [] });
      }
    }
  }, [open, user]);

  const fetchConstants = async () => {
    try {
      const res = await apiFetch("http://localhost:4000/api/admin/system-constants");
      if (res.ok) {
        const json = await res.json();
        setSystemRoles(json.data.roles);
        setSystemModules(json.data.modules);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermissionChange = (moduleName: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return { ...prev, permissions: [...prev.permissions, moduleName] };
      } else {
        return { ...prev, permissions: prev.permissions.filter(m => m !== moduleName) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `http://localhost:4000/api/admin/users/${user.id}`
        : "http://localhost:4000/api/admin/users";
      
      const method = isEditing ? "PUT" : "POST";
      
      const payload = { ...formData };
      if (isEditing) {
        delete (payload as any).password; // Don't send empty password on edit
        delete (payload as any).email; // Prevent email update for simplicity
      }

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save user");
      
      toast.success(isEditing ? "User updated" : "User created");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email" 
              required 
              disabled={isEditing}
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {systemRoles.length > 0 ? systemRoles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                )) : (
                  <>
                    <SelectItem value="super_admin">super_admin</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.role !== "super_admin" && systemModules.length > 0 && (
            <div className="space-y-3 pt-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 border p-3 rounded-md">
                {systemModules.map(mod => (
                  <div key={mod} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`perm-${mod}`} 
                      checked={formData.permissions.includes(mod)}
                      onCheckedChange={(checked) => handlePermissionChange(mod, checked as boolean)}
                    />
                    <label 
                      htmlFor={`perm-${mod}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                    >
                      {mod.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formData.role === "super_admin" && (
            <p className="text-xs text-muted-foreground pt-2">
              Super Admin automatically has access to all modules.
            </p>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
