"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { API_BASE_URL } from "@/services/api";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Eye, EyeOff } from "lucide-react";

// Helper to detect if user pasted raw HTML code into the WYSIWYG
const getFinalHtml = (rawBody: string) => {
  if (typeof document === 'undefined') return rawBody;
  const temp = document.createElement("div");
  temp.innerHTML = rawBody;
  let text = (temp.innerText || temp.textContent || "").trim();
  
  // Quill converts spaces to non-breaking spaces (&nbsp;).
  // This breaks HTML parsers if we try to render it as raw HTML, so we must convert them back to regular spaces.
  text = text.replace(/\u00A0/g, " ");
  
  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html") || text.startsWith("<body") || text.startsWith("<table")) {
    return text; // They pasted raw HTML!
  }
  return rawBody;
};

export default function NewsletterEmailSender() {
  const [loading, setLoading] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  // Template creator state
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  const fetchSegments = () => {
    fetch(`${API_BASE_URL}/email/segments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContactsCount(data.allContactsCount);
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchTemplates = () => {
    fetch(`${API_BASE_URL}/email/templates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTemplates(data.templates);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSegments();
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async () => {
    try {
      const finalHtml = getFinalHtml(newTemplateBody);
      const res = await fetch(`${API_BASE_URL}/email/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          subject: newTemplateSubject,
          html_body: finalHtml,
          plain_text_body: "",
          category: "newsletter"
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTemplateName("");
        setNewTemplateSubject("");
        setNewTemplateBody("");
        fetchTemplates();
        setMessage("Template created successfully!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error creating template.");
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setMessage("");
    try {
      const finalHtml = getFinalHtml(newTemplateBody);
      const res = await fetch(`${API_BASE_URL}/email/send-newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          template_id: selectedTemplate || undefined,
          subject: newTemplateSubject,
          html_body: finalHtml
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        setMessage("Error sending newsletter.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error sending newsletter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Compose Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-500 mb-4">
            Targeting {contactsCount} total contacts.
          </div>
          
          <div className="space-y-2">
            <Label>Start from a Template (Optional)</Label>
            <select 
              className="w-full p-2 border rounded-md text-sm"
              value={selectedTemplate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTemplate(val);
                if (val) {
                  const t = templates.find(t => t.id.toString() === val);
                  if (t) {
                    setNewTemplateName(t.name + " (Copy)");
                    setNewTemplateSubject(t.subject);
                    setNewTemplateBody(t.html_body);
                    setShowPreview(true);
                  }
                } else {
                  setNewTemplateName("");
                  setNewTemplateSubject("");
                  setNewTemplateBody("");
                  setShowPreview(false);
                }
              }}
            >
              <option value="">-- Choose a template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t mt-4">
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
              <div className="border rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[500px]">
                <RichTextEditor 
                  value={newTemplateBody}
                  onChange={setNewTemplateBody}
                  placeholder="Write your template content here, or paste raw developer code..."
                  className="flex-grow"
                />
              </div>
              
              {showPreview && (
                <div className="border rounded-md bg-white shadow-inner flex flex-col h-full min-h-[500px]">
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
                <Button onClick={handleSend} disabled={loading || !newTemplateSubject || !newTemplateBody} className="w-48">
                  {loading ? "Sending..." : "Send Newsletter"}
                </Button>
                <div className="text-sm text-gray-500">
                  Sends exactly what you see in the editor to {contactsCount} contacts.
                </div>
             </div>
             
             <div className="flex items-center gap-4 pt-4 border-t">
                <Input 
                  placeholder="Save as: e.g. My New Template" 
                  value={newTemplateName} 
                  onChange={(e) => setNewTemplateName(e.target.value)} 
                  className="w-64"
                />
                <Button 
                  onClick={handleCreateTemplate} 
                  disabled={!newTemplateName || !newTemplateSubject || !newTemplateBody}
                  variant="outline"
                >
                  Save as Template
                </Button>
             </div>
             
             {message && <div className="text-sm font-medium text-green-600 mt-2">{message}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
