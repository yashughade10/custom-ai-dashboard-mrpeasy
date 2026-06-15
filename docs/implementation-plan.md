# Development Implementation Plan — Unified Operations & Smart Inventory Platform

## 1. Introduction

This document provides a step-by-step development implementation plan for transforming the current Vaclift AI Dashboard into a **Unified Operations & Smart Inventory Platform** that replaces both HubSpot (CRM) and MRPeasy (ERP). Each phase is broken into concrete development tasks, organized by priority and dependency.

> **Note**: This plan does not include timelines. All phases are ordered by dependency — each phase must be completed before the next begins, unless explicitly marked as parallelizable.

---

## 2. Phase Overview

| Phase | Name | Scope | Dependencies |
|-------|------|-------|--------------|
| **Phase 1** | Foundation & Authentication | Auth system, RBAC, database schema expansion, API middleware | None |
| **Phase 2** | Core Operations & Inventory | Product catalog, inventory management, warehouse, stock movements | Phase 1 |
| **Phase 3** | Manufacturing & Production | BOM, work orders, production scheduling, quality control | Phase 2 |
| **Phase 4** | Live Shopify Integration | Direct Shopify webhooks, bi-directional sync, auto-triggers | Phase 2 |
| **Phase 5** | Customer Management & CRM | Contact management, lead pipeline, interactions, deals, quotes | Phase 1 |
| **Phase 6** | Email Marketing Engine | Templates, campaigns, bulk sending, open/click tracking | Phase 5 |
| **Phase 7** | Enhanced AI & Forecasting | Advanced ML models, real inventory data, automated reordering | Phase 2, Phase 4 |
| **Phase 8** | Data Migration | HubSpot + MRPeasy data export, cleaning, import, parallel testing | Phase 5, Phase 3 |
| **Phase 9** | Security Hardening & Infrastructure | Production deployment, backups, monitoring, WAF, audit trail | All phases |

```
Phase 1 (Foundation)
    │
    ├──→ Phase 2 (Operations & Inventory)
    │       │
    │       ├──→ Phase 3 (Manufacturing)
    │       │       │
    │       │       └──→ Phase 8 (Data Migration) ──→ Phase 9 (Security & Infra)
    │       │
    │       ├──→ Phase 4 (Shopify Integration)
    │       │       │
    │       │       └──→ Phase 7 (Enhanced AI)
    │       │
    │
    └──→ Phase 5 (CRM & Contacts)
            │
            ├──→ Phase 6 (Email Marketing)
            │
            └──→ Phase 8 (Data Migration)
```

---

## 3. Phase 1 — Foundation & Authentication

### Objective
Replace the current localStorage-only authentication with a secure, server-validated auth system with role-based access control.

### 3.1 Backend Tasks

#### 3.1.1 Database Schema — Auth Tables
- Create `users` table (id, email, password_hash, name, role, is_active, last_login_at, timestamps)
- Create `sessions` table (id, user_id, token, expires_at, created_at)
- Create `audit_logs` table (id, user_id, action, entity_type, entity_id, payload_json, ip_address, created_at)
- Add migration script with forward/rollback capability
- Seed initial admin user account

#### 3.1.2 Authentication Service
- Install `bcrypt` for password hashing (cost factor 12)
- Install `jsonwebtoken` for JWT token generation
- Implement `authService.js`:
  - `register(email, password, name, role)` — hash password, insert user
  - `login(email, password)` — validate credentials, return JWT access token + refresh token
  - `refreshToken(token)` — validate refresh token, issue new access token
  - `logout(token)` — invalidate session
  - `changePassword(userId, oldPassword, newPassword)`

#### 3.1.3 Auth Middleware
- Create `authMiddleware.js`:
  - Extract and validate JWT from `Authorization: Bearer <token>` header
  - Attach `req.user` with `{ id, email, role }`
  - Return 401 for invalid/expired tokens
- Create `rbacMiddleware.js`:
  - Accept array of allowed roles
  - Return 403 if user role not in allowed list
  - Role hierarchy: `admin` > `sales` > `operations` > `workshop` > `viewer`

#### 3.1.4 Auth Routes
- `POST /api/auth/login` — authenticate user, return tokens
- `POST /api/auth/register` — admin-only user creation
- `POST /api/auth/refresh` — refresh access token
- `POST /api/auth/logout` — invalidate session
- `POST /api/auth/change-password` — authenticated password change
- `GET /api/auth/me` — return current user profile

#### 3.1.5 Protect Existing Routes
- Apply `authMiddleware` to all `/api/*` routes
- Apply `rbacMiddleware` with appropriate role requirements:
  - Orders: `admin`, `sales`, `operations`
  - Analytics: `admin`, `sales`, `operations`
  - AI endpoints: `admin`, `sales`
  - Alerts: `admin`
  - User management: `admin` only

#### 3.1.6 Rate Limiting
- Install `express-rate-limit`
- Configure per-endpoint limits:
  - Auth endpoints: 10 requests/minute
  - API endpoints: 100 requests/minute
  - AI endpoints: 20 requests/minute

#### 3.1.7 API Security Improvements
- Configure CORS to allow only known frontend origins
- Add `helmet` for security headers
- Add request payload size limits

### 3.2 Frontend Tasks

#### 3.2.1 Auth State Management
- Replace localStorage auth with a proper auth context/provider
- Store JWT tokens in httpOnly cookies or secure memory
- Implement automatic token refresh logic
- Add auth state persistence across page reloads

#### 3.2.2 Login Page Update
- Update `SignIn.tsx` to call `POST /api/auth/login`
- Add proper form validation (email format, password minimum length)
- Display server-side error messages
- Add "Forgot Password" link (initially disabled, placeholder)

#### 3.2.3 Protected Route Wrapper
- Create `AuthGuard` component that redirects to login if no valid session
- Apply `AuthGuard` to all `/dashboard/*` routes
- Show role-appropriate navigation items in sidebar

#### 3.2.4 User Profile Dropdown
- Add user avatar/name in the app header
- Dropdown with: My Profile, Change Password, Logout
- Show user role badge

#### 3.2.5 Admin: User Management Page
- New page: `/dashboard/settings/users`
- Table listing all users (name, email, role, status, last login)
- Create user dialog (email, name, password, role)
- Edit user dialog (name, role, active/inactive toggle)
- Delete/deactivate user confirmation

---

## 4. Phase 2 — Core Operations & Inventory

### Objective
Build the product catalog, real inventory tracking, warehouse management, and supplier database that replaces MRPeasy's core inventory functions.

### 4.1 Backend Tasks

#### 4.1.1 Database Schema — Inventory Tables
- Create `products` table (SKU, name, description, category, prices, Shopify ID)
- Create `warehouses` table (name, location)
- Create `inventory_stock` table (product, warehouse, on_hand, reserved, reorder point)
- Create `stock_movements` table (product, warehouse, type, quantity, reference, user)
- Create `suppliers` table (name, contact, lead time, payment terms)
- Create `purchase_orders` + `purchase_order_lines` tables

#### 4.1.2 Product Service
- `createProduct(data)` — create product with SKU validation
- `updateProduct(id, data)` — update product details
- `getProducts(filters)` — paginated list with search, category filter
- `getProduct(id)` — single product with inventory levels across warehouses
- `deactivateProduct(id)` — soft delete

#### 4.1.3 Inventory Service
- `getStockLevels(productId)` — current stock across all warehouses
- `adjustStock(productId, warehouseId, quantity, reason)` — manual adjustment
- `transferStock(productId, fromWarehouse, toWarehouse, quantity)` — inter-warehouse
- `reserveStock(productId, warehouseId, quantity, referenceId)` — for orders
- `releaseReservation(reservationId)` — cancel reservation
- `getStockMovementHistory(productId, filters)` — audit trail

#### 4.1.4 Purchase Order Service
- `createPurchaseOrder(supplierId, lines)` — draft PO
- `submitPurchaseOrder(id)` — send to supplier
- `receivePurchaseOrder(id, receivedLines)` — record goods receipt, update stock
- `cancelPurchaseOrder(id)` — cancel with reason

#### 4.1.5 API Routes — Inventory
- `GET /api/products` — list products (paginated, searchable)
- `POST /api/products` — create product
- `GET /api/products/:id` — product details with stock
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — deactivate product
- `GET /api/inventory/stock` — stock levels (filterable by warehouse, product)
- `POST /api/inventory/adjust` — manual stock adjustment
- `POST /api/inventory/transfer` — inter-warehouse transfer
- `GET /api/inventory/movements` — stock movement history

#### 4.1.6 API Routes — Purchase Orders
- `GET /api/purchase-orders` — list POs
- `POST /api/purchase-orders` — create PO
- `GET /api/purchase-orders/:id` — PO details with lines
- `PUT /api/purchase-orders/:id/submit` — submit PO
- `PUT /api/purchase-orders/:id/receive` — receive goods
- `PUT /api/purchase-orders/:id/cancel` — cancel PO

#### 4.1.7 API Routes — Suppliers
- Full CRUD for suppliers: `GET`, `POST`, `PUT`, `DELETE` on `/api/suppliers`

### 4.2 Frontend Tasks

#### 4.2.1 Product Catalog Page
- New page: `/dashboard/products`
- Paginated table with: SKU, Name, Category, Price, Stock Level, Status
- Search by SKU/name
- Filter by category, stock status (in stock, low stock, out of stock)
- Product detail view with stock by warehouse and movement history

#### 4.2.2 Inventory Management Page
- New page: `/dashboard/inventory`
- Real-time stock levels dashboard
- Stock level cards with color-coded status (green/yellow/red)
- Stock adjustment form
- Inter-warehouse transfer form
- Stock movement history table

#### 4.2.3 Purchase Orders Page
- New page: `/dashboard/purchase-orders`
- PO list with status badges
- Create PO form: select supplier, add line items, quantities, prices
- PO detail view with goods receipt workflow
- PO status progression visualization

#### 4.2.4 Suppliers Page
- New page: `/dashboard/suppliers`
- Supplier directory with search
- Supplier detail: contact info, lead times, PO history
- Create/edit supplier forms

#### 4.2.5 Sidebar Navigation Update
- Add new sections to sidebar:
  - **Operations** group: Products, Inventory, Purchase Orders, Suppliers
  - **Manufacturing** group: (placeholder for Phase 3)
  - **CRM** group: (placeholder for Phase 5)

---

## 5. Phase 3 — Manufacturing & Production

### Objective
Build the manufacturing execution system with BOM management, work orders, production scheduling, and quality control.

### 5.1 Backend Tasks

#### 5.1.1 Database Schema — Manufacturing Tables
- Create `bill_of_materials` table (finished product, version, active)
- Create `bom_lines` table (BOM, component product, quantity required, unit)
- Create `work_orders` table (product, BOM, quantity, status, priority, dates, assigned user)
- Create `work_order_steps` table (work order, step number, name, status, timestamps)

#### 5.1.2 BOM Service
- `createBOM(productId, lines)` — create bill of materials
- `updateBOM(id, lines)` — version new BOM
- `getBOM(productId)` — active BOM with component tree
- `checkMaterialAvailability(bomId, quantity)` — can we produce N units?
- `explodeBOM(bomId, quantity)` — flatten component requirements

#### 5.1.3 Work Order Service
- `createWorkOrder(data)` — create work order from product/BOM
- `createFromOrder(orderId)` — auto-generate work order from sales order
- `updateWorkOrderStatus(id, status)` — progress work order
- `assignWorkOrder(id, userId)` — assign to workshop user
- `completeWorkOrder(id)` — mark complete, update stock (finished goods in, raw materials out)
- `getWorkOrders(filters)` — paginated list with status/priority filters
- `getProductionSchedule(dateRange)` — calendar view data

#### 5.1.4 API Routes — Manufacturing
- Full CRUD for BOMs: `/api/boms`
- Full CRUD for work orders: `/api/work-orders`
- `POST /api/work-orders/:id/start` — start production
- `POST /api/work-orders/:id/complete` — complete production
- `POST /api/work-orders/:id/steps/:stepId/complete` — complete a step
- `GET /api/production/schedule` — production calendar data
- `GET /api/production/capacity` — capacity utilization data

### 5.2 Frontend Tasks

#### 5.2.1 BOM Management Page
- New page: `/dashboard/manufacturing/bom`
- BOM list by finished product
- BOM detail view with component tree visualization
- Create/edit BOM form with dynamic line item addition
- Material availability checker

#### 5.2.2 Work Orders Page
- New page: `/dashboard/manufacturing/work-orders`
- Work order kanban board (Draft → Planned → In Progress → Completed)
- Work order list view with filters (status, priority, assigned user, date range)
- Work order detail view with step-by-step progress tracking
- Create work order form (select product, BOM, quantity, priority, dates)

#### 5.2.3 Production Schedule Page
- New page: `/dashboard/manufacturing/schedule`
- Calendar view of planned and active work orders
- Gantt-chart-style timeline view
- Capacity utilization visualization
- Drag-and-drop rescheduling (stretch goal)

#### 5.2.4 Workshop View (Restricted)
- New page: `/dashboard/workshop`
- Simplified view for workshop role users
- Only shows assigned work orders and current step
- Step completion buttons
- Material consumption recording

---

## 6. Phase 4 — Live Shopify Integration

### Objective
Replace the Zapier → MRPeasy → Webhook chain with direct Shopify integration for real-time data flow.

### 6.1 Backend Tasks

#### 6.1.1 Shopify Webhook Handler
- Install `@shopify/shopify-api` or implement manual webhook verification (HMAC)
- Create webhook endpoint: `POST /api/webhooks/shopify`
- Handle webhook topics:
  - `orders/create` — create order + create/update contact + reserve inventory
  - `orders/updated` — update order status
  - `orders/fulfilled` — mark order shipped, update stock
  - `orders/cancelled` — release reserved stock
  - `products/create`, `products/update` — sync product catalog
  - `customers/create`, `customers/update` — sync customer profiles
  - `inventory_levels/update` — sync inventory changes made in Shopify admin

#### 6.1.2 Shopify Admin API Client
- Create `shopifyService.ts` for outbound API calls:
  - `syncInventoryToShopify(productId, locationId, quantity)` — push stock levels
  - `getShopifyProducts()` — pull product catalog
  - `getShopifyOrders(since)` — pull recent orders (initial sync)
  - `getShopifyCustomers(since)` — pull customer data
  - `updateShopifyInventory(inventoryItemId, locationId, available)` — set stock level

#### 6.1.3 Sync Engine
- Create `shopifySyncService.ts`:
  - Bidirectional sync logic with conflict resolution (last-write-wins with logging)
  - Sync queue for outbound updates (prevent rate limiting)
  - Full initial sync capability (one-time import of all Shopify data)
  - Incremental sync for ongoing changes
  - Sync log table for audit/debugging

#### 6.1.4 Auto-Trigger Work Orders
- When a Shopify order arrives:
  1. Check if products in order have BOMs
  2. Check current stock levels
  3. If stock insufficient → auto-create work order
  4. If raw materials insufficient → auto-create purchase order suggestion

#### 6.1.5 Database Schema
- Create `shopify_sync_logs` table (direction, entity_type, entity_id, shopify_id, action, status)
- Add `shopify_product_id` to `products` table
- Add `shopify_customer_id` to `contacts` table
- Add `shopify_order_id` to `orders` table

### 6.2 Frontend Tasks

#### 6.2.1 Shopify Settings Page
- New page: `/dashboard/settings/integrations`
- Shopify connection status indicator
- Manual sync trigger buttons (Products, Orders, Customers, Inventory)
- Sync history log viewer
- Webhook configuration display

#### 6.2.2 Order Source Indicator
- Update Orders page to show source (Shopify, Manual, MRPeasy)
- Source icon/badge on order cards and table rows

---

## 7. Phase 5 — Customer Management & CRM

### Objective
Build a full contact management system that replaces HubSpot's core CRM functionality.

### 7.1 Backend Tasks

#### 7.1.1 Database Schema — CRM Tables
- Create `contacts` table (type, name, email, phone, address, Shopify ID, source, lead_score, lifecycle_stage, assigned_to)
- Create `interactions` table (contact, user, type, direction, subject, body, timestamps)
- Create `deals` table (contact, title, value, stage, probability, expected_close, assigned_to)
- Create `quotes` table (deal, contact, version, items, totals, status, valid_until)

#### 7.1.2 Contact Service
- `createContact(data)` — create with duplicate detection (email match)
- `updateContact(id, data)` — update contact fields
- `getContacts(filters)` — paginated list with type/stage/assigned filters
- `getContact(id)` — full profile with interactions, deals, orders, quotes
- `mergeContacts(primaryId, duplicateId)` — merge duplicate records
- `importContacts(csvData)` — bulk import from CSV

#### 7.1.3 Interaction Service
- `logInteraction(contactId, data)` — log call, email, meeting, note
- `getInteractions(contactId, filters)` — activity timeline
- `createTask(contactId, data)` — schedule follow-up task
- `completeTask(interactionId)` — mark task done

#### 7.1.4 Deal Service
- `createDeal(contactId, data)` — create new deal
- `updateDealStage(id, stage)` — move through pipeline
- `getDeals(filters)` — pipeline view data
- `getDealFunnel()` — conversion metrics per stage

#### 7.1.5 Quote Service
- `createQuote(dealId, items)` — generate quote
- `updateQuoteStatus(id, status)` — sent/accepted/declined
- `generateQuotePDF(id)` — create downloadable PDF

#### 7.1.6 API Routes — CRM
- Full CRUD for contacts: `/api/contacts`
- `POST /api/contacts/import` — CSV bulk import
- `POST /api/contacts/:id/merge` — merge duplicates
- Full CRUD for interactions: `/api/contacts/:id/interactions`
- Full CRUD for deals: `/api/deals`
- `GET /api/deals/pipeline` — pipeline summary
- Full CRUD for quotes: `/api/quotes`
- `GET /api/quotes/:id/pdf` — download PDF

### 7.2 Frontend Tasks

#### 7.2.1 Contacts Page
- New page: `/dashboard/crm/contacts`
- Contact list table with: Name, Company, Email, Type, Stage, Assigned To
- Search by name/email/company/phone
- Filter by type (customer/lead/prospect), lifecycle stage
- Contact detail page: profile, activity timeline, associated deals, order history

#### 7.2.2 Contact Detail Page
- New page: `/dashboard/crm/contacts/:id`
- Contact profile header (name, company, email, phone, social)
- Activity timeline (chronological interactions)
- Log interaction buttons (Call, Email, Meeting, Note)
- Associated deals list
- Order history from `orders` table
- Lead score visualization

#### 7.2.3 Deals Pipeline Page
- New page: `/dashboard/crm/deals`
- Kanban board view with pipeline stages
- Drag-and-drop to move deals between stages
- Deal cards showing: title, contact, value, probability, expected close
- List view alternative with sorting/filtering
- Deal funnel chart

#### 7.2.4 Quotes Page
- New page: `/dashboard/crm/quotes`
- Quote list with status badges
- Create quote form: select deal/contact, add line items, set validity
- Quote preview with print/PDF option
- Quote status workflow (draft → sent → accepted/declined)

#### 7.2.5 CRM Dashboard
- New page: `/dashboard/crm`
- Pipeline value summary cards
- Lead conversion rates
- Upcoming follow-up tasks
- Recent interactions feed
- Sales team performance metrics (if multiple sales users)

---

## 8. Phase 6 — Email Marketing Engine

### Objective
Build bulk email campaign capabilities with template management, scheduling, and engagement tracking.

### 8.1 Backend Tasks

#### 8.1.1 Database Schema — Email Marketing Tables
- Create `email_templates` table (name, subject, html_body, created_by)
- Create `email_campaigns` table (name, template, status, schedule, metrics)
- Create `email_campaign_recipients` table (campaign, contact, status, timestamps)

#### 8.1.2 Template Service
- `createTemplate(data)` — save HTML template with merge tags
- `updateTemplate(id, data)` — edit template
- `previewTemplate(id, contactId)` — render with sample contact data
- `getTemplates()` — list all templates
- Merge tag system: `{{first_name}}`, `{{company}}`, `{{deal_value}}`, etc.

#### 8.1.3 Campaign Service
- `createCampaign(data)` — create campaign with template and recipient list
- `scheduleCampaign(id, scheduledAt)` — schedule for later
- `sendCampaign(id)` — immediate send
- `pauseCampaign(id)` / `cancelCampaign(id)` — stop mid-send
- `getCampaignAnalytics(id)` — open rates, click rates, bounces
- Background job for processing campaign send queue

#### 8.1.4 Tracking Service
- Generate unique tracking pixel per recipient
- Create redirect URLs for link tracking
- Webhook endpoint for bounce/unsubscribe events
- `GET /api/email/track/open/:token` — pixel tracking endpoint
- `GET /api/email/track/click/:token` — link click redirect

#### 8.1.5 Sending Infrastructure
- Batch sending with rate limiting (respect Resend/SendGrid limits)
- Retry failed sends with exponential backoff
- Unsubscribe management (honor opt-outs)
- Comply with CAN-SPAM/GDPR: unsubscribe link in every email

### 8.2 Frontend Tasks

#### 8.2.1 Email Template Builder
- New page: `/dashboard/marketing/templates`
- Template list with preview
- Template editor:
  - Rich text editor for email body
  - Merge tag insertion toolbar
  - HTML source view toggle
  - Live preview panel
  - Subject line editor with merge tags

#### 8.2.2 Campaign Management
- New page: `/dashboard/marketing/campaigns`
- Campaign list with status badges and metrics
- Create campaign wizard:
  1. Select/create template
  2. Choose recipients (all contacts, segment, manual selection)
  3. Schedule or send immediately
  4. Review and confirm
- Campaign detail: recipient list, delivery status, engagement metrics

#### 8.2.3 Email Analytics Dashboard
- New page: `/dashboard/marketing/analytics`
- Campaign performance overview: total sent, opened, clicked
- Engagement trends over time
- Best performing campaigns
- Contact engagement scoring

---

## 9. Phase 7 — Enhanced AI & Forecasting

### Objective
Upgrade the AI forecasting engine to use real inventory data, advanced ML models, and automated reordering.

### 9.1 Backend Tasks

#### 9.1.1 Real Inventory Integration
- Update `ai-report-engine.ts` to pull from `inventory_stock` table instead of estimating
- Replace synthetic stock level estimates with actual `quantity_on_hand`
- Use actual `reorder_point` values from product settings
- Use real `supplier.lead_time_days` for delivery predictions

#### 9.1.2 Python Forecasting Microservice (Optional)
- Create standalone Python service for advanced forecasting:
  - Facebook Prophet for time-series forecasting with seasonality
  - scikit-learn for demand classification
  - API endpoint: `POST /forecast/sales` — accepts historical data, returns predictions
  - API endpoint: `POST /forecast/inventory` — accepts stock + demand, returns reorder suggestions
- Docker container for isolated deployment
- HTTP bridge from Node.js backend to Python service

#### 9.1.3 Seasonality & Trend Enhancement
- Add monthly/quarterly seasonality decomposition
- Holiday detection for Australian market (Christmas, EOFY, etc.)
- Trend detection with changepoint analysis
- Demand clustering (group similar SKUs for better predictions)

#### 9.1.4 Automated Reorder Engine
- Service that runs on schedule:
  1. For each product, compare stock vs predicted demand
  2. If stock < reorder_point + lead_time_demand → generate PO draft
  3. Group by supplier for efficient purchasing
  4. Send notification to purchasing team
  5. Log all auto-generated suggestions for audit

#### 9.1.5 AI Model Upgrade
- Evaluate paid OpenRouter models for production accuracy
- Add model performance monitoring (track fallback rate)
- Implement A/B testing between models
- Cache AI responses more aggressively with content-based invalidation

### 9.2 Frontend Tasks

#### 9.2.1 Enhanced Forecasting Dashboard
- Update AI Analytics page with real stock data visualizations
- Add seasonality chart showing demand patterns
- Add demand vs supply overlay chart
- Confidence interval visualization improvements

#### 9.2.2 Automated Reorder Suggestions
- New section on Inventory page: "AI Reorder Suggestions"
- Show suggested POs with one-click "Create Purchase Order" action
- Historical accuracy display: predicted vs actual demand comparison

---

## 10. Phase 8 — Data Migration

### Objective
Safely migrate all historical data from HubSpot and MRPeasy into the new unified system.

### 10.1 Pre-Migration Tasks

#### 10.1.1 Data Audit
- Export all data from HubSpot via API:
  - Contacts (name, email, phone, company, lifecycle stage)
  - Companies
  - Deals (pipeline, stage, value, close date)
  - Activities (emails, calls, meetings, notes)
  - Email marketing data (campaigns, templates, lists)
- Export all data from MRPeasy via API/CSV:
  - Customer orders (historical)
  - Products & BOMs
  - Inventory levels & stock history
  - Work orders & production history
  - Purchase orders
  - Supplier information
- Document all data formats, field mappings, and relationships

#### 10.1.2 Field Mapping Document
- Create detailed mapping: HubSpot field → New system field
- Create detailed mapping: MRPeasy field → New system field
- Identify unmappable fields → decide: create new fields or discard
- Identify data type conversions (dates, currencies, enums)

### 10.2 Migration Development

#### 10.2.1 Migration Scripts
- Create `migration/hubspot-import.js`:
  - Read HubSpot export → transform → insert into `contacts`, `interactions`, `deals`
  - Handle deduplication (same contact in HubSpot and MRPeasy)
  - Map HubSpot lifecycle stages to new system stages
- Create `migration/mrpeasy-import.js`:
  - Read MRPeasy export → transform → insert into `products`, `inventory_stock`, `work_orders`, `suppliers`, `purchase_orders`
  - Convert MRPeasy order format to new `orders` format
  - Reconstruct BOM relationships
- Create `migration/shopify-initial-sync.js`:
  - Pull all products from Shopify API
  - Pull all orders from Shopify API
  - Pull all customers from Shopify API
  - Link with existing migrated data

#### 10.2.2 Data Cleaning Pipeline
- Remove duplicate contact records (email-based matching)
- Standardize phone number formats
- Validate email addresses
- Fix character encoding issues
- Standardize date formats to ISO
- Reconcile order histories between HubSpot and MRPeasy

#### 10.2.3 Validation Suite
- Row count validation: source count = destination count
- Revenue reconciliation: total revenue in MRPeasy = total revenue in new system
- Contact completeness check: no orphaned records
- Referential integrity check: all foreign keys valid
- Sample-based spot checks: randomly verify 50 records manually

### 10.3 Execution Strategy

#### 10.3.1 Staging Environment
- Set up isolated staging database with production-like data
- Run full migration on staging first
- Have team perform UAT (User Acceptance Testing) on staging
- Document all issues found and fix migration scripts

#### 10.3.2 Parallel Run Period
- Run new system alongside HubSpot/MRPeasy for a validation period
- Cross-reference new orders in both systems
- Monitor for data drift or sync issues
- Staff can compare old and new systems for accuracy

#### 10.3.3 Final Cutover
- Schedule during off-peak window (weekend)
- Freeze changes in HubSpot/MRPeasy
- Run final incremental migration
- Switch Shopify webhooks to point to new system
- Verify all integrations are operational
- Decommission Zapier webhooks to MRPeasy
- Keep HubSpot/MRPeasy in read-only mode for 30 days (safety net)

---

## 11. Phase 9 — Security Hardening & Infrastructure

### Objective
Production-grade deployment with enterprise security, monitoring, and backup systems.

### 11.1 Infrastructure Tasks

#### 11.1.1 Production Deployment
- Migrate from Vercel to dedicated cloud (AWS or GCP recommended):
  - Backend: Docker container on AWS ECS / GCP Cloud Run
  - Frontend: Static export or Vercel (keep current if acceptable)
  - Database: Dedicated MySQL instance (RDS / Cloud SQL) or upgrade TiDB tier
- Set up environment separation: development, staging, production
- Configure environment-specific variables

#### 11.1.2 Database Hardening
- Enable automated daily backups with 30-day retention
- Configure point-in-time recovery
- Set up read replica for analytics queries (if query volume warrants it)
- Database connection pooling configuration review
- Implement query timeout limits

#### 11.1.3 Monitoring & Alerting
- Integrate Sentry for error tracking (backend + frontend)
- Set up UptimeRobot or BetterUptime for availability monitoring
- Configure log aggregation (CloudWatch / Google Cloud Logging)
- Set up Slack/PagerDuty alerts for:
  - Server errors > threshold
  - Database connection failures
  - Shopify webhook processing failures
  - Cron job failures

#### 11.1.4 CDN & WAF
- Place Cloudflare in front of application
- Enable DDoS protection
- Configure WAF rules for common attack patterns
- Enable bot protection

### 11.2 Security Tasks

#### 11.2.1 Audit Trail
- Log all write operations to `audit_logs` table
- Include: user, action, entity, before/after state, IP address
- Admin-accessible audit log viewer

#### 11.2.2 Data Encryption
- Verify AES-256 encryption at rest on database
- Implement field-level encryption for sensitive PII (credit card info, tax IDs)
- Ensure all API communications use TLS 1.2+

#### 11.2.3 Security Review
- Conduct SQL injection audit on all raw queries
- Implement parameterized queries everywhere
- XSS prevention on all user-facing outputs
- CSRF protection on state-changing endpoints
- Dependency vulnerability scan (npm audit)

#### 11.2.4 Compliance
- Implement data export capability (GDPR right to data portability)
- Implement data deletion capability (GDPR right to erasure)
- Cookie consent management (if using tracking cookies)
- Privacy policy and terms of service page

---

## 12. Cross-Cutting Concerns (All Phases)

### 12.1 Testing Strategy
- **Unit Tests**: Core service logic (forecasting, analytics calculations, auth)
- **Integration Tests**: API endpoint testing with database
- **E2E Tests**: Critical user flows (login, create order, view analytics)
- Testing framework: Jest (backend) + Playwright (frontend)

### 12.2 Documentation
- API documentation using Swagger/OpenAPI spec
- Database ERD diagram
- Deployment runbook
- User manual for each module
- Admin guide for system configuration

### 12.3 Performance
- Database query optimization with indexes on frequently filtered columns
- API response pagination on all list endpoints
- Server-side caching for analytics (current 5-min TTL is good)
- Frontend lazy loading for heavy chart components
- Image optimization for product photos

---

## 13. Existing Code Reuse Summary

The following existing capabilities carry forward without major changes:

| Component | Reusable? | Notes |
|-----------|-----------|-------|
| Express server setup | ✅ Yes | Add middleware, keep structure |
| MySQL connection pool | ✅ Yes | Same `db.js` config |
| Order ingestion webhook | ✅ Yes | Add to Shopify handler |
| Analytics engine (10 modules) | ✅ Yes | Update to use real inventory data |
| AI report engine | ✅ Yes | Update data sources |
| AI chatbot | ✅ Yes | Expand data context |
| Email service (Resend) | ✅ Yes | Add campaign sending |
| Scheduled reports | ✅ Yes | Add CRM metrics |
| Event alerts | ✅ Yes | Add CRM-related alerts |
| Frontend UI component library | ✅ Yes | shadcn/ui components reuse |
| Chart components (11 charts) | ✅ Yes | Add new chart types |
| Dashboard layout/sidebar | ✅ Yes | Expand navigation |
| OpenRouter AI integration | ✅ Yes | Consider paid models |
| React Query data fetching | ✅ Yes | Add new queries |

---

## 14. New Technology Decisions Required

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **ORM for new modules** | Raw SQL, Drizzle, Prisma | Drizzle (lightweight, TypeScript-native, works with MySQL) |
| **Auth tokens** | JWT + cookies, JWT + memory, session-based | JWT with httpOnly cookies |
| **File storage** | S3, GCS, Cloudflare R2 | Cloudflare R2 (cost-effective, S3-compatible) |
| **Email marketing provider** | Resend bulk, SendGrid, Amazon SES | Resend (already integrated) or SendGrid (better bulk features) |
| **Search engine** | MySQL FULLTEXT, MeiliSearch, Typesense | MySQL FULLTEXT for now; MeiliSearch if search becomes core |
| **Queue/background jobs** | node-cron (current), BullMQ + Redis, pg-boss | BullMQ + Redis (reliable, distributed, handles campaign sends) |
| **Python ML service** | Standalone API, embedded Python, managed ML | Standalone Docker service with REST API |
| **PDF generation** | Puppeteer, jsPDF, React-PDF | React-PDF (server-side rendering) or Puppeteer (HTML → PDF) |
| **Hosting** | Vercel, AWS ECS, GCP Cloud Run, Railway | AWS ECS or GCP Cloud Run for full platform control |

---

## 15. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration introduces errors | Medium | High | Parallel run period + automated validation suite |
| Shopify API rate limits during sync | Medium | Medium | Queue-based sync with backoff + batch operations |
| MRPeasy API lacks export for all needed data | Medium | High | Early discovery phase to catalog all available data |
| HubSpot export misses email thread content | Low | Medium | Document what cannot be migrated, set expectations |
| AI model costs increase with production use | Medium | Medium | Start with free models, monitor usage, budget for paid |
| Manufacturing workflows don't match Vaclift process | Medium | High | Discovery interviews with workshop staff before building Phase 3 |
| Performance degrades with larger dataset | Low | Medium | Database indexing strategy, query optimization, read replicas |
| Staff resistance to new system | Medium | High | Parallel run period, training sessions, gradual feature rollout |
