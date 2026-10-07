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
  
  // Try to use a style block to force table styling for preview and email
  const styleBlock = `<style>
    table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
    td { width: 50% !important; vertical-align: top !important; padding: 10px !important; }
    img { max-width: 100% !important; height: auto !important; display: block !important; }
  </style>`;

  let text = rawBody.replace(/<[^>]*>?/gm, '').trim();
  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html") || text.startsWith("<body")) {
    return rawBody;
  }
  
  // Inject style block at the top of the body so both preview and email get it
  return styleBlock + rawBody;
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
  const bweTemplateHtml = "<div style=\"font-family: Arial, sans-serif; max-width: 800px; margin: auto; color: #003366; font-size: 14px;\">\n  <!-- Header Banner (Placeholder for background image, can be replaced by user) -->\n  <div style=\"background-color: #002244; padding: 20px; position: relative; height: 160px; color: white; text-align: center;\">\n    <h1 style=\"color: yellow; font-size: 24px; margin: 0; padding-top: 10px;\">BLUEWATER<br>ENGINEERING</h1>\n    <p style=\"font-size: 12px; margin: 10px 0 0 0;\">32 JADE DRIVE, MOLENDINAR</p>\n    <p style=\"color: yellow; font-size: 10px; margin: 5px 0 0 0;\">PRODUCTION@BWENG.COM.AU<br>55976511</p>\n    <p style=\"color: #66ccff; font-weight: bold; font-size: 16px; position: absolute; bottom: 20px; left: 20px; margin: 0;\">Blues News - October 2026 Edition</p>\n  </div>\n  \n  <div style=\"padding: 20px 20px;\">\n    <!-- Breaking News ribbon -->\n    <img src=\"https://dashboard.vacliftaustralia.com/breaking.png\" alt=\"BREAKING NEWS\" style=\"display: block; margin-bottom: 20px;\" />\n    \n    <!-- Text with Links -->\n    <div style=\"margin-bottom: 30px;\">\n      <p style=\"font-size: 16px; margin-bottom: 15px;\">ISO9001:2015 Certification</p>\n      <p style=\"line-height: 1.6; margin-bottom: 15px;\">We are pleased to announce that Bluewater Engineering Group has achieved ISO9001:2015 certification. This milestone reflects the quality standards we have built on since 1982 - across waterjet cutting, CNC machining and fabrication (<a href=\"http://bluewaterengineering.com.au\" style=\"color: #0066cc;\">Bluewaterengineering.com.au</a>) , Design and Manufacture of Vacuum Lifting Equipment (<a href=\"http://vacliftaustralia.com\" style=\"color: #0066cc;\">vacliftaustralia.com</a>) and Precision Pipe Handling and Alignment Attachments (<a href=\"http://pipeboss.com.au\" style=\"color: #0066cc;\">pipeboss.com.au</a>).</p>\n      <p style=\"line-height: 1.6;\">\"It's formal recognition of the consistency and continuous improvement our customers already know us for and a commitment to keep raising the bar.\"</p>\n    </div>\n    \n    <!-- Two Columns Section -->\n    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-bottom: 30px; table-layout: fixed;\">\n      <tr>\n        <!-- Column 1 -->\n        <td width=\"48%\" valign=\"top\" style=\"padding-right: 2%;\">\n          <img src=\"https://dashboard.vacliftaustralia.com/product1.png\" alt=\"Water Jet Cutting\" style=\"width: 100%; height: auto; display: block; margin-bottom: 15px;\" />\n          <p style=\"font-size: 14px; margin: 0 0 15px 0;\">Water Jet Cutting</p>\n          <p style=\"font-weight: bold; margin: 0 0 15px 0; color: #003366;\">3-5 DAY TURNAROUND for most jobs</p>\n          <div style=\"margin-bottom: 20px; text-align: center;\">\n            <a href=\"#\" style=\"background-color: yellow; color: #003366; font-weight: bold; text-decoration: underline; padding: 5px 10px; display: inline-block;\">WATER JET QUOTES</a>\n          </div>\n          <p style=\"font-weight: bold; margin: 0 0 10px 0;\">Why Waterjet?</p>\n          <ul style=\"padding-left: 20px; line-height: 1.4; margin: 0 0 20px 0; font-size: 13px;\">\n            <li>No heat-affected zone — zero material distortion</li>\n            <li>Cuts virtually any material in a single setup</li>\n            <li>Tight tolerances on complex profiles and intricate shapes</li>\n            <li>No tool changes, no cracking, no melting</li>\n            <li>Clean edges that often require no secondary finishing</li>\n            <li>Suitable for materials sensitive to heat, stress or contamination</li>\n          </ul>\n          <p style=\"font-weight: bold; margin: 0 0 10px 0;\">What We Can Cut</p>\n          <ul style=\"padding-left: 20px; line-height: 1.4; margin: 0; font-size: 13px;\">\n            <li>Sheet metal and plate</li>\n            <li>Structural steel and tool steel</li>\n            <li>Stainless steel</li>\n            <li>Aluminium and aluminium alloys</li>\n            <li>Copper, brass and bronze</li>\n            <li>Titanium and exotic alloys</li>\n            <li>Cast iron</li>\n            <li>Stone — granite, marble and slate</li>\n            <li>Ceramics and porcelain tiles</li>\n            <li>Glass — flat and laminated</li>\n            <li>Rubber and gasket material</li>\n            <li>Foam and composite foam</li>\n            <li>Carbon fibre and fibreglass composites</li>\n            <li>Plastics — acrylic, HDPE, nylon, polycarbonate</li>\n            <li>Laminates and sandwich panels</li>\n            <li>Timber and MDF</li>\n          </ul>\n        </td>\n        \n        <!-- Spacer -->\n        <td width=\"4%\"></td>\n        \n        <!-- Column 2 -->\n        <td width=\"48%\" valign=\"top\" style=\"padding-left: 2%;\">\n          <img src=\"https://dashboard.vacliftaustralia.com/product2.png\" alt=\"Vacuum Lifter\" style=\"width: 100%; height: auto; display: block; margin-bottom: 15px;\" />\n          <p style=\"font-size: 14px; margin: 0 0 15px 0;\">VACLIFT-Vacuum Lifters</p>\n          <p style=\"margin: 0 0 15px 0; color: #0066cc;\">3 Year Warranty on all of our Australian Made compressed air and battery vacuum lifters.</p>\n          <div style=\"margin-bottom: 20px; text-align: center;\">\n            <a href=\"#\" style=\"background-color: yellow; color: #003366; font-weight: bold; text-decoration: underline; padding: 5px 10px; display: inline-block;\">VACLIFT® QUOTE</a>\n          </div>\n          <ul style=\"padding-left: 20px; line-height: 1.4; margin: 0 0 20px 0; font-size: 13px; color: #0066cc;\">\n            <li>Compressed air and battery Crane/Jib lifters</li>\n            <li>Forklift units</li>\n            <li>250kg-20 tonne lifting capacity</li>\n            <li>Service and parts department on the Gold Coast</li>\n            <li>Suitable for Metal, Glass, Stone, Composite</li>\n          </ul>\n          <div style=\"margin-bottom: 20px; text-align: center;\">\n            <a href=\"#\" style=\"background-color: #0033cc; color: white; font-weight: bold; text-decoration: underline; padding: 5px 10px; display: inline-block;\">VACLIFT - LEARN MORE</a>\n          </div>\n          <p style=\"margin: 0 0 10px 0;\">Why Vaclift?</p>\n          <ul style=\"padding-left: 20px; line-height: 1.4; margin: 0; font-size: 13px; color: #0066cc;\">\n            <li>Manufactured by Blue Water Engineering Group for over 20 years</li>\n            <li>Used & trusted by some of the largest manufacturers in Australia and overseas</li>\n            <li>All of our units have been tested and comply with Australian Standards AS4991-2004 and the US Standard ASME B30.20-2010</li>\n            <li>Dramatically reduces musculoskeletal injury risks</li>\n            <li>Increases productivity and throughput</li>\n            <li>Extends worker longevity & reduces absenteeism</li>\n            <li>Improves load handling precision and product safety</li>\n            <li>Delivers a strong ROI through reduced workers compensation costs.</li>\n          </ul>\n        </td>\n      </tr>\n    </table>\n  </div>\n</div>".replace(/http:\/\/localhost:3000/g, process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.vacliftaustralia.com');

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
                  if (val === 'bwe-newsletter') {
                      setNewTemplateSubject("Blues News - " + new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) + " Edition");
                      setNewTemplateBody(bweTemplateHtml);
                        setShowPreview(true);
                    } else if (val) {
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
                <option value="bwe-newsletter">BWE Newsletter Template (Built-in)</option>
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
                
                {selectedTemplate === "" ? (
                  <div className="border rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[400px]">
                    <RichTextEditor 
                      value={newTemplateBody}
                      onChange={setNewTemplateBody}
                      placeholder="Write your email content here..."
                      className="flex-grow"
                    />
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden bg-slate-50 shadow-sm flex flex-col h-full min-h-[400px] justify-center items-center text-slate-500 p-8 text-center">
                    <p className="mb-2 font-medium">Using a pre-defined template</p>
                    <p className="text-sm">The content is locked for editing. Please review the final email using the preview panel.</p>
                  </div>
                )}

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
