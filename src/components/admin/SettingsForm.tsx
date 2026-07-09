"use client";

import { apiFetch } from "@/lib/api/http";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function SettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("http://localhost:4000/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      
      const formatted: Record<string, string> = {};
      data.forEach((item: any) => {
        try {
          formatted[item.setting_key] = JSON.parse(item.setting_value);
        } catch {
          formatted[item.setting_key] = item.setting_value;
        }
      });
      
      // Default settings if empty
      if (Object.keys(formatted).length === 0) {
        formatted["company_name"] = "MRPEasy Inc.";
        formatted["currency"] = "USD";
        formatted["timezone"] = "UTC";
      }

      setSettings(formatted);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await apiFetch(`http://localhost:4000/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: settings[key] })
      });
      if (!res.ok) throw new Error(`Failed to save ${key}`);
      toast.success("Setting saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const key of Object.keys(settings)) {
        await apiFetch(`http://localhost:4000/api/admin/settings/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: settings[key] })
        });
      }
      toast.success("All settings saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage global configuration for your application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                value={settings["company_name"] || ""} 
                onChange={(e) => handleChange("company_name", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input 
                value={settings["currency"] || ""} 
                onChange={(e) => handleChange("currency", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input 
                value={settings["timezone"] || ""} 
                onChange={(e) => handleChange("timezone", e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4 bg-muted/20">
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save All Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
