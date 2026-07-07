"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserForm } from "./UserForm";

export function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${userToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <Card className="w-full border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-xl font-bold">Users</CardTitle>
          <CardDescription>Manage system access and roles</CardDescription>
        </div>
        <Button onClick={handleAddNew}>Add User</Button>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-4 font-semibold">Name</TableHead>
                <TableHead className="py-4 font-semibold">Email</TableHead>
                <TableHead className="py-4 font-semibold">Role</TableHead>
                <TableHead className="text-right py-4 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium py-3">{user.name}</TableCell>
                  <TableCell className="py-3 text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className="font-medium">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="hover:text-primary hover:bg-primary/10 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user.id)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p>No users found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <UserForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          user={editingUser} 
          onSuccess={fetchUsers} 
        />

        <Dialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={isDeleting}>Cancel</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteUser} disabled={isDeleting}>
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
