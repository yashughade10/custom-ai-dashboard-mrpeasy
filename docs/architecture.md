# System Architecture — Unified Operations & Smart Inventory Platform

## 1. Document Purpose

This document provides a low-level technical architecture of the Vaclift AI Dashboard platform. It maps every component that currently exists across both repositories, identifies what is already built, and defines what must be developed to fulfill the **Unified Operations & Smart Inventory Platform** proposal. The platform replaces three third-party services: **HubSpot** (CRM), **MRPeasy** (ERP/MRP), and **Xero** (Accounting).

---

## 2. High-Level System Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL DATA SOURCES                                 │
│                                                                                │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐            │
│   │  Shopify │    │ MRPeasy  │    │  HubSpot │    │Xero/QuickBooks│            │
│   │  (Store) │    │  (ERP)   │    │  (CRM)   │    │  (Accounting) │            │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └──────┬────────┘            │
│        │               │               │                 │                     │
│        ▼               ▼               ▼                 ▼                     │
│   ┌──────────────────────────────────────────────────────────────┐             │
│   │              Zapier / Webhooks (Event Pipeline)              │             │
│   └─────────────────────────────┬────────────────────────────────┘             │
└─────────────────────────────────┼──────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (mrpeasy-vaclift-backend)                        │
│                        Node.js / Express / TypeScript                           │
│                                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│  │  Order API   │  │ Analytics API  │  │     AI API      │  │  Alerts API   │   │
│  │              │  │                │  │                 │  │               │   │
│  │ POST /orders │  │ GET /analytics │  │ POST /ai-chat   │  │ GET /alerts   │   │
│  │ GET  /orders │  │ GET /reco..    │  │ GET  /ai-report │  │ POST /alerts  │   │
│  │ GET  /:code  │  │ GET /cmd-ctr   │  │ GET  /briefing  │  │   /run        │   │
│  │              │  │ GET /segments  │  │                 │  │               │   │
│  │              │  │ GET /profit    │  │                 │  │               │   │
│  │              │  │ GET /cohorts   │  │                 │  │               │   │
│  │              │  │ GET /supply    │  │                 │  │               │   │
│  └──────┬───────┘  └───────┬────────┘  └────────┬────────┘  └──────┬────────┘   │
│         │                  │                    │                  │            │
│         ▼                  ▼                    ▼                  ▼            │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                          SERVICE LAYER                                     │ │
│  │                                                                            │ │
│  │  orderService.js         analyticsService.js        ai-report-engine.ts    │ │
│  │  emailService.js         scheduledReportService.js  openrouter.ts          │ │
│  │  apiService.js           eventAlertsService.js                             │ │
│  └──────────────────────────────┬─────────────────────────────────────────────┘ │
│                                 │                                               │
│  ┌──────────────────────────────┼─────────────────────────────────────────────┐ │
│  │                     ANALYTICS ENGINE                                       │ │
│  │                                                                            │ │
│  │  revenueAnalytics.js          customerAnalytics.js                         │ │
│  │  operationsAnalytics.js       customerSegmentationAnalytics.js             │ │
│  │  inventoryAnalytics.js        profitAnalytics.js                           │ │
│  │  recommendationsAnalytics.js  cohortAnalytics.js                           │ │
│  │  commandCenterAnalytics.js    supplyChainInsights.js                       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                 │                                               │
│  ┌──────────────────────────────┼─────────────────────────────────────────────┐ │
│  │                     SCHEDULED JOBS (node-cron)                             │ │
│  │                                                                            │ │
│  │  Daily Report (23:59)  │  Weekly Report (Mon 09:00)  │  Alerts (*/15 min)  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                 │                                               │
│                                 ▼                                               │
│                    ┌────────────────────────┐                                   │
│                    │   MySQL / TiDB Cloud   │                                   │
│                    │                        │                                   │
│                    │  • orders              │                                   │
│                    │  • ai_reports          │                                   │
│                    │  • report_email_logs   │                                   │
│                    │  • event_alert_logs    │                                   │
│                    └────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (custom-ai-dashboard-mrpeasy)                       │
│                    Next.js 16 / React 19 / TypeScript / Tailwind                │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           PAGES                                          │   │
│  │                                                                          │   │
│  │   /                      → Login (localStorage auth)                     │   │
│  │   /dashboard             → Overview (MetricCards, Charts)                │   │
│  │   /dashboard/orders      → Order List (Search, Filter, Detail Dialog)    │   │
│  │   /dashboard/ai-analytics→ AI Report (Executive, Forecast, Inventory)    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        COMPONENTS                                        │   │
│  │                                                                          │   │
│  │  Analytics:                          Charts (ECharts):                   │   │
│  │   AnalyticsDashboard.tsx              RevenueOverTimeChart               │   │
│  │   AIAnalyticsDashboard.tsx            OrdersOverTimeChart                │   │
│  │   AIAnalyticsChat.tsx                 SalesForecastChart                 │   │
│  │   MetricCard.tsx                      InventoryRiskChart                 │   │
│  │   PaginatedSimpleTable.tsx            OperationsHealthGaugeChart         │   │
│  │   SimpleTable.tsx                     ChannelPerformanceChart            │   │
│  │   SectionHeader.tsx                   CustomerContributionParetoChart    │   │
│  │                                       RevenueByCustomerChart             │   │
│  │  Common:                              RevenueHeatmapChart                │   │
│  │   AppSidebar.tsx                      TopProductsByRevenueChart          │   │
│  │   AppHeader.tsx                       TopProductsByQuantityChart         │   │
│  │                                                                          │   │
│  │  UI: shadcn/ui (Card, Table, Dialog, Sidebar, Badge, etc.)               │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      AI LAYER (Server-side)                              │   │
│  │                                                                          │   │
│  │  ai-report-engine.ts     → Forecasting, KPI computation, AI insights     │   │
│  │  openrouter.ts           → OpenRouter API integration (free models)      │   │
│  │  ai-report-types.ts      → Full TypeScript type system                   │   │
│  │  analytics.ts            → Order normalization, data utilities           │   │
│  │                                                                          │   │
│  │  API Routes:                                                             │   │
│  │   /api/ai-chat           → POST → answerAnalyticsQuestion()              │   │
│  │   /api/ai-report         → GET  → getAIAnalyticsReport()                 │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      STATE & DATA FLOW                                   │   │
│  │                                                                          │   │
│  │  TanStack React Query (data fetching, caching, stale-while-revalidate)   │   │
│  │  localStorage (auth session, no JWT/token server validation)             │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT INFRASTRUCTURE                                │
│                                                                                 │
│   Frontend:  Vercel (Next.js)                                                   │
│   Backend:   Vercel (Express serverless functions)                              │
│   Database:  TiDB Cloud (MySQL-compatible, SSL, connection pooling)             │
│   Email:     Resend (transactional email for reports & alerts)                  │
│   AI:        OpenRouter (LLM gateway — free tier models)                        │
│   Sync:      Zapier (MRPeasy → Backend webhook)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Existing Capabilities — Detailed Inventory

### 3.1 Backend (mrpeasy-vaclift-backend)

| Layer | Component | Status | Description |
|-------|-----------|--------|-------------|
| **Data Ingestion** | `POST /api/orders` | ✅ Built | Receives MRPeasy order payloads via Zapier webhook, upserts by `order_code` |
| **Data Storage** | MySQL `orders` table | ✅ Built | Stores raw JSON payloads with order code dedup |
| **Data Storage** | MySQL `ai_reports` table | ✅ Built | Caches AI-generated report JSON with content hash |
| **Data Storage** | MySQL `report_email_logs` | ✅ Built | Deduplication log for scheduled email reports |
| **Data Storage** | MySQL `event_alert_logs` | ✅ Built | Deduplication log for event-based alerts |
| **Analytics** | Revenue analytics | ✅ Built | Revenue over time (day/week/month), growth %, top products, customer revenue, Pareto analysis |
| **Analytics** | Operations analytics | ✅ Built | Fulfillment time, delayed orders, production cycle time by manufacturing status |
| **Analytics** | Inventory analytics | ✅ Built | Fast-moving SKUs, dead stock detection |
| **Analytics** | Customer analytics | ✅ Built | Repeat customers, CLV, average order value |
| **Analytics** | Smart recommendations | ✅ Built | Stockout forecasts, pricing drop alerts, production shift suggestions |
| **Analytics** | Operational command center | ✅ Built | Live orders feed, production progress, shipping status |
| **Analytics** | Customer segmentation | ✅ Built | High-value, repeat, churn-risk customer classification |
| **Analytics** | Profit analytics | ✅ Built | Estimated COGS/margin/contribution (configurable via env) |
| **Analytics** | Cohort analysis | ✅ Built | Customer retention cohorts over time |
| **Analytics** | Supply chain insights | ✅ Built | Production bottleneck inference from manufacturing statuses |
| **AI** | AI Chat (Natural Language) | ✅ Built | Answers business questions using order/analytics data + OpenRouter LLM |
| **AI** | AI Analytics Report | ✅ Built | Full analytics report with AI-generated executive summary, insights, risks, opportunities, actions |
| **AI** | AI Executive Briefing | ✅ Built | Weekly CEO-level AI-generated business summary |
| **Notifications** | Daily email report | ✅ Built | Automated daily summary (orders, revenue, shipping, delays) via Resend |
| **Notifications** | Weekly email report | ✅ Built | Weekly performance with top products, inventory risks, forecasts |
| **Notifications** | Event-based alerts | ✅ Built | Revenue spike, inventory stockout risk, delayed orders SLA alerts |
| **Scheduling** | Cron job system | ✅ Built | node-cron with configurable schedules, timezone support, deduplication |

### 3.2 Frontend (custom-ai-dashboard-mrpeasy)

| Layer | Component | Status | Description |
|-------|-----------|--------|-------------|
| **Auth** | Login page | ✅ Built | Email/password login, localStorage session storage |
| **Dashboard** | Overview page | ✅ Built | Metric cards, revenue charts, operations gauges, customer tables |
| **Dashboard** | AI Analytics page | ✅ Built | Executive summary, sales forecasting, inventory stockout prediction, AI recommendations, AI chatbot |
| **Dashboard** | Orders page | ✅ Built | Searchable/filterable order table with detail dialog |
| **Charts** | Revenue over time | ✅ Built | ECharts line chart (day/week/month) |
| **Charts** | Orders over time | ✅ Built | ECharts bar chart |
| **Charts** | Sales forecast | ✅ Built | ECharts area chart with confidence bands (7d/30d/90d) |
| **Charts** | Inventory risk | ✅ Built | ECharts risk visualization |
| **Charts** | Operations health | ✅ Built | ECharts gauge chart |
| **Charts** | Channel performance | ✅ Built | ECharts comparative chart |
| **Charts** | Customer contribution Pareto | ✅ Built | ECharts combined bar/line |
| **Charts** | Revenue by customer | ✅ Built | ECharts chart |
| **Charts** | Revenue heatmap | ✅ Built | ECharts calendar heatmap |
| **Charts** | Top products (revenue + quantity) | ✅ Built | ECharts horizontal bar charts |
| **AI** | AI chatbot interface | ✅ Built | Chat UI with highlights, suggested charts, drilldowns |
| **AI** | AI report engine (frontend copy) | ✅ Built | Full forecasting + AI insight generation via OpenRouter API routes |
| **Navigation** | Sidebar with section anchoring | ✅ Built | Collapsible sidebar with sub-items linking to page sections |

### 3.3 AI & Forecasting Engine

| Capability | Status | Description |
|------------|--------|-------------|
| Sales forecasting (7d/30d/90d) | ✅ Built | Hybrid moving average + linear regression with day-of-week seasonality |
| Inventory stockout prediction | ✅ Built | Per-SKU estimated stock level, depletion velocity, stockout date, reorder quantity |
| Production workload index | ✅ Built | Weighted status-based workload scoring with capacity utilization |
| Revenue heatmap analysis | ✅ Built | Day-of-week × week-index revenue distribution |
| Channel performance analysis | ✅ Built | Status-based channel revenue and on-time % |
| AI-powered executive summary | ✅ Built | OpenRouter LLM generates insights from KPIs |
| AI-powered chatbot (RAG-like) | ✅ Built | Natural language questions → data context → LLM → structured response |
| Fallback rule-based insights | ✅ Built | Deterministic fallback when LLM is unavailable |

---

## 4. Gap Analysis — What Needs to Be Built

The proposal calls for a **Unified Operations & Smart Inventory Platform** that replaces **HubSpot** (CRM), **MRPeasy** (ERP/MRP), and **Xero** (Accounting) while keeping Shopify as the commerce frontend. Below is every capability gap identified.

### 4.1 Customer & Lead Management (Replace HubSpot)

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Contact database (customers, leads, prospects) | ❌ Not built — customers are only derived from orders | Full CRM contact management module |
| Lead pipeline & lifecycle stages | ❌ Not built | Lead management with pipeline stages (New → Qualified → Proposal → Won/Lost) |
| Interaction history (calls, meetings, notes) | ❌ Not built | Activity timeline per contact |
| Quote history & management | ❌ Not built | Quote creation, versioning, PDF generation |
| Email communication logging | ❌ Not built | Email thread storage per contact |
| Inbound/outbound call tracking & filtering | ❌ Not built | Call log module with lead qualification workflow |
| Email template management & design | ❌ Not built | HTML email template builder with drag-and-drop |
| Bulk email campaign engine | ❌ Not built | Campaign creation, scheduling, bulk sending with tracking |
| Email open/click tracking | ❌ Not built | Pixel tracking, link tracking, engagement analytics |
| Lead scoring | ❌ Not built | Rule-based or AI-powered lead scoring system |
| Deals/opportunities pipeline | ❌ Not built | Deal tracking with value, probability, close date |

### 4.2 Manufacturing & Operations (Replace MRPeasy)

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Work order management | ⚠️ Partial — statuses visible from MRPeasy sync | Full work order CRUD (create, assign, track, close) |
| Production scheduling | ❌ Not built | Production calendar, resource allocation, scheduling engine |
| Bill of Materials (BOM) | ❌ Not built | Multi-level BOM management with component tracking |
| Raw material tracking | ❌ Not built | Raw material inventory with supplier linkage |
| Purchase order management | ❌ Not built | PO creation, approval workflow, supplier management |
| Supplier/vendor management | ❌ Not built | Vendor database, contact info, lead time tracking |
| Manufacturing routing | ❌ Not built | Step-by-step manufacturing process definitions |
| Quality control checkpoints | ❌ Not built | QC inspection records at manufacturing stages |
| Warehouse/location management | ❌ Not built | Multi-warehouse stock tracking |
| Stock adjustment & transfer | ❌ Not built | Manual stock corrections, inter-warehouse transfers |
| Barcode/SKU scanning | ❌ Not built | Barcode generation and scan-based operations |

### 4.3 Live Shopify Integration

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Shopify → System order sync | ⚠️ Partial — via Zapier through MRPeasy | Direct Shopify webhook integration |
| Inventory level sync (System → Shopify) | ❌ Not built | Bi-directional inventory sync |
| Auto-trigger manufacturing orders from Shopify sales | ❌ Not built | Event-driven MO creation |
| Customer profile auto-creation from Shopify | ❌ Not built | Customer record creation on first order |
| Shopify product catalog sync | ❌ Not built | Product master data sync |

### 4.4 Enhanced AI & Forecasting

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Sales forecasting | ✅ Built | — |
| Inventory stockout prediction | ✅ Built | — |
| Seasonality-aware forecasting | ⚠️ Basic — day-of-week only | Full seasonal decomposition (monthly, quarterly, holiday) |
| Reorder point automation | ⚠️ Suggestions only | Automated PO drafting based on predictions |
| Custom model training on historical data | ❌ Not built | Python microservice for Prophet/ML models |
| Real stock level integration | ⚠️ Estimated only | Direct integration with actual stock counts |

### 4.5 Authentication & Security

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| User authentication | ⚠️ Basic — localStorage only, no server validation | JWT/session-based auth with server validation |
| Role-based access control (RBAC) | ❌ Not built | Admin, Sales, Operations, Workshop roles with permission scoping |
| User management (CRUD) | ❌ Not built | Admin panel for creating/editing/deactivating users |
| Audit trail / activity logging | ❌ Not built | Record of all user actions for compliance |
| Multi-factor authentication (MFA) | ❌ Not built | TOTP or SMS-based 2FA |
| Session management | ❌ Not built | Token expiry, refresh tokens, concurrent session limits |

### 4.8 Accounting & Finance (Replace Xero)

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Chart of Accounts | ❌ Not built | Full chart of accounts management (assets, liabilities, equity, revenue, expenses) |
| Sales invoices | ❌ Not built | Invoice creation, PDF generation, status tracking (draft → sent → paid → voided) |
| Purchase bills | ❌ Not built | Supplier bill recording, matching to purchase orders, approval workflow |
| Payments tracking | ❌ Not built | Record payments against invoices/bills, partial payments, overpayments |
| Bank transactions | ❌ Not built | Bank feed import, transaction categorization, bank reconciliation |
| Credit notes | ❌ Not built | Issue/receive credit notes, apply against invoices/bills |
| Tax management | ❌ Not built | Tax rate configuration (GST/VAT), tax-inclusive/exclusive calculations, BAS/tax return data |
| General ledger | ❌ Not built | Double-entry journal entries, GL posting from all modules |
| Financial reports | ❌ Not built | Profit & Loss, Balance Sheet, Cash Flow Statement, Aged Receivables/Payables |
| Bank reconciliation | ❌ Not built | Match bank transactions to invoices/payments, reconciliation dashboard |
| Multi-currency support | ❌ Not built | Foreign currency invoices, exchange rate management, currency gains/losses |
| Expense claims | ❌ Not built | Employee expense submission, approval workflow, reimbursement tracking |
| Recurring invoices | ❌ Not built | Automated invoice generation on schedule |
| Payment reminders | ❌ Not built | Automated overdue invoice reminders via email |

### 4.9 Data Migration

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| HubSpot data export & import | ❌ Not built | Migration scripts for contacts, deals, activities, emails |
| MRPeasy data export & import | ❌ Not built | Migration scripts for orders, BOMs, stock, production history |
| Xero data export & import | ❌ Not built | Migration scripts for chart of accounts, invoices, bills, payments, bank transactions, journal entries |
| Data cleaning & deduplication pipeline | ❌ Not built | ETL pipeline for pre-migration cleansing |
| Parallel testing environment | ❌ Not built | Staging environment with production data copy |
| Financial data reconciliation | ❌ Not built | Verify migrated Xero balances match source (trial balance cross-check) |

### 4.10 Infrastructure & Hosting Upgrades

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Isolated cloud environment | ⚠️ Shared Vercel deployment | Dedicated cloud instance (AWS/GCP/Azure) |
| Automated daily database backups | ❌ Not built (TiDB Cloud may have built-in) | Explicit backup strategy with retention policy |
| Data encryption at rest | ⚠️ Depends on TiDB Cloud settings | Verified encryption-at-rest configuration |
| Data encryption in transit | ✅ SSL/TLS configured | — |
| Monitoring & alerting (infrastructure) | ❌ Not built | APM, uptime monitoring, error tracking |

---

## 5. Database Schema — Current vs Required

### 5.1 Current Tables

```sql
-- Orders (raw MRPeasy payload storage)
orders (
    id BIGINT PK AUTO_INCREMENT,
    order_code VARCHAR(191) UNIQUE,
    payload LONGTEXT,             -- Full MRPeasy JSON
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- AI report cache
ai_reports (
    id BIGINT PK AUTO_INCREMENT,
    report_json LONGTEXT,
    hash CHAR(64) UNIQUE,
    created_at TIMESTAMP
)

-- Email deduplication
report_email_logs (
    id BIGINT PK AUTO_INCREMENT,
    report_type VARCHAR(32),
    period_start DATE,
    period_end DATE,
    sent_at TIMESTAMP,
    UNIQUE(report_type, period_start, period_end)
)

-- Alert deduplication
event_alert_logs (
    id BIGINT PK AUTO_INCREMENT,
    alert_type VARCHAR(48),
    alert_key VARCHAR(191),
    severity VARCHAR(16),
    title VARCHAR(191),
    payload_json LONGTEXT,
    sent_at TIMESTAMP,
    UNIQUE(alert_type, alert_key)
)
```

### 5.2 New Tables Required

```sql
-- ============ AUTHENTICATION & USERS ============

users (
    id BIGINT PK,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role ENUM('admin','sales','operations','workshop','viewer'),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

sessions (
    id BIGINT PK,
    user_id BIGINT FK → users,
    token VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP
)

audit_logs (
    id BIGINT PK,
    user_id BIGINT FK → users,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    payload_json LONGTEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP
)

-- ============ CRM / CONTACTS ============

contacts (
    id BIGINT PK,
    type ENUM('customer','lead','prospect'),
    company_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_json LONGTEXT,
    shopify_customer_id VARCHAR(100),
    source VARCHAR(50),
    lead_score INT,
    lifecycle_stage ENUM('new','qualified','proposal','negotiation','won','lost'),
    assigned_to BIGINT FK → users,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

interactions (
    id BIGINT PK,
    contact_id BIGINT FK → contacts,
    user_id BIGINT FK → users,
    type ENUM('call','email','meeting','note','task'),
    direction ENUM('inbound','outbound'),
    subject VARCHAR(255),
    body LONGTEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP
)

deals (
    id BIGINT PK,
    contact_id BIGINT FK → contacts,
    title VARCHAR(255),
    value DECIMAL(12,2),
    currency VARCHAR(3),
    stage ENUM('discovery','proposal','negotiation','closed_won','closed_lost'),
    probability INT,
    expected_close_date DATE,
    assigned_to BIGINT FK → users,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

quotes (
    id BIGINT PK,
    deal_id BIGINT FK → deals,
    contact_id BIGINT FK → contacts,
    version INT,
    items_json LONGTEXT,
    subtotal DECIMAL(12,2),
    tax DECIMAL(12,2),
    total DECIMAL(12,2),
    status ENUM('draft','sent','accepted','declined','expired'),
    valid_until DATE,
    created_at TIMESTAMP
)

-- ============ EMAIL CAMPAIGNS ============

email_templates (
    id BIGINT PK,
    name VARCHAR(255),
    subject VARCHAR(255),
    html_body LONGTEXT,
    created_by BIGINT FK → users,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

email_campaigns (
    id BIGINT PK,
    name VARCHAR(255),
    template_id BIGINT FK → email_templates,
    status ENUM('draft','scheduled','sending','sent','cancelled'),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    total_recipients INT,
    total_opens INT,
    total_clicks INT,
    created_by BIGINT FK → users,
    created_at TIMESTAMP
)

email_campaign_recipients (
    id BIGINT PK,
    campaign_id BIGINT FK → email_campaigns,
    contact_id BIGINT FK → contacts,
    status ENUM('pending','sent','opened','clicked','bounced','unsubscribed'),
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
)

-- ============ INVENTORY & MANUFACTURING ============

products (
    id BIGINT PK,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    currency VARCHAR(3),
    shopify_product_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

inventory_stock (
    id BIGINT PK,
    product_id BIGINT FK → products,
    warehouse_id BIGINT FK → warehouses,
    quantity_on_hand INT,
    quantity_reserved INT,
    quantity_available INT GENERATED,
    reorder_point INT,
    reorder_quantity INT,
    last_counted_at TIMESTAMP,
    updated_at TIMESTAMP
)

warehouses (
    id BIGINT PK,
    name VARCHAR(100),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
)

stock_movements (
    id BIGINT PK,
    product_id BIGINT FK → products,
    warehouse_id BIGINT FK → warehouses,
    type ENUM('receipt','shipment','adjustment','transfer','production'),
    quantity INT,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    notes TEXT,
    created_by BIGINT FK → users,
    created_at TIMESTAMP
)

bill_of_materials (
    id BIGINT PK,
    finished_product_id BIGINT FK → products,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

bom_lines (
    id BIGINT PK,
    bom_id BIGINT FK → bill_of_materials,
    component_product_id BIGINT FK → products,
    quantity_required DECIMAL(10,4),
    unit VARCHAR(20),
    sort_order INT
)

suppliers (
    id BIGINT PK,
    name VARCHAR(255),
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_json LONGTEXT,
    lead_time_days INT,
    payment_terms VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

purchase_orders (
    id BIGINT PK,
    supplier_id BIGINT FK → suppliers,
    po_number VARCHAR(50) UNIQUE,
    status ENUM('draft','submitted','confirmed','partially_received','received','cancelled'),
    total DECIMAL(12,2),
    expected_delivery DATE,
    actual_delivery DATE,
    created_by BIGINT FK → users,
    approved_by BIGINT FK → users,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

purchase_order_lines (
    id BIGINT PK,
    purchase_order_id BIGINT FK → purchase_orders,
    product_id BIGINT FK → products,
    quantity_ordered INT,
    quantity_received INT DEFAULT 0,
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2)
)

work_orders (
    id BIGINT PK,
    wo_number VARCHAR(50) UNIQUE,
    product_id BIGINT FK → products,
    bom_id BIGINT FK → bill_of_materials,
    quantity INT,
    status ENUM('draft','planned','in_progress','completed','cancelled'),
    priority ENUM('low','normal','high','urgent'),
    planned_start DATE,
    planned_end DATE,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    assigned_to BIGINT FK → users,
    source_order_id BIGINT FK → orders,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

work_order_steps (
    id BIGINT PK,
    work_order_id BIGINT FK → work_orders,
    step_number INT,
    name VARCHAR(255),
    description TEXT,
    status ENUM('pending','in_progress','completed','skipped'),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by BIGINT FK → users
)

-- ============ ACCOUNTING & FINANCE (Replace Xero) ============

accounts (
    id BIGINT PK,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    type ENUM('asset','liability','equity','revenue','expense'),
    sub_type VARCHAR(50),
    tax_type VARCHAR(50),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    xero_account_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

tax_rates (
    id BIGINT PK,
    name VARCHAR(100),
    rate DECIMAL(5,2),
    tax_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    xero_tax_type VARCHAR(50),
    created_at TIMESTAMP
)

invoices (
    id BIGINT PK,
    invoice_number VARCHAR(50) UNIQUE,
    type ENUM('sales','purchase'),
    contact_id BIGINT FK → contacts,
    status ENUM('draft','submitted','sent','paid','partially_paid','voided','overdue'),
    issue_date DATE,
    due_date DATE,
    subtotal DECIMAL(12,2),
    tax_total DECIMAL(12,2),
    total DECIMAL(12,2),
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) GENERATED,
    currency VARCHAR(3) DEFAULT 'AUD',
    exchange_rate DECIMAL(10,6) DEFAULT 1,
    reference VARCHAR(255),
    notes TEXT,
    order_id BIGINT FK → orders,
    xero_invoice_id VARCHAR(100),
    created_by BIGINT FK → users,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

invoice_lines (
    id BIGINT PK,
    invoice_id BIGINT FK → invoices,
    description VARCHAR(500),
    quantity DECIMAL(10,4),
    unit_price DECIMAL(12,2),
    account_id BIGINT FK → accounts,
    tax_rate_id BIGINT FK → tax_rates,
    line_total DECIMAL(12,2),
    product_id BIGINT FK → products NULL,
    sort_order INT
)

payments (
    id BIGINT PK,
    payment_number VARCHAR(50) UNIQUE,
    invoice_id BIGINT FK → invoices,
    amount DECIMAL(12,2),
    payment_date DATE,
    payment_method ENUM('bank_transfer','credit_card','cash','cheque','other'),
    bank_account_id BIGINT FK → accounts,
    reference VARCHAR(255),
    is_reconciled BOOLEAN DEFAULT FALSE,
    xero_payment_id VARCHAR(100),
    created_by BIGINT FK → users,
    created_at TIMESTAMP
)

credit_notes (
    id BIGINT PK,
    credit_note_number VARCHAR(50) UNIQUE,
    type ENUM('sales','purchase'),
    contact_id BIGINT FK → contacts,
    status ENUM('draft','submitted','applied','voided'),
    date DATE,
    subtotal DECIMAL(12,2),
    tax_total DECIMAL(12,2),
    total DECIMAL(12,2),
    remaining_credit DECIMAL(12,2),
    xero_credit_note_id VARCHAR(100),
    created_at TIMESTAMP
)

bank_transactions (
    id BIGINT PK,
    bank_account_id BIGINT FK → accounts,
    date DATE,
    amount DECIMAL(12,2),
    type ENUM('spend','receive'),
    description VARCHAR(500),
    reference VARCHAR(255),
    contact_id BIGINT FK → contacts NULL,
    account_id BIGINT FK → accounts NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_to_id BIGINT NULL,
    reconciled_to_type VARCHAR(50) NULL,
    xero_transaction_id VARCHAR(100),
    created_at TIMESTAMP
)

journal_entries (
    id BIGINT PK,
    journal_number VARCHAR(50) UNIQUE,
    date DATE,
    narration TEXT,
    source_type VARCHAR(50),
    source_id BIGINT,
    is_system_generated BOOLEAN DEFAULT TRUE,
    xero_journal_id VARCHAR(100),
    created_by BIGINT FK → users,
    created_at TIMESTAMP
)

journal_lines (
    id BIGINT PK,
    journal_entry_id BIGINT FK → journal_entries,
    account_id BIGINT FK → accounts,
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    description VARCHAR(500),
    contact_id BIGINT FK → contacts NULL,
    tax_rate_id BIGINT FK → tax_rates NULL
)

expense_claims (
    id BIGINT PK,
    user_id BIGINT FK → users,
    status ENUM('draft','submitted','approved','paid','rejected'),
    total DECIMAL(12,2),
    description TEXT,
    submitted_at TIMESTAMP,
    approved_by BIGINT FK → users NULL,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    xero_expense_id VARCHAR(100),
    created_at TIMESTAMP
)

expense_claim_lines (
    id BIGINT PK,
    expense_claim_id BIGINT FK → expense_claims,
    date DATE,
    description VARCHAR(500),
    amount DECIMAL(12,2),
    account_id BIGINT FK → accounts,
    tax_rate_id BIGINT FK → tax_rates NULL,
    receipt_url VARCHAR(500)
)

recurring_invoices (
    id BIGINT PK,
    template_invoice_id BIGINT FK → invoices,
    contact_id BIGINT FK → contacts,
    frequency ENUM('weekly','fortnightly','monthly','quarterly','yearly'),
    next_date DATE,
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
)

-- ============ SHOPIFY SYNC ============

shopify_sync_logs (
    id BIGINT PK,
    direction ENUM('inbound','outbound'),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    shopify_id VARCHAR(100),
    action VARCHAR(50),
    payload_json LONGTEXT,
    status ENUM('success','failed','skipped'),
    error_message TEXT,
    created_at TIMESTAMP
)

-- ============ DATA MIGRATION TRACKING ============

migration_runs (
    id BIGINT PK,
    source_platform ENUM('hubspot','mrpeasy','xero','shopify'),
    entity_type VARCHAR(50),
    status ENUM('pending','running','completed','failed','rolled_back'),
    total_records INT,
    migrated_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    skipped_records INT DEFAULT 0,
    error_log LONGTEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by BIGINT FK → users
)

migration_record_map (
    id BIGINT PK,
    migration_run_id BIGINT FK → migration_runs,
    source_platform VARCHAR(20),
    source_entity_type VARCHAR(50),
    source_id VARCHAR(255),
    target_entity_type VARCHAR(50),
    target_id BIGINT,
    status ENUM('success','failed','skipped'),
    error_message TEXT,
    created_at TIMESTAMP,
    UNIQUE(source_platform, source_entity_type, source_id)
)
```

---

## 6. Integration Architecture

### 6.1 Current Integration Flow

```
Shopify Order → MRPeasy (manual/auto sync) → Zapier Webhook → POST /api/orders → MySQL
```

### 6.2 Target Integration Flow

```
┌──────────┐     Webhook      ┌────────────────────────┐
│  Shopify │ ──────────────→  │  Shopify Webhook       │
│  Store   │ ←──────────────  │  Handler (Backend)     │
│          │  Inventory Sync  │                        │
└──────────┘                  │  • Create/update order │
                              │  • Create customer     │
                              │  • Update inventory    │
                              │  • Trigger work order  │
                              └──────────┬─────────────┘
                                         │
                                         ▼
                              ┌───────────────────────┐
                              │   Unified Database    │
                              │                       │
                              │  orders, contacts,    │
                              │  inventory, work      │
                              │  orders, BOMs, etc.   │
                              └──────────┬────────────┘
                                         │
                              ┌──────────┴────────────┐
                              │                       │
                     ┌────────▼──────┐      ┌─────────▼───────┐
                     │  AI Engine    │      │  Email Engine   │
                     │               │      │                 │
                     │  Forecasting  │      │  CRM Campaigns  │
                     │  Predictions  │      │  Daily/Weekly   │
                     │  Chat Q&A     │      │  Event Alerts   │
                     └───────────────┘      └─────────────────┘
```

---

## 7. Technology Stack Summary

| Layer | Current | Required Additions |
|-------|---------|-------------------|
| **Frontend Framework** | Next.js 16, React 19, TypeScript | No change |
| **UI Library** | shadcn/ui, Tailwind CSS 4, Lucide icons | No change |
| **Charts** | ECharts 6 (echarts-for-react) | No change |
| **State Management** | TanStack React Query | No change |
| **Backend Framework** | Express 5, Node.js | No change |
| **Database** | MySQL (TiDB Cloud) | Schema expansion (see §5.2) |
| **ORM/Query** | mysql2/promise (raw SQL) | Consider Drizzle or Prisma for new modules |
| **Authentication** | localStorage only | JWT + bcrypt + RBAC middleware |
| **Email (Transactional)** | Resend SDK | No change |
| **Email (Marketing)** | ❌ Not built | Resend or SendGrid bulk API + tracking |
| **AI Provider** | OpenRouter (free models) | Consider paid models for production accuracy |
| **Forecasting** | In-process linear regression | Python microservice (Prophet / scikit-learn) for advanced models |
| **Job Scheduling** | node-cron (in-process) | Consider BullMQ + Redis for distributed jobs |
| **File Storage** | ❌ Not built | S3/GCS for quote PDFs, invoices, receipts, attachments |
| **Search** | In-memory array filter | Full-text search (DB-level or MeiliSearch) |
| **PDF Engine** | ❌ Not built | Invoice/quote PDF generation (React-PDF or Puppeteer) |
| **Accounting** | ❌ Not built (Xero) | Custom double-entry GL, invoicing, bank reconciliation |
| **Hosting** | Vercel (frontend + backend) | Dedicated cloud (AWS ECS/GCP Cloud Run) for full platform |
| **Monitoring** | ❌ Not built | Sentry (errors) + UptimeRobot (availability) |

---

## 8. Security Architecture

### 8.1 Current State

- **Authentication**: Client-side localStorage with no server-side session validation
- **Authorization**: No role-based access — all authenticated users see everything
- **Data Protection**: TLS in transit (SSL on MySQL), no verified encryption at rest
- **API Security**: No rate limiting, no API key validation, open CORS

### 8.2 Target State

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                         │
│                                                            │
│  Layer 1: Network                                          │
│  • Cloudflare / WAF for DDoS protection                    │
│  • Firewall rules — only HTTPS inbound                     │
│                                                            │
│  Layer 2: Authentication                                   │
│  • bcrypt password hashing (min cost 12)                   │
│  • JWT access tokens (15min expiry)                        │
│  • Refresh tokens (7-day expiry, rotation)                 │
│  • Optional TOTP-based MFA                                 │
│                                                            │
│  Layer 3: Authorization                                    │
│  • RBAC middleware per route                               │
│  • Role hierarchy: Admin > Sales > Operations > Workshop   │
│  • Scoped data visibility per role                         │
│                                                            │
│  Layer 4: Data                                             │
│  • AES-256 encryption at rest                              │
│  • TLS 1.2+ in transit                                     │
│  • PII field-level encryption for sensitive customer data  │
│                                                            │
│  Layer 5: Monitoring                                       │
│  • Audit trail for all write operations                    │
│  • Rate limiting (express-rate-limit)                      │
│  • Automated daily database snapshots                      │
│  • Incident alerting via PagerDuty/Slack                   │
└────────────────────────────────────────────────────────────┘
```
