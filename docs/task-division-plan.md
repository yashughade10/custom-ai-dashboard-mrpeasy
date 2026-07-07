# MRP Easy — Phase 2 Task Division Plan

This document outlines the allocation of work for Phase 2 of the MRP Easy implementation. The workload is distributed evenly across the team, ensuring all developers handle full-stack responsibilities while maintaining focus on specific modules to prevent overlapping work.

---

## 🛠️ Task Allocation

### Ankit
**Focus: Core Architecture, AI Integration, and Core APIs**

1. **Dashboard (Module 1) [✅ Backend APIs COMPLETED]**
   - **APIs:** 
     - `GET /api/dashboard/summary` (Role-aware KPIs)
     - `GET /api/dashboard/widgets`
     - `GET /api/activity-log`
     - Tasks and Calendar CRUD APIs.

2. **Global Search & Auth (Modules 2 & 9) [✅ Backend APIs COMPLETED]**
   - **APIs:**
     - `GET /api/search?q=term` (Cross-entity SQL union)
   - **Middleware:**
     - Implement `auth.js` (JWT) and `checkPermission.js` (RBAC).

3. **AI Engine Integration (Modules 2 & 8) [✅ Backend APIs COMPLETED]**
   - **Implementation:** Extend `openrouter.ts` for AI Lead Scoring, Win Probability, and Natural Language generation for Executive Summary reports.

4. **Selective Email Sending & Tag-based Selection (New Request) [✅ COMPLETED]**
   - **APIs:**
     - `POST /api/email/send-selected` (Accepts an array of user IDs/emails and a template/message to send)
     - `GET /api/contacts/tags` (Fetch available tags for filtering)
   - **UI:**
     - User selection table with checkboxes to selectively send emails.
     - Tag-based filter dropdown to automatically select groups of users based on tags (similar to HubSpot).

---

### Yash
**Focus: DevOps, Financial Workflows, Inventory, and Document Generation**

1. **DevOps & Infrastructure**
   - Manage deployment pipelines and server environments.

2. **Sales Workflow & PDFs (Module 3) [✅ Backend APIs COMPLETED]**
   - **APIs:** 
     - Quotations (`/api/sales/quotations`)
     - Sales Orders (`/api/sales/orders`)
     - PDF Generation endpoints (using `pdfkit` / `puppeteer`).
   - **UI:** 
     - Quotation and Sales Order lists/forms with line-item calculations - completed
     - Sales workflow progress tracking.

3. **Finance (Module 7)**
   - **APIs:**
     - Invoices (`/api/finance/invoices`) + PDF generation.
     - Payments (`/api/finance/payments`)
     - Supplier Bills and Expenses endpoints.
     - Financial reporting endpoints (Outstanding, P&L, Cash Flow).
   - **UI:** 
     - Finance dashboard, Invoice generation views, and P&L charts.

4. **Inventory (Module 5) [✅ Backend APIs COMPLETED]**
   - **APIs:**
     - Warehouses (`/api/inventory/warehouses`)
     - Stock retrieval (`/api/inventory/stock`, `/api/inventory/low-stock`)
     - Stock Movements (`/api/inventory/stock-in`, `stock-out`, `adjustment`).
   - **UI:** 
     - Stock tables, movement history, and low-stock alert views.

5. **CRM Email Automation & Triggers (Module 2E) [✅ Backend APIs COMPLETED]**
   - **APIs:**
     - Email Templates (`/api/email/templates`)
     - Send logic (`/api/email/send`, `send-bulk`)
     - Automation Rules (`/api/email/automation`)
     - Newsletter subscriptions.
   - **UI:** 
     - Email template builder, automation rule configurator, and email history logs.

---

### Gowthami
**Focus: CRM, Production, Procurement, Reports, and Administration**

1. **CRM Enhancements (Module 2 A-D) [✅ COMPLETED]**
   - **APIs:** 
     - Full CRUD for Leads (`/api/crm/leads`), Opportunities (`/api/crm/opportunities`), and Activities (`/api/crm/activities`).
     - Conversion endpoints (`/api/crm/leads/:id/convert`).
   - **UI:** 
     - Interactive Kanban Boards for Leads and Opportunities pipelines (using `@dnd-kit`). [✅ COMPLETED]
     - Activities vertical timeline and inline entity editing. [✅ COMPLETED]
     - Global Search command palette interface (`cmdk`). [✅ COMPLETED]

2. **Production (Module 4) [✅ COMPLETED]**
   - **APIs:**
     - Products (`/api/products`) [✅ COMPLETED]
     - Bill of Materials (`/api/bom`) [✅ COMPLETED]
     - Production Orders (`/api/production/orders`) and Material Consumption. [✅ COMPLETED]
   - **UI:** 
     - Product Master lists. [✅ COMPLETED]
     - Nested tree-view editor for BOM configuration. [✅ COMPLETED]
     - Production progress Kanban board. [✅ COMPLETED]

3. **Procurement (Module 6) [✅ COMPLETED]**
   - **APIs:**
     - Suppliers (`/api/procurement/suppliers`) [✅ COMPLETED]
     - Purchase Orders (`/api/procurement/orders`) [✅ COMPLETED]
     - Goods Receipts (`/api/procurement/goods-receipt`). [✅ COMPLETED]
   - **UI:** 
     - Supplier tables, Purchase Order forms, and Goods Receipt processing UI. [✅ COMPLETED]

4. **Reports & Analytics (Module 8)**
   - **APIs:**
     - Data aggregation endpoints for Sales, Inventory, Production, and Purchase reports (`/api/reports/*`).
   - **UI:** 
     - Interactive charts, data tables, and filtering/export UI for all reports.

5. **Administration (Module 9)**
   - **APIs:**
     - Users, Roles, and Permissions (`/api/admin/*`).
     - Audit Log retrieval (`/api/admin/audit-log`).
   - **UI:** 
     - Role/Permission matrix checkbox grid, Audit log table, and Settings forms.
