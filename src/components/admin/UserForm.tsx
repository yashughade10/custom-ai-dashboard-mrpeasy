"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/http";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSuccess: () => void;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User"
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
      if (user) {
        setFormData({ name: user.name || "", email: user.email || "", password: "", role: user.role || "User" });
      } else {
        setFormData({ name: "", email: "", password: "", role: "User" });
      }
    }
  }, [open, user]);

  const fetchRoles = async () => {
    try {
      const res = await apiFetch("http://localhost:4000/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing
        ? `/admin/users/${user.id}`
        : "/admin/users";

      const method = isEditing ? "PUT" : "POST";

      const payload = { ...formData };
      if (isEditing) {
        delete (payload as any).password; // Don't send empty password on edit
        delete (payload as any).email; // Prevent email update for simplicity
      }

      const res = await apiFetch(url, {
        method,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              disabled={isEditing}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.length > 0 ? roles.map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                )) : (
                  <>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

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
