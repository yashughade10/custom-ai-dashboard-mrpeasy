"use client";
import { apiFetch } from "@/lib/api/http";
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

export default function HotLeadsEmailSender() {
  const [loading, setLoading] = useState(false);
  const [hotLeadsCount, setHotLeadsCount] = useState(0);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/email/segments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHotLeadsCount(data.hotLeadsCount);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSend = async () => {
    setLoading(true);
    setMessage("");
    try {
      const finalHtml = getFinalHtml(body);
      const res = await apiFetch(`${API_BASE_URL}/email/send-hot-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html_body: finalHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setSubject("");
        setBody("");
      } else {
        setMessage("Error sending emails.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error sending emails.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send to Hot Leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500 mb-4">
          Targeting {hotLeadsCount} hot leads (added in the last 30 days).
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input 
            id="subject"
            placeholder="Email Subject" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border">
            <Label htmlFor="body" className="ml-2">Email Body</Label>
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
                value={body}
                onChange={setBody}
                placeholder="Write your email content here, or paste raw developer code..."
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
                    srcDoc={getFinalHtml(body) || "<p style='color: #888; text-align: center; margin-top: 20px;'>Live preview will appear here...</p>"}
                    className="w-full h-full border-none"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {message && <div className="text-sm font-medium text-green-600">{message}</div>}

        <Button onClick={handleSend} disabled={loading || !subject || !body}>
          {loading ? "Sending..." : "Send to Hot Leads"}
        </Button>
      </CardContent>
    </Card>
  );
}
