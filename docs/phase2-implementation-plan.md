# MRP Easy — Phase 2 Implementation Plan

> **Stack**: Next.js 16 (Frontend) · Express 5 + Node.js (Backend) · TiDB (Database) · Resend (Email) · OpenRouter (AI)
>
> **Scope**: Full ERP build-out — 8 modules over 8 weeks

---

## Table of Contents

1. [Current State & What's Already Built](#current-state)
2. [Module 1 — Dashboard (Role-Based)](#module-1-dashboard)
3. [Module 2 — CRM (Enhanced HubSpot Lite)](#module-2-crm)
4. [Module 3 — Sales](#module-3-sales)
5. [Module 4 — Production](#module-4-production)
6. [Module 5 — Inventory](#module-5-inventory)
7. [Module 6 — Procurement](#module-6-procurement)
8. [Module 7 — Finance](#module-7-finance)
9. [Module 8 — Reports](#module-8-reports)
10. [Module 9 — Administration](#module-9-administration)
11. [Database Schema (All New Tables)](#database-schema)
12. [API Reference (All Endpoints)](#api-reference)
13. [Email Automation (Resend)](#email-automation)
14. [AI Integration (OpenRouter)](#ai-integration)
15. [Timeline & Milestones](#timeline)

---

<a id="current-state"></a>
## 1. Current State & What's Already Built

### Backend (`mrpeasy-vaclift-backend`)
| Component | Status |
|---|---|
| Express app with CORS, JSON parsing | ✅ Done |
| TiDB connection pool (`config/db.js`) | ✅ Done |
| Auth — JWT login with scrypt hashing | ✅ Done |
| Resend email service (`services/emailService.js`) | ✅ Done |
| OpenRouter AI (`services/openrouter.ts`) | ✅ Done |
| CRM — Contacts, Companies, Deals, Owners CRUD | ✅ Done (read-only) |
| CRM Stats / Pipeline / Lifecycle / Industry aggregation | ✅ Done |
| Orders CRUD | ✅ Done |
| Analytics + AI Reports | ✅ Done |
| Event Alerts with dedup + cron | ✅ Done |
| Scheduled Reports (daily/weekly via cron) | ✅ Done |

### Frontend (`custom-ai-dashboard-mrpeasy`)
| Component | Status |
|---|---|
| Next.js 16 + Tailwind 4 + shadcn/ui | ✅ Done |
| Dashboard layout with sidebar | ✅ Done |
| CRM Overview (stats cards + charts) | ✅ Done |
| CRM Contacts table + detail sheet | ✅ Done |
| CRM Companies table | ✅ Done |
| CRM Deals list | ✅ Done |
| AI Analytics page | ✅ Done |
| Orders page | ✅ Done |
| Login page | ✅ Done |

### Database (TiDB)
| Table | Status |
|---|---|
| `users` | ✅ Done |
| `orders` | ✅ Done |
| `contacts` | ✅ Done |
| `companies` | ✅ Done |
| `deals` | ✅ Done |
| `owners` | ✅ Done |
| `associations` | ✅ Done |
| `ai_reports` | ✅ Done |
| `report_email_logs` | ✅ Done |
| `event_alert_logs` | ✅ Done |

### What Needs to Be Built (Phase 2)
- **CRM write operations** — Create/update/delete contacts, companies, deals
- **CRM Leads & Opportunities** — New entities with pipeline/status workflow
- **CRM Activities** — Calls, meetings, tasks, follow-ups with calendar view
- **CRM Email** — Communication history, templates, automated emails via Resend
- **Global Search** — Full-text search across all entities
- **Sales Module** — Quotations, sales orders, customer POs, approvals, PDF generation
- **Production Module** — Products, BOM, production orders, work progress
- **Inventory Module** — Warehouses, stock in/out, adjustments, low-stock alerts
- **Procurement Module** — Suppliers, purchase orders, goods receipt
- **Finance Module** — Invoices, payments, expenses, P&L, cash flow
- **Reports Module** — Cross-module reporting dashboard
- **Administration** — Users, roles, permissions, audit log, settings

---

<a id="module-1-dashboard"></a>
## 2. Module 1 — Dashboard (Role-Based) · ~5 days

### Concept
Upgrade the existing Overview page into a role-aware dashboard. Different roles see different widgets and data scopes.

### Backend

#### New Tables
```sql
-- Roles are stored in the users table (column: role)
-- Possible roles: admin, sales_manager, sales_rep, production_manager, 
--                 warehouse_staff, finance_manager, viewer

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(64) NOT NULL,
  widget_key VARCHAR(64) NOT NULL,       -- e.g. 'sales_summary', 'production_summary'
  position INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  config_json LONGTEXT NULL,
  UNIQUE KEY uq_role_widget (role, widget_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(64) NOT NULL,           -- e.g. 'create', 'update', 'delete'
  entity_type VARCHAR(64) NOT NULL,      -- e.g. 'contact', 'deal', 'order'
  entity_id BIGINT UNSIGNED NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activity_log_user (user_id),
  KEY idx_activity_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  assigned_to BIGINT UNSIGNED NULL,
  due_date DATE NULL,
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  entity_type VARCHAR(64) NULL,
  entity_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tasks_assigned (assigned_to),
  KEY idx_tasks_due (due_date),
  KEY idx_tasks_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  event_type ENUM('meeting','call','task','follow_up','deadline') NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  all_day BOOLEAN DEFAULT FALSE,
  user_id BIGINT UNSIGNED NOT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_calendar_user (user_id),
  KEY idx_calendar_start (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### New API Endpoints
```
GET    /api/dashboard/summary          → role-aware KPI summary
GET    /api/dashboard/widgets          → widget config for user's role
PUT    /api/dashboard/widgets/:id      → update widget visibility/position

GET    /api/activity-log               → paginated recent activities (filterable)

POST   /api/tasks                      → create task
GET    /api/tasks                      → list tasks (filterable by status, assignee, due)
PUT    /api/tasks/:id                  → update task
DELETE /api/tasks/:id                  → delete task

POST   /api/calendar                   → create calendar event
GET    /api/calendar                   → list events (date range + user filter)
PUT    /api/calendar/:id               → update event
DELETE /api/calendar/:id               → delete event
```

#### Backend Files
```
src/
├── routes/dashboardRoutes.js
├── routes/tasksRoutes.js
├── routes/calendarRoutes.js
├── controller/dashboardController.js
├── controller/tasksController.js
├── controller/calendarController.js
├── services/dashboardService.js
├── services/tasksService.js
├── services/calendarService.js
└── middleware/auth.js               ← JWT verification + role extraction
```

### Frontend

#### New Pages & Components
```
src/
├── app/dashboard/
│   └── page.tsx                     ← upgrade existing — role-aware widget grid
├── components/dashboard/
│   ├── SalesSummaryWidget.tsx
│   ├── ProductionSummaryWidget.tsx
│   ├── PendingInvoicesWidget.tsx
│   ├── InventoryAlertsWidget.tsx
│   ├── TasksWidget.tsx
│   ├── CalendarWidget.tsx           ← mini monthly calendar
│   └── RecentActivityWidget.tsx
```

#### UI Behavior
- On login, fetch `/api/dashboard/summary` and `/api/dashboard/widgets`
- Render a dynamic grid based on role — admin sees everything, sales_rep sees CRM + sales widgets only
- Tasks widget shows upcoming due items with quick-complete button
- Calendar widget shows the next 7 days with event count badges
- Recent Activity shows last 20 actions across the system

---

<a id="module-2-crm"></a>
## 3. Module 2 — CRM (Enhanced) · ~15 days

### What Exists
- Read-only views for contacts, companies, deals
- Stats, charts, pipeline view

### What to Build

#### 2A. CRUD Operations for Contacts, Companies, Deals

##### New API Endpoints
```
POST   /api/crm/contacts              → create contact
PUT    /api/crm/contacts/:id           → update contact
DELETE /api/crm/contacts/:id           → soft-delete contact

POST   /api/crm/companies             → create company
PUT    /api/crm/companies/:id          → update company
DELETE /api/crm/companies/:id          → soft-delete company

POST   /api/crm/deals                 → create deal
PUT    /api/crm/deals/:id             → update deal (stage change triggers activity log)
DELETE /api/crm/deals/:id             → soft-delete deal
```

##### Frontend
- Add "New Contact", "New Company", "New Deal" buttons → open slide-out form panels
- Inline edit support on table rows
- Delete with confirmation dialog
- Bulk actions (select multiple → delete, assign owner, change status)

---

#### 2B. Leads

##### New Tables
```sql
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(191) NOT NULL,
  last_name VARCHAR(191) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(191) NULL,
  company_name VARCHAR(191) NULL,
  source ENUM('website','referral','cold_call','trade_show','social_media','other') DEFAULT 'other',
  status ENUM('new','contacted','qualified','unqualified','converted') DEFAULT 'new',
  score INT DEFAULT 0,                      -- lead scoring (0-100)
  assigned_to BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  converted_contact_id BIGINT UNSIGNED NULL, -- set when converted
  converted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_leads_status (status),
  KEY idx_leads_assigned (assigned_to),
  KEY idx_leads_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### API Endpoints
```
POST   /api/crm/leads                 → create lead
GET    /api/crm/leads                 → list leads (filterable by status, source, assignee)
GET    /api/crm/leads/:id             → get lead details
PUT    /api/crm/leads/:id             → update lead
DELETE /api/crm/leads/:id             → delete lead
POST   /api/crm/leads/:id/convert     → convert lead to contact + optional company & deal
```

##### Convert Flow (Backend Logic)
1. Create a new `contact` from lead fields
2. Optionally create a `company` if `company_name` is provided and doesn't exist
3. Optionally create a `deal` (first stage of default pipeline)
4. Create `associations` between contact ↔ company ↔ deal
5. Update lead: set `status='converted'`, `converted_contact_id`, `converted_at`
6. Log to `activity_log`

##### Frontend
```
src/
├── app/dashboard/crm/leads/
│   └── page.tsx                     ← leads list with status filters + kanban view
├── components/crm/
│   ├── LeadsTable.tsx
│   ├── LeadDetailSheet.tsx
│   ├── LeadConvertDialog.tsx        ← conversion wizard
│   └── LeadKanbanBoard.tsx          ← drag status columns
```

---

#### 2C. Opportunities

##### New Tables
```sql
CREATE TABLE IF NOT EXISTS opportunities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  deal_id BIGINT UNSIGNED NULL,
  stage ENUM('prospecting','qualification','proposal','negotiation','closed_won','closed_lost') DEFAULT 'prospecting',
  probability INT DEFAULT 0,             -- 0-100%
  expected_value DECIMAL(15,2) DEFAULT 0.00,
  expected_close_date DATE NULL,
  actual_close_date DATE NULL,
  win_reason TEXT NULL,
  loss_reason TEXT NULL,
  assigned_to BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_opp_stage (stage),
  KEY idx_opp_contact (contact_id),
  KEY idx_opp_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### API Endpoints
```
POST   /api/crm/opportunities         → create opportunity
GET    /api/crm/opportunities          → list (filterable by stage, assignee)
GET    /api/crm/opportunities/:id      → get opportunity details
PUT    /api/crm/opportunities/:id      → update (stage change → log activity)
DELETE /api/crm/opportunities/:id      → delete opportunity
GET    /api/crm/opportunities/pipeline → pipeline summary grouped by stage
```

##### Frontend
```
src/
├── app/dashboard/crm/opportunities/
│   └── page.tsx
├── components/crm/
│   ├── OpportunitiesTable.tsx
│   ├── OpportunityDetailSheet.tsx
│   ├── OpportunityPipeline.tsx     ← kanban-style pipeline view
│   └── WinLossDialog.tsx           ← capture reason when closing
```

---

#### 2D. Activities (Calls, Meetings, Tasks, Follow-ups)

##### New Tables
```sql
CREATE TABLE IF NOT EXISTS crm_activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_type ENUM('call','meeting','task','follow_up') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  due_date DATETIME NULL,
  completed_at DATETIME NULL,
  duration_minutes INT NULL,
  outcome TEXT NULL,
  contact_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  deal_id BIGINT UNSIGNED NULL,
  lead_id BIGINT UNSIGNED NULL,
  assigned_to BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_crm_act_type (activity_type),
  KEY idx_crm_act_status (status),
  KEY idx_crm_act_contact (contact_id),
  KEY idx_crm_act_due (due_date),
  KEY idx_crm_act_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### API Endpoints
```
POST   /api/crm/activities             → create activity
GET    /api/crm/activities             → list (filterable by type, status, contact, date range)
GET    /api/crm/activities/:id         → get activity details
PUT    /api/crm/activities/:id         → update activity
DELETE /api/crm/activities/:id         → delete activity

GET    /api/crm/activities/by-contact/:contactId → all activities for a contact
GET    /api/crm/activities/by-deal/:dealId       → all activities for a deal
GET    /api/crm/activities/calendar    → calendar view (date range → events)
```

##### Frontend
```
src/
├── app/dashboard/crm/activities/
│   └── page.tsx
├── components/crm/
│   ├── ActivitiesTimeline.tsx       ← vertical timeline of activities
│   ├── ActivityForm.tsx             ← create/edit form (reused in sheets)
│   ├── ActivityCalendarView.tsx     ← month/week/day calendar
│   └── ActivityFilters.tsx
```

---

#### 2E. CRM Email (Resend Integration)

##### New Tables
```sql
CREATE TABLE IF NOT EXISTS email_templates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_body LONGTEXT NOT NULL,
  plain_text_body TEXT NULL,
  category ENUM('general','lead_nurture','newsletter','follow_up','notification') DEFAULT 'general',
  variables_json LONGTEXT NULL,          -- list of merge fields e.g. ["first_name", "company"]
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NULL,
  to_email VARCHAR(191) NOT NULL,
  to_name VARCHAR(191) NULL,
  contact_id BIGINT UNSIGNED NULL,
  lead_id BIGINT UNSIGNED NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('queued','sent','delivered','bounced','failed') DEFAULT 'queued',
  resend_message_id VARCHAR(255) NULL,
  error_message TEXT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email_log_contact (contact_id),
  KEY idx_email_log_status (status),
  KEY idx_email_log_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_automation_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  trigger_type ENUM('lead_status_change','lead_score_threshold','new_lead','deal_stage_change','scheduled') NOT NULL,
  trigger_config_json LONGTEXT NOT NULL,    -- e.g. {"from_status":"new","to_status":"contacted"}
  template_id BIGINT UNSIGNED NOT NULL,
  delay_minutes INT DEFAULT 0,              -- delay before sending
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_automation_trigger (trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  name VARCHAR(191) NULL,
  contact_id BIGINT UNSIGNED NULL,
  subscribed BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### API Endpoints
```
# Email Templates
POST   /api/email/templates            → create template
GET    /api/email/templates            → list templates
GET    /api/email/templates/:id        → get template
PUT    /api/email/templates/:id        → update template
DELETE /api/email/templates/:id        → delete template

# Send Emails
POST   /api/email/send                 → send single email (manual, from CRM)
POST   /api/email/send-bulk            → send to multiple contacts/leads (uses template)
GET    /api/email/log                  → email history (filterable by contact, status)
GET    /api/email/log/by-contact/:id   → emails for a specific contact

# Automation Rules
POST   /api/email/automation           → create automation rule
GET    /api/email/automation           → list rules
PUT    /api/email/automation/:id       → update rule
DELETE /api/email/automation/:id       → delete rule

# Newsletter
POST   /api/email/newsletter/send      → send newsletter to all subscribers
GET    /api/email/newsletter/subscribers → list subscribers
POST   /api/email/newsletter/subscribe → add subscriber
POST   /api/email/newsletter/unsubscribe → unsubscribe
```

##### Backend Logic — Automated Emails
```
src/
├── services/
│   ├── emailTemplateService.js      ← template CRUD + merge-field substitution
│   ├── emailAutomationService.js    ← trigger engine (listens to entity changes)
│   ├── newsletterService.js         ← newsletter sending with Resend batch API
│   └── emailService.js              ← (existing) extend with template rendering
├── jobs/
│   └── emailAutomationJob.js        ← cron to check pending automated emails
```

**Automation Trigger Flow:**
1. When a lead status changes → check `email_automation_rules` for matching `trigger_type='lead_status_change'`
2. If match found → resolve template, merge contact fields, insert into `email_log` with `status='queued'`
3. Cron job picks up queued emails after `delay_minutes` has elapsed → sends via Resend → updates status

**Hot Lead Auto-Email:**
- Rule: `trigger_type='lead_score_threshold'`, `trigger_config={"min_score": 80}`
- When lead score is updated and crosses threshold → send the assigned template

**Newsletter:**
- Use Resend's batch API to send to all active `newsletter_subscribers`
- Track delivery status via Resend webhooks (optional, can start with polling)

##### Frontend
```
src/
├── app/dashboard/crm/emails/
│   └── page.tsx                     ← email history + compose
├── components/crm/
│   ├── EmailComposer.tsx            ← rich text compose with template selection
│   ├── EmailHistory.tsx             ← communication log per contact
│   ├── EmailTemplateEditor.tsx      ← template builder with merge fields
│   ├── EmailAutomationRules.tsx     ← manage automation rules
│   └── NewsletterManager.tsx        ← subscriber list + send newsletter
```

---

#### 2F. Global Search

##### API Endpoint
```
GET /api/search?q=term&types=contacts,companies,deals,leads
```

##### Backend Logic
```sql
-- Union search across all entity tables
(SELECT 'contact' AS type, id, CONCAT(firstname, ' ', lastname) AS name, email AS detail 
 FROM contacts WHERE firstname LIKE ? OR lastname LIKE ? OR email LIKE ?)
UNION ALL
(SELECT 'company' AS type, id, name, domain AS detail 
 FROM companies WHERE name LIKE ? OR domain LIKE ?)
UNION ALL
(SELECT 'deal' AS type, id, dealname AS name, CAST(amount AS CHAR) AS detail 
 FROM deals WHERE dealname LIKE ?)
UNION ALL
(SELECT 'lead' AS type, id, CONCAT(first_name, ' ', last_name) AS name, email AS detail 
 FROM leads WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
ORDER BY name LIMIT 20
```

##### Frontend
- Command palette (Cmd+K) with search results grouped by type
- Each result links to the entity detail page
- Recent searches stored in localStorage

```
src/
├── components/common/
│   └── GlobalSearch.tsx             ← command palette overlay
```

---

<a id="module-3-sales"></a>
## 4. Module 3 — Sales · ~10 days

### New Tables
```sql
CREATE TABLE IF NOT EXISTS quotations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_number VARCHAR(64) NOT NULL,      -- auto-generated: QT-YYYY-NNNN
  contact_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  deal_id BIGINT UNSIGNED NULL,
  status ENUM('draft','sent','accepted','rejected','expired') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'AUD',
  valid_until DATE NULL,
  notes TEXT NULL,
  terms TEXT NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quote_number (quote_number),
  KEY idx_quotation_status (status),
  KEY idx_quotation_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotation_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quotation_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount_pct DECIMAL(5,2) DEFAULT 0.00,
  tax_pct DECIMAL(5,2) DEFAULT 0.00,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  KEY idx_qi_quotation (quotation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL,      -- auto-generated: SO-YYYY-NNNN
  quotation_id BIGINT UNSIGNED NULL,      -- link to source quotation
  contact_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  customer_po VARCHAR(191) NULL,          -- customer's purchase order number
  status ENUM('draft','confirmed','in_production','shipped','delivered','cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'AUD',
  delivery_date DATE NULL,
  shipping_address TEXT NULL,
  notes TEXT NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_so_number (order_number),
  KEY idx_so_status (status),
  KEY idx_so_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount_pct DECIMAL(5,2) DEFAULT 0.00,
  tax_pct DECIMAL(5,2) DEFAULT 0.00,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  KEY idx_soi_order (sales_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Sales Workflow
```
Lead → Quotation → Sales Order → Production Order → Invoice
```

### API Endpoints
```
# Quotations
POST   /api/sales/quotations           → create quotation
GET    /api/sales/quotations           → list (filterable by status, date range)
GET    /api/sales/quotations/:id       → get quotation with items
PUT    /api/sales/quotations/:id       → update quotation
DELETE /api/sales/quotations/:id       → delete (only if draft)
POST   /api/sales/quotations/:id/send  → mark as sent + email PDF to customer via Resend
POST   /api/sales/quotations/:id/approve → approve quotation
POST   /api/sales/quotations/:id/convert → convert quotation → sales order
GET    /api/sales/quotations/:id/pdf   → generate PDF

# Sales Orders
POST   /api/sales/orders               → create sales order
GET    /api/sales/orders               → list (filterable)
GET    /api/sales/orders/:id           → get sales order with items
PUT    /api/sales/orders/:id           → update sales order
DELETE /api/sales/orders/:id           → delete (only if draft)
POST   /api/sales/orders/:id/confirm   → confirm → create production order
POST   /api/sales/orders/:id/approve   → approval workflow
GET    /api/sales/orders/:id/pdf       → generate PDF
```

### PDF Generation (Backend)
Use a lightweight library (`pdfkit` or `puppeteer` for HTML → PDF) to render quotations and sales orders as branded PDFs.

```
npm install pdfkit
```

```
src/
├── services/pdfService.js           ← generate PDF from template + data
├── templates/
│   ├── quotation.html               ← quotation PDF template
│   └── sales-order.html             ← sales order PDF template
```

### Frontend
```
src/
├── app/dashboard/sales/
│   ├── page.tsx                     ← sales overview
│   ├── quotations/
│   │   └── page.tsx                 ← quotations list
│   ├── orders/
│   │   └── page.tsx                 ← sales orders list
│   └── [id]/
│       └── page.tsx                 ← quotation/order detail view
├── components/sales/
│   ├── QuotationForm.tsx            ← line items editor with totals
│   ├── QuotationTable.tsx
│   ├── SalesOrderForm.tsx
│   ├── SalesOrderTable.tsx
│   ├── LineItemsEditor.tsx          ← reusable add/remove line items
│   ├── ApprovalBadge.tsx
│   └── SalesWorkflowSteps.tsx       ← visual workflow indicator
```

---

<a id="module-4-production"></a>
## 5. Module 4 — Production · ~15 days

### New Tables
```sql
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category VARCHAR(191) NULL,
  unit VARCHAR(32) DEFAULT 'pcs',         -- pcs, kg, m, etc.
  unit_cost DECIMAL(15,2) DEFAULT 0.00,
  selling_price DECIMAL(15,2) DEFAULT 0.00,
  is_raw_material BOOLEAN DEFAULT FALSE,
  is_finished_good BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_sku (sku),
  KEY idx_product_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bill_of_materials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  finished_product_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_bom_product (finished_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bom_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bom_id BIGINT UNSIGNED NOT NULL,
  raw_material_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit VARCHAR(32) DEFAULT 'pcs',
  waste_pct DECIMAL(5,2) DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  KEY idx_bom_items_bom (bom_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS production_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(64) NOT NULL,         -- auto: PO-YYYY-NNNN
  sales_order_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  bom_id BIGINT UNSIGNED NULL,
  quantity DECIMAL(15,4) NOT NULL,
  status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  assigned_to BIGINT UNSIGNED NULL,
  start_date DATE NULL,
  due_date DATE NULL,
  completed_date DATE NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_po_number (po_number),
  KEY idx_po_status (status),
  KEY idx_po_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS material_consumption (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_id BIGINT UNSIGNED NOT NULL,
  raw_material_id BIGINT UNSIGNED NOT NULL,
  quantity_consumed DECIMAL(15,4) NOT NULL,
  warehouse_id BIGINT UNSIGNED NULL,
  consumed_by BIGINT UNSIGNED NOT NULL,
  consumed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mc_po (production_order_id),
  KEY idx_mc_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### API Endpoints
```
# Products
POST   /api/products                   → create product
GET    /api/products                   → list (filterable by category, type)
GET    /api/products/:id               → get product details
PUT    /api/products/:id               → update product
DELETE /api/products/:id               → soft-delete

# BOM
POST   /api/bom                        → create BOM for a product
GET    /api/bom                        → list all BOMs
GET    /api/bom/:id                    → get BOM with items
GET    /api/bom/by-product/:productId  → get BOM for a product
PUT    /api/bom/:id                    → update BOM
DELETE /api/bom/:id                    → delete BOM

# Production Orders
POST   /api/production/orders          → create production order
GET    /api/production/orders          → list (filterable by status, assignee, date)
GET    /api/production/orders/:id      → get PO with material consumption
PUT    /api/production/orders/:id      → update PO (status change)
POST   /api/production/orders/:id/start      → start production
POST   /api/production/orders/:id/complete   → complete → receive finished goods into inventory
POST   /api/production/orders/:id/consume    → log material consumption

# Work Progress
GET    /api/production/progress        → overview: pending/in_progress/completed counts
```

### Frontend
```
src/
├── app/dashboard/production/
│   ├── page.tsx                     ← production overview (progress board)
│   ├── products/
│   │   └── page.tsx                 ← product master list
│   ├── bom/
│   │   └── page.tsx                 ← BOM list + editor
│   └── orders/
│       └── page.tsx                 ← production orders
├── components/production/
│   ├── ProductForm.tsx
│   ├── ProductsTable.tsx
│   ├── BomEditor.tsx                ← tree view of BOM items
│   ├── ProductionOrderForm.tsx
│   ├── ProductionOrdersTable.tsx
│   ├── ProductionKanban.tsx         ← Pending | In Progress | Completed
│   ├── MaterialConsumptionForm.tsx
│   └── WorkProgressCards.tsx
```

---

<a id="module-5-inventory"></a>
## 6. Module 5 — Inventory · ~8 days

### New Tables
```sql
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  location VARCHAR(255) NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(15,4) DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inv_product_wh (product_id, warehouse_id),
  KEY idx_inv_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('stock_in','stock_out','adjustment','transfer','production_consume','production_receive') NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,        -- positive for in, negative for out
  reference_type VARCHAR(64) NULL,        -- e.g. 'purchase_order', 'sales_order', 'production_order'
  reference_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sm_product (product_id),
  KEY idx_sm_warehouse (warehouse_id),
  KEY idx_sm_type (movement_type),
  KEY idx_sm_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### API Endpoints
```
# Warehouses
POST   /api/inventory/warehouses       → create warehouse
GET    /api/inventory/warehouses       → list warehouses
PUT    /api/inventory/warehouses/:id   → update warehouse
DELETE /api/inventory/warehouses/:id   → delete (only if no stock)

# Inventory
GET    /api/inventory/stock            → current stock (filterable by warehouse, product, category)
GET    /api/inventory/stock/:productId → stock for a specific product across warehouses
GET    /api/inventory/low-stock        → products below reorder level

# Stock Movements
POST   /api/inventory/stock-in         → stock in (from purchase or manual)
POST   /api/inventory/stock-out        → stock out (for sales or manual)
POST   /api/inventory/adjustment       → stock adjustment (correct quantity)
GET    /api/inventory/history          → stock movement history (filterable)
GET    /api/inventory/history/:productId → history for a specific product
```

### Inventory Alert Integration
Extend existing `eventAlertsService.js` to include low-stock alerts:
- Check `inventory` table for items where `quantity <= reorder_level`
- Send Resend email alert to warehouse_staff and admin
- Dedup using existing `event_alert_logs`

### Frontend
```
src/
├── app/dashboard/inventory/
│   ├── page.tsx                     ← inventory overview + low-stock alerts
│   ├── warehouses/
│   │   └── page.tsx
│   └── history/
│       └── page.tsx                 ← stock movement history
├── components/inventory/
│   ├── StockTable.tsx               ← current stock with warehouse filter
│   ├── LowStockAlert.tsx            ← highlighted low-stock items
│   ├── StockMovementForm.tsx        ← stock in/out/adjustment form
│   ├── StockHistoryTable.tsx
│   └── WarehouseForm.tsx
```

---

<a id="module-6-procurement"></a>
## 7. Module 6 — Procurement · ~5 days

### New Tables
```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  contact_person VARCHAR(191) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(191) NULL,
  address TEXT NULL,
  city VARCHAR(191) NULL,
  country VARCHAR(191) NULL,
  payment_terms VARCHAR(191) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(64) NOT NULL,         -- auto: PUR-YYYY-NNNN
  supplier_id BIGINT UNSIGNED NOT NULL,
  status ENUM('draft','sent','partial_received','received','cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'AUD',
  expected_delivery DATE NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pur_number (po_number),
  KEY idx_pur_status (status),
  KEY idx_pur_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity_ordered DECIMAL(15,4) NOT NULL,
  quantity_received DECIMAL(15,4) DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  KEY idx_poi_po (purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goods_receipts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  receipt_number VARCHAR(64) NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  received_by BIGINT UNSIGNED NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  UNIQUE KEY uq_gr_number (receipt_number),
  KEY idx_gr_po (purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  goods_receipt_id BIGINT UNSIGNED NOT NULL,
  purchase_order_item_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity_received DECIMAL(15,4) NOT NULL,
  KEY idx_gri_gr (goods_receipt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### API Endpoints
```
# Suppliers
POST   /api/procurement/suppliers      → create supplier
GET    /api/procurement/suppliers      → list suppliers
GET    /api/procurement/suppliers/:id  → get supplier with purchase history
PUT    /api/procurement/suppliers/:id  → update
DELETE /api/procurement/suppliers/:id  → soft-delete

# Purchase Orders
POST   /api/procurement/orders         → create PO
GET    /api/procurement/orders         → list (filterable)
GET    /api/procurement/orders/:id     → get PO with items
PUT    /api/procurement/orders/:id     → update PO
POST   /api/procurement/orders/:id/send → send PO to supplier via Resend email

# Goods Receipt
POST   /api/procurement/goods-receipt  → receive goods → updates inventory + PO status
GET    /api/procurement/goods-receipt/:poId → receipts for a PO
```

### Frontend
```
src/
├── app/dashboard/procurement/
│   ├── page.tsx                     ← procurement overview
│   ├── suppliers/
│   │   └── page.tsx
│   └── orders/
│       └── page.tsx                 ← purchase orders
├── components/procurement/
│   ├── SupplierForm.tsx
│   ├── SuppliersTable.tsx
│   ├── PurchaseOrderForm.tsx
│   ├── PurchaseOrderTable.tsx
│   └── GoodsReceiptForm.tsx         ← receive against PO items
```

---

<a id="module-7-finance"></a>
## 8. Module 7 — Finance · ~10 days

### New Tables
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL,
  sales_order_id BIGINT UNSIGNED NULL,
  contact_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  status ENUM('draft','sent','partially_paid','paid','overdue','cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  amount_paid DECIMAL(15,2) DEFAULT 0.00,
  balance_due DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'AUD',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_number (invoice_number),
  KEY idx_inv_status (status),
  KEY idx_inv_due (due_date),
  KEY idx_inv_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_pct DECIMAL(5,2) DEFAULT 0.00,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT DEFAULT 0,
  KEY idx_ii_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(64) NOT NULL,
  invoice_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('bank_transfer','cash','cheque','card','other') DEFAULT 'bank_transfer',
  payment_date DATE NOT NULL,
  reference VARCHAR(191) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_number (payment_number),
  KEY idx_payment_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS supplier_bills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_number VARCHAR(64) NOT NULL,
  purchase_order_id BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  status ENUM('draft','pending','partially_paid','paid','overdue') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total DECIMAL(15,2) DEFAULT 0.00,
  amount_paid DECIMAL(15,2) DEFAULT 0.00,
  balance_due DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'AUD',
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bill_number (bill_number),
  KEY idx_bill_status (status),
  KEY idx_bill_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category ENUM('rent','utilities','salaries','materials','marketing','travel','maintenance','other') NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'AUD',
  expense_date DATE NOT NULL,
  payment_method ENUM('bank_transfer','cash','cheque','card','other') DEFAULT 'bank_transfer',
  receipt_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_expense_category (category),
  KEY idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### API Endpoints
```
# Invoices
POST   /api/finance/invoices           → create invoice (optionally from sales order)
GET    /api/finance/invoices           → list (filterable by status, date range)
GET    /api/finance/invoices/:id       → get invoice with items + payments
PUT    /api/finance/invoices/:id       → update invoice
POST   /api/finance/invoices/:id/send  → email invoice PDF to customer via Resend
GET    /api/finance/invoices/:id/pdf   → generate invoice PDF

# Payments
POST   /api/finance/payments           → record payment → update invoice balance
GET    /api/finance/payments           → list all payments

# Supplier Bills
POST   /api/finance/bills              → create bill (optionally from PO)
GET    /api/finance/bills              → list bills
PUT    /api/finance/bills/:id          → update
POST   /api/finance/bills/:id/pay      → record payment against bill

# Expenses
POST   /api/finance/expenses           → create expense
GET    /api/finance/expenses           → list (filterable by category, date range)
PUT    /api/finance/expenses/:id       → update
DELETE /api/finance/expenses/:id       → delete

# Reports
GET    /api/finance/outstanding        → receivables + payables summary
GET    /api/finance/pnl                → profit & loss (date range)
GET    /api/finance/cashflow           → cash flow summary (date range)
GET    /api/finance/export/excel       → export financial data as Excel/CSV
```

### Frontend
```
src/
├── app/dashboard/finance/
│   ├── page.tsx                     ← finance overview (outstanding, P&L chart)
│   ├── invoices/
│   │   └── page.tsx
│   ├── payments/
│   │   └── page.tsx
│   ├── bills/
│   │   └── page.tsx
│   ├── expenses/
│   │   └── page.tsx
│   └── reports/
│       └── page.tsx                 ← P&L, cash flow charts
├── components/finance/
│   ├── InvoiceForm.tsx
│   ├── InvoiceTable.tsx
│   ├── PaymentForm.tsx
│   ├── BillForm.tsx
│   ├── BillTable.tsx
│   ├── ExpenseForm.tsx
│   ├── ExpenseTable.tsx
│   ├── OutstandingCards.tsx          ← receivables + payables cards
│   ├── PnLChart.tsx
│   └── CashFlowChart.tsx
```

### Overdue Invoice Alerts (Resend)
Extend `eventAlertsService.js`:
- Check invoices where `due_date < NOW()` and `status NOT IN ('paid','cancelled')`
- Send email reminder to the customer and notify admin
- Dedup using `event_alert_logs`

---

<a id="module-8-reports"></a>
## 9. Module 8 — Reports · ~5 days

### API Endpoints
```
GET /api/reports/sales               → sales reports (revenue by period, by product, by customer)
GET /api/reports/inventory            → inventory reports (stock levels, turnover, valuation)
GET /api/reports/production           → production reports (orders by status, lead time, efficiency)
GET /api/reports/purchase             → purchase reports (spend by supplier, by category)
GET /api/reports/receivables          → aging receivables report
GET /api/reports/payables             → aging payables report
GET /api/reports/dashboard            → combined executive summary
GET /api/reports/export/:type         → export any report as CSV/Excel
```

### AI-Powered Reports (OpenRouter)
Extend the existing `ai-report-engine.ts`:
- Add report generators for each module
- Use OpenRouter to generate natural language insights, trends, and recommendations
- Auto-schedule weekly executive summary via existing cron system

### Frontend
```
src/
├── app/dashboard/reports/
│   ├── page.tsx                     ← report selection hub
│   ├── sales/
│   │   └── page.tsx
│   ├── inventory/
│   │   └── page.tsx
│   ├── production/
│   │   └── page.tsx
│   └── finance/
│       └── page.tsx
├── components/reports/
│   ├── ReportFilters.tsx            ← date range, grouping, export buttons
│   ├── SalesReport.tsx
│   ├── InventoryReport.tsx
│   ├── ProductionReport.tsx
│   └── FinanceReport.tsx
```

---

<a id="module-9-administration"></a>
## 10. Module 9 — Administration · ~5 days

### New / Updated Tables
```sql
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT NULL,
  is_system BOOLEAN DEFAULT FALSE,       -- system roles can't be deleted
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT UNSIGNED NOT NULL,
  module VARCHAR(64) NOT NULL,           -- e.g. 'crm', 'sales', 'production'
  action VARCHAR(32) NOT NULL,           -- e.g. 'read', 'create', 'update', 'delete'
  is_allowed BOOLEAN DEFAULT TRUE,
  UNIQUE KEY uq_perm (role_id, module, action),
  KEY idx_perm_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  old_values LONGTEXT NULL,              -- JSON of changed fields (before)
  new_values LONGTEXT NULL,              -- JSON of changed fields (after)
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_user (user_id),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS app_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(191) NOT NULL,
  setting_value LONGTEXT NULL,
  description VARCHAR(255) NULL,
  UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### API Endpoints
```
# Users
POST   /api/admin/users               → create user (admin only)
GET    /api/admin/users               → list users
PUT    /api/admin/users/:id           → update user (role, status)
DELETE /api/admin/users/:id           → deactivate user

# Roles & Permissions
POST   /api/admin/roles               → create role
GET    /api/admin/roles               → list roles with permissions
PUT    /api/admin/roles/:id           → update role
DELETE /api/admin/roles/:id           → delete role (non-system only)
PUT    /api/admin/roles/:id/permissions → bulk update permissions

# Audit Log
GET    /api/admin/audit-log           → paginated (filterable by user, entity, date)

# Settings
GET    /api/admin/settings            → list all settings
PUT    /api/admin/settings/:key       → update setting
```

### Middleware — Permission Check
```js
// src/middleware/checkPermission.js
function checkPermission(module, action) {
  return async (req, res, next) => {
    const userRole = req.user.role;  // from auth middleware
    const [rows] = await pool.execute(
      'SELECT is_allowed FROM permissions WHERE role_id = (SELECT id FROM roles WHERE name = ?) AND module = ? AND action = ?',
      [userRole, module, action]
    );
    if (!rows.length || !rows[0].is_allowed) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
}
```

### Frontend
```
src/
├── app/dashboard/admin/
│   ├── page.tsx                     ← admin overview
│   ├── users/
│   │   └── page.tsx
│   ├── roles/
│   │   └── page.tsx                 ← role manager with permission matrix
│   ├── audit-log/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── components/admin/
│   ├── UserForm.tsx
│   ├── UsersTable.tsx
│   ├── RoleForm.tsx
│   ├── PermissionMatrix.tsx         ← checkbox grid: modules × actions
│   ├── AuditLogTable.tsx
│   └── SettingsForm.tsx
```

---

<a id="database-schema"></a>
## 11. Database Schema Summary

### All New Tables (Phase 2)

| Module | Table | Purpose |
|---|---|---|
| Dashboard | `dashboard_widgets` | Role-based widget configuration |
| Dashboard | `activity_log` | System-wide activity tracking |
| Dashboard | `tasks` | Task management |
| Dashboard | `calendar_events` | Calendar events |
| CRM | `leads` | Lead management with scoring |
| CRM | `opportunities` | Opportunity pipeline |
| CRM | `crm_activities` | Calls, meetings, tasks, follow-ups |
| CRM | `email_templates` | Email template storage |
| CRM | `email_log` | Email send history |
| CRM | `email_automation_rules` | Automation trigger rules |
| CRM | `newsletter_subscribers` | Newsletter subscriber list |
| Sales | `quotations` | Sales quotations |
| Sales | `quotation_items` | Quotation line items |
| Sales | `sales_orders` | Sales orders |
| Sales | `sales_order_items` | Sales order line items |
| Production | `products` | Product master |
| Production | `bill_of_materials` | BOM header |
| Production | `bom_items` | BOM line items |
| Production | `production_orders` | Production orders |
| Production | `material_consumption` | Material consumption log |
| Inventory | `warehouses` | Warehouse master |
| Inventory | `inventory` | Current stock levels |
| Inventory | `stock_movements` | Stock movement history |
| Procurement | `suppliers` | Supplier master |
| Procurement | `purchase_orders` | Purchase orders |
| Procurement | `purchase_order_items` | PO line items |
| Procurement | `goods_receipts` | Goods receipt header |
| Procurement | `goods_receipt_items` | Goods receipt items |
| Finance | `invoices` | Customer invoices |
| Finance | `invoice_items` | Invoice line items |
| Finance | `payments` | Payment records |
| Finance | `supplier_bills` | Supplier bills |
| Finance | `expenses` | Expense records |
| Admin | `roles` | Role definitions |
| Admin | `permissions` | Role-based permissions |
| Admin | `audit_log` | Audit trail |
| Admin | `app_settings` | Application settings |

**Total: 37 new tables**

---

<a id="api-reference"></a>
## 12. API Endpoint Summary

| Module | Endpoints | Notes |
|---|---|---|
| Dashboard | 10 | Tasks, calendar, widgets, activity log |
| CRM (CRUD) | 9 | Create/update/delete for contacts, companies, deals |
| CRM (Leads) | 6 | Full CRUD + convert |
| CRM (Opportunities) | 6 | Full CRUD + pipeline |
| CRM (Activities) | 8 | Full CRUD + by-contact, by-deal, calendar view |
| CRM (Email) | 13 | Templates, send, automation, newsletter |
| Search | 1 | Global search |
| Sales | 12 | Quotations + sales orders + PDF + convert |
| Production | 12 | Products + BOM + production orders + consumption |
| Inventory | 9 | Warehouses + stock + movements |
| Procurement | 8 | Suppliers + POs + goods receipt |
| Finance | 14 | Invoices + payments + bills + expenses + reports |
| Reports | 8 | Module-specific + export |
| Admin | 10 | Users + roles + permissions + audit + settings |

**Total: ~126 new API endpoints**

---

<a id="email-automation"></a>
## 13. Email Automation (Resend)

### Leveraging Existing Infrastructure
The Resend SDK (`resend@6.9.4`) and `emailService.js` are already in place. We extend them:

### Email Features

| Feature | Trigger | Template |
|---|---|---|
| Hot Lead Alert | Lead score ≥ 80 | "Hot Lead Notification" |
| Lead Auto Follow-up | New lead created | "Welcome / Intro Email" |
| Quotation Sent | User clicks "Send" on quotation | "Quotation PDF Attached" |
| Invoice Sent | User clicks "Send" on invoice | "Invoice PDF Attached" |
| Payment Reminder | Invoice overdue (cron check) | "Payment Reminder" |
| Newsletter | Manual trigger / scheduled | Custom newsletter template |
| PO to Supplier | User clicks "Send" on PO | "Purchase Order PDF Attached" |
| Low Stock Alert | Stock ≤ reorder level (cron) | "Low Stock Warning" |
| Production Complete | PO status → completed | "Production Complete Notice" |

### Architecture
```
src/
├── services/
│   ├── emailService.js              ← (existing) core send functions
│   ├── emailTemplateService.js      ← template CRUD + merge field substitution
│   ├── emailAutomationService.js    ← trigger engine
│   └── newsletterService.js         ← batch newsletter
├── jobs/
│   ├── emailAutomationJob.js        ← process queued emails (cron)
│   └── overdueInvoiceJob.js         ← check overdue invoices (cron)
```

### Merge Field Substitution
```js
// Example: "Hello {{first_name}}, your quotation #{{quote_number}} is ready."
function renderTemplate(htmlBody, variables) {
  return htmlBody.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}
```

---

<a id="ai-integration"></a>
## 14. AI Integration (OpenRouter)

### Extending the Existing AI Engine

The `openrouter.ts` service already handles multi-model fallback. We add:

| AI Feature | Module | Description |
|---|---|---|
| Lead Scoring | CRM | AI analyzes lead data to suggest scores |
| Deal Win Probability | CRM | Predict win % based on deal attributes |
| Email Subject Optimizer | CRM Email | Suggest better subject lines via OpenRouter |
| Smart Recommendations | Dashboard | AI-generated action items based on data |
| Demand Forecasting | Inventory | Predict stock needs based on sales history |
| Report Insights | Reports | Natural language summary of any report data |

### Implementation Pattern
```js
// Example: AI Lead Scoring
async function scoreLeadWithAI(lead) {
  const prompt = `Analyze this lead and return a score 0-100:
    Name: ${lead.first_name} ${lead.last_name}
    Company: ${lead.company_name}
    Source: ${lead.source}
    ...`;
  
  const response = await chatCompletion([
    { role: 'system', content: 'You are a sales AI assistant.' },
    { role: 'user', content: prompt }
  ]);
  
  return parseInt(response.match(/\d+/)?.[0] || '50');
}
```

---

<a id="timeline"></a>
## 15. Timeline & Milestones (8 Weeks)

| Week | Module | Deliverables | Est. Days |
|---|---|---|---|
| **1** | Dashboard + Setup | Auth middleware, role-based dashboard, tasks, calendar, DB migrations | 5 |
| **2** | CRM Enhanced | CRM CRUD, Leads (with convert), Activities, Global Search | 5 |
| **3** | CRM Email + Sales | Email templates + automation (Resend), Quotations, Sales Orders | 5 |
| **4** | Production | Product Master, BOM editor, Production Orders, Work Progress | 5 |
| **5** | Inventory + Procurement | Warehouses, Stock In/Out, Suppliers, Purchase Orders, Goods Receipt | 5 |
| **6** | Finance | Invoices, Payments, Bills, Expenses, P&L, Cash Flow | 5 |
| **7** | Reports + Admin | Cross-module reports, User/Role/Permission management, Audit Log | 5 |
| **8** | Testing + Polish | Bug fixes, UAT, Performance optimization, Deployment | 5 |

### Key Dependencies (Build Order)
```
Week 1: Auth Middleware + Dashboard (foundation for all modules)
    ↓
Week 2: CRM CRUD + Leads (core entity management)
    ↓
Week 3: Email + Sales (depends on CRM contacts/companies)
    ↓
Week 4: Production (depends on Products from Sales)
    ↓
Week 5: Inventory + Procurement (depends on Products + Warehouses)
    ↓
Week 6: Finance (depends on Sales Orders + Purchase Orders)
    ↓
Week 7: Reports + Admin (depends on all modules having data)
    ↓
Week 8: Testing (everything complete)
```

---

## Sidebar Navigation (Updated)

```typescript
const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Analytics", href: "/dashboard/ai-analytics", icon: Sparkles, children: [...] },
  { 
    name: "CRM", href: "/dashboard/crm", icon: Users2,
    children: [
      { name: "Overview", href: "/dashboard/crm" },
      { name: "Contacts", href: "/dashboard/crm/contacts" },
      { name: "Companies", href: "/dashboard/crm/companies" },
      { name: "Deals", href: "/dashboard/crm/deals" },
      { name: "Leads", href: "/dashboard/crm/leads" },                    // NEW
      { name: "Opportunities", href: "/dashboard/crm/opportunities" },    // NEW
      { name: "Activities", href: "/dashboard/crm/activities" },          // NEW
      { name: "Emails", href: "/dashboard/crm/emails" },                  // NEW
    ]
  },
  { 
    name: "Sales", href: "/dashboard/sales", icon: ShoppingCart,          // NEW
    children: [
      { name: "Quotations", href: "/dashboard/sales/quotations" },
      { name: "Sales Orders", href: "/dashboard/sales/orders" },
    ]
  },
  { 
    name: "Production", href: "/dashboard/production", icon: Factory,     // NEW
    children: [
      { name: "Products", href: "/dashboard/production/products" },
      { name: "BOM", href: "/dashboard/production/bom" },
      { name: "Orders", href: "/dashboard/production/orders" },
    ]
  },
  { 
    name: "Inventory", href: "/dashboard/inventory", icon: Package,       // NEW
    children: [
      { name: "Stock", href: "/dashboard/inventory" },
      { name: "Warehouses", href: "/dashboard/inventory/warehouses" },
      { name: "History", href: "/dashboard/inventory/history" },
    ]
  },
  { 
    name: "Procurement", href: "/dashboard/procurement", icon: Truck,     // NEW
    children: [
      { name: "Suppliers", href: "/dashboard/procurement/suppliers" },
      { name: "Purchase Orders", href: "/dashboard/procurement/orders" },
    ]
  },
  { 
    name: "Finance", href: "/dashboard/finance", icon: DollarSign,        // NEW
    children: [
      { name: "Invoices", href: "/dashboard/finance/invoices" },
      { name: "Payments", href: "/dashboard/finance/payments" },
      { name: "Bills", href: "/dashboard/finance/bills" },
      { name: "Expenses", href: "/dashboard/finance/expenses" },
      { name: "Reports", href: "/dashboard/finance/reports" },
    ]
  },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },       // NEW
  { name: "Orders", href: "/dashboard/orders", icon: ListOrdered },
  { 
    name: "Admin", href: "/dashboard/admin", icon: Settings,              // NEW
    children: [
      { name: "Users", href: "/dashboard/admin/users" },
      { name: "Roles", href: "/dashboard/admin/roles" },
      { name: "Audit Log", href: "/dashboard/admin/audit-log" },
      { name: "Settings", href: "/dashboard/admin/settings" },
    ]
  },
];
```

---

## Backend File Structure (Complete Phase 2)

```
mrpeasy-vaclift-backend/src/
├── config/
│   ├── db.js                          (existing)
│   ├── env.js                         (existing — add new env vars)
│   └── initDb.js                      (existing — add all new tables)
├── middleware/
│   ├── auth.js                        (NEW — JWT verification)
│   ├── checkPermission.js             (NEW — role-based access)
│   └── auditLogger.js                 (NEW — automatic audit logging)
├── routes/
│   ├── authRoutes.js                  (existing)
│   ├── dashboardRoutes.js             (NEW)
│   ├── tasksRoutes.js                 (NEW)
│   ├── calendarRoutes.js              (NEW)
│   ├── crmStatsRoutes.js              (existing)
│   ├── contactsRoutes.js              (existing — add POST, PUT, DELETE)
│   ├── companiesRoutes.js             (existing — add POST, PUT, DELETE)
│   ├── dealsRoutes.js                 (existing — add POST, PUT, DELETE)
│   ├── leadsRoutes.js                 (NEW)
│   ├── opportunitiesRoutes.js         (NEW)
│   ├── activitiesRoutes.js            (NEW)
│   ├── emailRoutes.js                 (NEW)
│   ├── searchRoutes.js                (NEW)
│   ├── salesRoutes.js                 (NEW)
│   ├── productRoutes.js               (NEW)
│   ├── bomRoutes.js                   (NEW)
│   ├── productionRoutes.js            (NEW)
│   ├── inventoryRoutes.js             (NEW)
│   ├── procurementRoutes.js           (NEW)
│   ├── financeRoutes.js               (NEW)
│   ├── reportsRoutes.js               (NEW)
│   └── adminRoutes.js                 (NEW)
├── controller/
│   ├── (matching controllers for each route file)
├── services/
│   ├── (matching services for each module)
│   ├── emailService.js                (existing — extend)
│   ├── emailTemplateService.js        (NEW)
│   ├── emailAutomationService.js      (NEW)
│   ├── newsletterService.js           (NEW)
│   ├── pdfService.js                  (NEW)
│   └── searchService.js               (NEW)
├── jobs/
│   ├── emailAutomationJob.js          (NEW)
│   └── overdueInvoiceJob.js           (NEW)
└── templates/
    ├── quotation.html                 (NEW — PDF template)
    ├── sales-order.html               (NEW)
    └── invoice.html                   (NEW)
```

---

## New NPM Dependencies

### Backend
```bash
npm install pdfkit              # PDF generation
```

### Frontend
```bash
npm install @dnd-kit/core @dnd-kit/sortable   # Drag-and-drop for kanban boards
npm install react-day-picker                    # Calendar/date picker
npm install cmdk                                # Command palette (Cmd+K search)
```
