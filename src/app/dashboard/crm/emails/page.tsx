"use client";

import { useState } from "react";
import HotLeadsEmailSender from "@/components/crm/emails/HotLeadsEmailSender";
import NewsletterEmailSender from "@/components/crm/emails/NewsletterEmailSender";
import { Button } from "@/components/ui/button";

export default function CrmEmailsPage() {
  const [activeTab, setActiveTab] = useState<"hotLeads" | "newsletter">("hotLeads");

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Segment your contacts and send targeted emails or newsletters.
          </p>
        </div>
      </div>

      <div className="flex space-x-2 border-b pb-4">
        <Button 
          variant={activeTab === "hotLeads" ? "default" : "outline"} 
          onClick={() => setActiveTab("hotLeads")}
        >
          Hot Leads
        </Button>
        <Button 
          variant={activeTab === "newsletter" ? "default" : "outline"} 
          onClick={() => setActiveTab("newsletter")}
        >
          Newsletter (All Contacts)
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === "hotLeads" && <HotLeadsEmailSender />}
        {activeTab === "newsletter" && <NewsletterEmailSender />}
      </div>
    </div>
  );
}
