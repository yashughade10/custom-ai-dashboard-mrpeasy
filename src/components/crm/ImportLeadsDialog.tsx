"use client";

import { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importCsvLeads } from "@/services/api";
import { toast } from "sonner";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Layers
} from "lucide-react";

interface ParsedLead {
  srNo: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  product: string;
  itemToLift: string;
  company: string;
  city: string;
  country: string;
}

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ImportLeadsDialog({
  open,
  onOpenChange,
  onSuccess
}: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: importCsvLeads,
    onSuccess: (result: any) => {
      const stats = result.data || {};
      const countMsg = `Processed ${stats.total || parsedLeads.length} leads (${stats.inserted || 0} new, ${stats.updated || 0} updated).`;
      toast.success("Import Successful", { description: countMsg });

      // Invalidate contacts & countries queries so leads appear immediately
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contact-countries"] });

      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error("Import Failed", { description: err.message || "Failed to process leads." });
    }
  });

  const handleClose = () => {
    setFileName("");
    setParsedLeads([]);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: "array" });
      const rawJson: any[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetJson = xlsx.utils.sheet_to_json(worksheet, { raw: true });
        const sheetJsonFormatted = xlsx.utils.sheet_to_json(worksheet, { raw: false });

        if (sheetJson && sheetJson.length > 0) {
          for (let i = 0; i < sheetJson.length; i++) {
            const rawRow: any = sheetJson[i];
            rawRow._formattedRow = sheetJsonFormatted[i];
            rawRow._sheetName = sheetName;
            rawJson.push(rawRow);
          }
        }
      }

      if (rawJson.length === 0) {
        throw new Error("The selected file is empty or contains no readable rows.");
      }

      // Map keys dynamically in case of case-mismatch, and ensure dates are handled
      const leads: ParsedLead[] = rawJson.map((row) => {
        const getVal = (keyStr: string) => {
          const foundKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === keyStr.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          return foundKey ? String(row[foundKey] || "").trim() : "";
        };

        const getFormattedVal = (keyStr: string) => {
          if (!row._formattedRow) return "";
          const foundKey = Object.keys(row._formattedRow).find(
            (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === keyStr.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          return foundKey ? String(row._formattedRow[foundKey] || "").trim() : "";
        };

        const dateVal = getVal("date");
        const formattedDateVal = getFormattedVal("date");
        let parsedDate: Date | null = null;
        let isValidDate = false;

        const rawDateNum = row[Object.keys(row).find(k => k.toLowerCase() === "date") || ""];
        if (typeof rawDateNum === "number") {
          // Excel serial date number
          parsedDate = new Date(Math.round((rawDateNum - 25569) * 86400 * 1000));
          isValidDate = true;
        } else {
          const strToParse = typeof dateVal === "string" && dateVal ? dateVal : (formattedDateVal || "");
          if (strToParse) {
            const parts = strToParse.trim().split(/[-/ ]/);
            if (parts.length >= 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              let year = parseInt(parts[2], 10);
              if (year < 100) year += 2000;

              if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                parsedDate = new Date(year, month, day);
                isValidDate = true;
              }
            }

            if (!isValidDate) {
              const fallbackDate = new Date(strToParse);
              if (!isNaN(fallbackDate.getTime())) {
                parsedDate = fallbackDate;
                isValidDate = true;
              }
            }
          }
        }

        if (!parsedDate) parsedDate = new Date();

        return {
          srNo: getVal("srno") || getVal("id") || getVal("sr") || `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: getVal("name") || getVal("fullname") || getVal("contactname") || "",
          email: getVal("email") || getVal("emailaddress") || "",
          phone: getVal("phone") || getVal("mobile") || getVal("phonenumber") || "",
          date: parsedDate.toISOString(),
          product: getVal("product") || getVal("service") || "",
          itemToLift: getVal("itemtolift") || getVal("item_to_lift") || getVal("liftitem") || "",
          company: getVal("company") || getVal("companyname") || getVal("business") || "",
          city: getVal("city") || getVal("suburb") || "",
          country: getVal("country") || ""
        };
      });

      // Filter out entirely empty rows
      const validLeads = leads.filter((l) => l.name || l.email || l.phone || l.company);

      if (validLeads.length === 0) {
        throw new Error("No valid lead rows found. Please ensure headers include name, email, or phone.");
      }

      setParsedLeads(validLeads);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to parse file.");
      setParsedLeads([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "srNo,name,email,phone,date,product,itemToLift,company,city,country\n" +
      "1,John Smith,john.smith@example.com,+61 412 345 678,2026-10-15,Glass Lifter 500kg,Heavy Glass Panels,ABC Glazing Pty Ltd,Sydney,Australia\n" +
      "2,Sarah Jenkins,sarah.j@example.com,+61 498 765 432,2026-10-14,Stone Vacuum Lifter,Granite Slabs,Apex Stonemasonry,Perth,Australia\n" +
      "3,David Lee,david.lee@example.com,+61 411 222 333,2026-10-12,Forklift Attachment,Precast Concrete,Precast Solutions,Melbourne,Australia\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample template (sample_leads_template.csv)");
  };

  const handleImportSubmit = () => {
    if (parsedLeads.length === 0) return;
    importMutation.mutate(parsedLeads);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 gap-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Import Marketing Leads</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Upload CSV or Excel files (.xlsx, .xls) containing leads data to sync into CRM.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              title="Download standard CSV template with headers"
            >
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>
        </DialogHeader>

        {/* Upload Dropzone */}
        {parsedLeads.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Parsing and validating leads file...</p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold mb-1">Click to browse or drag & drop CSV file</h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-3">
                  Supports .csv, .xlsx, and .xls files. Columns: <code className="text-foreground">srNo, name, email, phone, date, product, itemToLift, company, city, country</code>
                </p>
                <Badge variant="secondary" className="text-[11px] font-normal">
                  Auto-detects duplicates & preserves existing records
                </Badge>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-foreground">{fileName}</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px]">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  {parsedLeads.length} leads ready
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setParsedLeads([]);
                  setFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Choose different file
              </Button>
            </div>

            {/* Preview Table */}
            <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Preview (Showing first 5 leads)</span>
              <span>Total rows to import: {parsedLeads.length}</span>
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[260px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email / Phone</TableHead>
                    <TableHead className="text-xs">Company</TableHead>
                    <TableHead className="text-xs">Product & Lifting</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLeads.slice(0, 5).map((l, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground text-[11px]">{l.srNo || idx + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{l.name || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-blue-600 truncate max-w-[140px]">{l.email || "-"}</div>
                          <div className="text-muted-foreground text-[10px]">{l.phone || ""}</div>
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[120px]">{l.company || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 truncate max-w-[140px]">
                          <div>{l.product || "-"}</div>
                          {l.itemToLift && <div className="text-[10px] text-muted-foreground truncate">Lift: {l.itemToLift}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {[l.city, l.country].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Categorized under Marketing CSV leads</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={importMutation.isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImportSubmit}
              disabled={parsedLeads.length === 0 || importMutation.isPending}
              className="text-xs h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importing {parsedLeads.length} leads...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Import {parsedLeads.length > 0 ? `${parsedLeads.length} Leads` : "Leads"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
