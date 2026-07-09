"use client";
import { apiFetch } from "@/lib/api/http";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_BASE_URL } from "@/services/api";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Eye, EyeOff } from "lucide-react";

const getFinalHtml = (rawBody: string) => {
  if (typeof document === 'undefined') return rawBody;
  const temp = document.createElement("div");
  temp.innerHTML = rawBody;
  let text = (temp.innerText || temp.textContent || "").trim();
  text = text.replace(/\u00A0/g, " ");
  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html") || text.startsWith("<body") || text.startsWith("<table")) {
    return text;
  }
  return rawBody;
};

export default function SelectiveEmailSender() {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  useEffect(() => {
    fetchTags();
    fetchTemplates();
    fetchContacts("");
  }, []);

  const fetchTags = () => {
    apiFetch(`${API_BASE_URL}/contacts/tags`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTags(data.tags);
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchContacts = (tagId: string) => {
    const url = tagId 
      ? `${API_BASE_URL}/crm/contacts?tagId=${tagId}&limit=all` 
      : `${API_BASE_URL}/crm/contacts?limit=all`;
    
    apiFetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContacts(data.data);
          // clear selections on filter change
          setSelectedContactIds(new Set());
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchTemplates = () => {
    apiFetch(`${API_BASE_URL}/email/templates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTemplates(data.templates);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = e.target.value;
    setSelectedTag(tagId);
    fetchContacts(tagId);
  };

  const toggleContactSelection = (id: number) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContactIds(newSet);
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = `${c.firstname || ""} ${c.lastname || ""}`.toLowerCase().includes(q);
    const emailMatch = (c.email || "").toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  const toggleAllContacts = () => {
    if (selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setMessage("");
    try {
      const finalHtml = getFinalHtml(newTemplateBody);
      const res = await apiFetch(`${API_BASE_URL}/email/send-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contact_ids: Array.from(selectedContactIds),
          template_id: selectedTemplate || undefined,
          subject: newTemplateSubject,
          html_body: finalHtml
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        setMessage(data.error || "Error sending email.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error sending email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Selective Send & Filtering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4 border-b pb-4">
            <div className="w-full md:w-64 space-y-2">
              <Label>Filter by Tag</Label>
              <select 
                className="w-full p-2 border rounded-md text-sm"
                value={selectedTag}
                onChange={handleTagChange}
              >
                <option value="">All Contacts</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-64 space-y-2">
              <Label>Search</Label>
              <Input 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="pt-6 text-sm text-muted-foreground ml-auto">
              {filteredContacts.length} contacts found. {selectedContactIds.size} selected.
            </div>
          </div>

          <div className="border rounded-md max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <input 
                      type="checkbox" 
                      className="cursor-pointer"
                      checked={selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleAllContacts}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleContactSelection(c.id)}
                  >
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        className="pointer-events-none"
                        checked={selectedContactIds.has(c.id)}
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.firstname} {c.lastname}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>
                      {c.tags && c.tags.length > 0 
                        ? c.tags.map((t: any) => t.name).join(", ") 
                        : <span className="text-muted-foreground italic">None</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No contacts match your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <select 
                className="w-full p-2 border rounded-md text-sm"
                value={selectedTemplate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTemplate(val);
                  if (val) {
                    const t = templates.find(t => t.id.toString() === val);
                    if (t) {
                      setNewTemplateSubject(t.subject);
                      setNewTemplateBody(t.html_body);
                      setShowPreview(true);
                    }
                  } else {
                    setNewTemplateSubject("");
                    setNewTemplateBody("");
                    setShowPreview(false);
                  }
                }}
              >
                <option value="">-- No Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input 
                placeholder="Email Subject" 
                value={newTemplateSubject} 
                onChange={(e) => setNewTemplateSubject(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border">
                <Label className="ml-2">Email Body</Label>
                <Button 
                  variant={showPreview ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-8 gap-2"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
              
              <div className={showPreview ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch" : "block"}>
                <div className="border rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[400px]">
                  <RichTextEditor 
                    value={newTemplateBody}
                    onChange={setNewTemplateBody}
                    placeholder="Write your email content here..."
                    className="flex-grow"
                  />
                </div>
                
                {showPreview && (
                  <div className="border rounded-md bg-white shadow-inner flex flex-col h-full min-h-[400px]">
                    <div className="p-3 border-b bg-muted/50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Preview</span>
                    </div>
                    <div className="flex-grow bg-white p-2">
                      <iframe 
                        title="Email Preview"
                        srcDoc={getFinalHtml(newTemplateBody) || "<p style='color: #888; text-align: center; margin-top: 20px;'>Live preview will appear here...</p>"}
                        className="w-full h-full border-none"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t mt-6 space-y-4">
               <div className="flex items-center gap-4">
                  <Button 
                    onClick={handleSend} 
                    disabled={loading || selectedContactIds.size === 0 || !newTemplateSubject || !newTemplateBody} 
                    className="w-48"
                  >
                    {loading ? "Sending..." : `Send to ${selectedContactIds.size} Selected`}
                  </Button>
               </div>
               {message && <div className={`text-sm font-medium mt-2 ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
