"use client";

import { useState } from "react";
import { Book, Factory, Users2, Package, Search, ChevronRight, FileText, Settings, ListOrdered, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DOCS_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started & Core Concepts",
    icon: Book,
    content: [
      {
        subtitle: "Welcome to Custom AI Dashboard",
        body: "This system is a comprehensive Manufacturing Resource Planning (MRP) and CRM tool built to streamline your entire production lifecycle. It brings together Client Intake, Inventory Management, Production Routing, and Quality Assurance into a single, unified interface.",
      },
      {
        subtitle: "System Architecture",
        body: "The platform is structured into core domains:\n• **CRM (Customer Relationship Management):** Handles Leads, Contacts, Companies, and Quotations.\n• **Job Tracking & QA:** The backbone of the production workflow, connecting a client to their specific build process through custom dynamic forms.\n• **Production & Manufacturing:** Manages Bill of Materials (BOM), Manufacturing Orders (MO), and Workstation Routings.\n• **Inventory & Procurement:** Tracks raw materials, finished goods, Stock Movements, and Purchase Orders.\n• **Analytics & AI:** Provides dashboard metrics, predictive stockout warnings, and AI-driven forecasting.",
      },
      {
        subtitle: "Global Navigation",
        body: "The left sidebar is your primary navigation tool. It is grouped logically by department. The search bar at the top can be used to quickly jump between modules. Note that depending on your role, some administrative sections may be hidden.",
      },
    ]
  },
  {
    id: "job-tracking",
    title: "Job Tracking & Lifecycle",
    icon: FileText,
    content: [
      {
        subtitle: "What is a 'Job'?",
        body: "A 'Job' (e.g., `JOB-2026-0001`) is the central entity tracking a client's custom manufacturing request. It ties together the Client Intake Form, Production Routing, and Quality Assurance (QA) sign-offs in one immutable timeline.",
      },
      {
        subtitle: "The Job Lifecycle (Status Flow)",
        body: "Every job moves through a strict lifecycle:\n1. **Draft:** The initial creation phase. Internal details are added.\n2. **Intake Pending:** An intake form link has been sent to the client.\n3. **Intake Signed:** The client has reviewed and signed the intake form.\n4. **In Production:** The physical manufacturing process has begun.\n5. **QA Pending:** Manufacturing is complete, awaiting final quality checks.\n6. **QA Complete:** Final sign-offs are done.\n7. **Shipped:** The product has been dispatched.",
      },
      {
        subtitle: "Routes & Key Actions",
        body: "• **View All Jobs:** Go to `Inventory (MRP Easy) > Job Tracking` (`/dashboard/mrp/jobs`). Here you can search, filter by status, and filter by priority.\n• **Create a Job:** Click 'New Job' (`/dashboard/mrp/jobs/new`) on the Job Tracking page. You must provide a title and priority.\n• **Job Detail View:** Click on any job to view its full timeline. From this view, you can trigger status transitions using the action buttons at the top right.\n• **Send Client Intake Form:** While a job is in 'Draft', click 'Send Intake Form' to generate a secure, tokenized URL that can be sent to the client for digital signature.",
      },
      {
        subtitle: "Dynamic Forms Engine",
        body: "The system uses a JSON-schema-based engine for all forms (Intake, Production QA, Final QA). This means forms are built dynamically without code changes.\n• **Form Templates:** Go to the Admin section to build new templates using a visual drag-and-drop builder.\n• **Signatures:** All forms support HTML5 canvas-based digital signatures, which are saved securely to the database.",
      }
    ]
  },
  {
    id: "crm",
    title: "CRM & Customers",
    icon: Users2,
    content: [
      {
        subtitle: "Customer Management",
        body: "The CRM module acts as the single source of truth for all external parties.",
      },
      {
        subtitle: "Routes & Actions",
        body: "• **Customers Directory:** Navigate to `Inventory > MRP CRM > Customers` (`/dashboard/mrp/crm/customers`) to view the client database.\n• **Today's Contacts:** View a filtered list of contacts requiring follow-up today (`/dashboard/mrp/crm/today-contacts`).\n• **CRM Statistics:** View high-level metrics on lead conversion and deal velocity (`/dashboard/mrp/crm/statistics`).",
      },
      {
        subtitle: "Quotations to Jobs",
        body: "A Quotation represents a pricing estimate provided to a customer. Once a quotation is marked as 'Approved', it can be seamlessly converted into a Production Job, automatically carrying over client details and product specifications.",
      }
    ]
  },
  {
    id: "production",
    title: "Manufacturing & Production",
    icon: Factory,
    content: [
      {
        subtitle: "Production Operations",
        body: "The Production module tracks the physical assembly of goods, defining *what* is being built and *how* it is built.",
      },
      {
        subtitle: "Routes & Key Actions",
        body: "• **Products Dashboard:** Go to `Inventory > MRP Production > Products` (`/dashboard/mrp/production/products`) to manage your SKU catalog.\n• **Bill of Materials (BOM):** Define the hierarchical structure of a product (`/dashboard/mrp/production/bom`). This specifies exactly which raw materials are needed to assemble a finished good.\n• **Manufacturing Orders (MO):** Track active assembly workflows. An MO reserves stock from inventory and moves items through production stages.\n• **Routings:** Define the sequence of workstation operations required to build a BOM.",
      }
    ]
  },
  {
    id: "inventory",
    title: "Inventory & Procurement",
    icon: Package,
    content: [
      {
        subtitle: "Stock Management",
        body: "The Inventory module maintains real-time quantities of raw materials, sub-assemblies, and finished goods.",
      },
      {
        subtitle: "Routes & Key Actions",
        body: "• **Stock Levels:** Go to `Inventory > MRP Stock` (`/dashboard/mrp/inventory`) to view current on-hand quantities across all warehouses.\n• **Stock Movements:** Every physical change in inventory (Receiving POs, Consuming for MOs, Adjustments) generates an immutable Stock Movement record.\n• **Warehouses:** Manage multiple physical locations and zones within a facility.",
      },
      {
        subtitle: "Procurement",
        body: "• **Suppliers:** Manage vendor details and lead times.\n• **Purchase Orders (POs):** Generate POs when stock falls below reorder points. Approving and Receiving a PO automatically increments the stock levels via a Stock Movement.",
      }
    ]
  },
  {
    id: "analytics",
    title: "Dashboard & AI Analytics",
    icon: Search,
    content: [
      {
        subtitle: "Data-Driven Insights",
        body: "The system provides real-time visibility into the health of your manufacturing operations.",
      },
      {
        subtitle: "Routes & Features",
        body: "• **Main Dashboard:** Navigate to `Inventory > MRP Dashboard` (`/dashboard/mrp/dashboard`) for high-level KPIs, low stock alerts, and active job counts.\n• **AI Chat Assistant:** Accessible via the dashboard, you can ask the AI questions like 'Which products are at risk of a stockout?' or 'Show me the revenue forecast for next month'.\n• **Forecasting:** The system automatically projects future stock levels based on historical consumption rates and pending Purchase/Manufacturing Orders.",
      }
    ]
  }
];

export function DocumentationViewer() {
  const [activeSection, setActiveSection] = useState(DOCS_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const activeContent = DOCS_SECTIONS.find(s => s.id === activeSection);

  const filteredSections = DOCS_SECTIONS.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    section.content.some(c => 
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto min-h-[70vh]">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search documentation..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="space-y-1">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  {section.title}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
            )
          })}
          {filteredSections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {activeContent && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <activeContent.icon className="h-8 w-8 text-blue-600" />
                {activeContent.title}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Complete guide and reference for the {activeContent.title} module.
              </p>
            </div>

            <div className="space-y-6">
              {activeContent.content.map((block, idx) => (
                <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-800">{block.subtitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate max-w-none">
                      {block.body.split('\n').map((paragraph, pIdx) => {
                        const renderFormattedText = (text: string) => {
                          // Handle bold and code.
                          // A simple approach is to split by a regex that captures bold and code
                          const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
                          return parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i} className="text-slate-900 font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('`') && part.endsWith('`')) {
                              return <code key={i} className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
                            }
                            return <span key={i}>{part}</span>;
                          });
                        };

                        const isNumberedList = /^\d+\.\s/.test(paragraph);
                        const isBullet = paragraph.startsWith('• ');

                        if (isBullet || isNumberedList) {
                          const content = isBullet ? paragraph.substring(2) : paragraph.replace(/^\d+\.\s/, '');
                          const prefix = isNumberedList ? paragraph.match(/^\d+\./)?.[0] : null;

                          return (
                            <div key={pIdx} className="flex items-start gap-2 mb-2">
                              {isBullet ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                              ) : (
                                <span className="text-slate-500 font-medium min-w-[20px]">{prefix}</span>
                              )}
                              <p className="m-0 text-slate-600 leading-relaxed">
                                {renderFormattedText(content)}
                              </p>
                            </div>
                          );
                        }
                        
                        return <p key={pIdx} className="text-slate-600 leading-relaxed mb-4">{renderFormattedText(paragraph)}</p>;
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
