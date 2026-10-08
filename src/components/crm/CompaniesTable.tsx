"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCompanies, fetchIndustries, updateCompany } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CompaniesTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCompany(selectedCompany.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast.success("Company updated successfully");
      setIsEditing(false);
      setSelectedCompany(null);
    },
    onError: (error) => {
      toast.error("Failed to update company: " + error.message);
    }
  });

  const handleEdit = () => {
    setEditData({
      name: selectedCompany.name || "",
      industry: selectedCompany.industry || "",
      phone: selectedCompany.phone || "",
    });
    setIsEditing(true);
  };

  const handleEditClick = (e: React.MouseEvent, company: any) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setEditData({
      name: company.name || "",
      industry: company.industry || "",
      phone: company.phone || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["crm-companies", { page, search, industry }],
    queryFn: () => fetchCompanies({ page, search, industry }),
    placeholderData: (previousData) => previousData,
  });

  const { data: industries } = useQuery({ queryKey: ["crm-industry"], queryFn: fetchIndustries });
  
  const companies = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Search name or domain..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select 
          className="flex h-9 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={industry}
          onChange={(e) => {
            setIndustry(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Industries</option>
          {industries?.map((ind: any) => (
            <option key={ind.industry} value={ind.industry}>{ind.industry}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading companies...</TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No companies found.</TableCell>
              </TableRow>
            ) : (
              companies.map((company: any) => (
                <TableRow 
                  key={company.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCompany(company)}
                >
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.domain || "-"}</TableCell>
                  <TableCell>{company.industry || "-"}</TableCell>
                  <TableCell>{company.city || "-"}</TableCell>
                  <TableCell>{company.country || "-"}</TableCell>
                  <TableCell>{company.owner_name || "-"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={(e) => handleEditClick(e, company)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} companies
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selectedCompany && (
        <Dialog open={!!selectedCompany} onOpenChange={(open) => {
          if (!open) {
            setSelectedCompany(null);
            setIsEditing(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Company" : selectedCompany.name}</DialogTitle>
              <DialogDescription>Company details overview</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isEditing ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="industry" className="text-right">Industry</Label>
                    <Input id="industry" value={editData.industry} onChange={(e) => setEditData({...editData, industry: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="col-span-3" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Domain</h4>
                    <p className="text-sm break-all">{selectedCompany.domain || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Industry</h4>
                    <p className="text-sm break-all">{selectedCompany.industry || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <p className="text-sm">{selectedCompany.city ? `${selectedCompany.city}, ` : ''}{selectedCompany.country || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                    <p className="text-sm">{selectedCompany.phone || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Owner</h4>
                    <p className="text-sm">{selectedCompany.owner_name || "Unassigned"}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}>Edit</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
