# Role-Based Authentication System — Design Document

> **Project:** Vaclift Dashboard  
> **Date:** 2026-07-08 
> **Status:** Approved
> **Repos:** `custom-ai-dashboard-mrpeasy` (Frontend / Next.js) · `mrpeasy-vaclift-backend` (Backend / Express + TiDB)

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Target Architecture](#2-target-architecture)
3. [Role Hierarchy & Permissions Model](#3-role-hierarchy--permissions-model)
4. [Dashboard Modules / Sections](#4-dashboard-modules--sections)
5. [Database Changes (TiDB Migrations)](#5-database-changes-tidb-migrations)
6. [Backend Changes](#6-backend-changes)
7. [Frontend Changes](#7-frontend-changes)
8. [Super Admin Seeding (`.env`)](#8-super-admin-seeding-env)
9. [API Contract (Endpoints)](#9-api-contract-endpoints)
10. [Security Considerations](#10-security-considerations)
11. [Migration / Rollout Plan](#11-migration--rollout-plan)
12. [File-Level Change Inventory](#12-file-level-change-inventory)

---

## 1. Current State Audit

### 1.1 What Exists Today

| Layer | File(s) | What It Does | Problems |
|-------|---------|-------------|----------|
| **Login API** | `src/routes/authRoutes.js` → `src/controller/authController.js` | Single `POST /api/auth/login` endpoint. Looks up user by email in `users` table, verifies scrypt hash, returns a JWT with `{ id, email, role }`. | JWT uses a **hardcoded fallback secret** (`your_fallback_secret_key_change_me_in_prod`). There is no `JWT_SECRET` in `.env`. |
| **Token Utility** | `src/utils/authToken.js` | Custom HS256 JWT sign/verify (separate from the `jsonwebtoken` library used in `authController.js`). Two competing JWT implementations coexist. | `requireAuth` middleware uses `authToken.js`, but `authController.login` uses the `jsonwebtoken` npm package — **token format mismatch** means `requireAuth` likely rejects tokens issued by `login`. |
| **Auth Middleware** | `src/middleware/requireAuth.js` | Extracts `Bearer` token from `Authorization` header, verifies via `authToken.js`. Sets `req.auth`. | Only used on **4 route files** (calendar, search, dashboard, tasks). The remaining **24 route files are completely unprotected**. |
| **Permission Middleware** | `src/middleware/checkPermission.js` | Checks `permissions` table by role name. Bypasses check entirely if role is `'Admin'`. Falls back to `role = 'Admin'` when `req.user` is missing. | **Never actually used** on any route (only imported in `adminRoutes.js` with a comment "for future use"). `req.user` is never set — middleware reads `req.user` but `requireAuth` sets `req.auth`. |
| **Users Table** | `createUser.js` (standalone script) | Creates `users` table with columns: `id, name, email, password, role`. Hardcoded user: `kemal@bweng.com.au` / `Pass@123` / role `admin`. | Users created via script only. No `super_admin` role concept. `role` is a freetext `VARCHAR(50)` — no FK to `roles` table. |
| **Roles & Permissions Tables** | `src/config/initDb.js` | Creates `roles` table (id, name, description, is_system) and `permissions` table (role_id, module, action, is_allowed). | Tables exist but are **empty** — no seed data. No relationship between `users.role` (string) and `roles.id` (integer). |
| **Admin Service** | `src/services/adminService.js` | CRUD for users, roles, permissions. Uses `bcryptjs` to hash passwords (different from `authController.js` which expects scrypt). | **Password hashing mismatch**: `adminService.createUser` uses `bcryptjs`, but `authController.login` verifies with `scrypt`. Users created through the admin panel **cannot log in**. |
| **Admin Routes** | `src/routes/adminRoutes.js` | Full CRUD for users, roles, permissions, audit log, settings. **No auth middleware applied.** | Completely open — anyone can create/delete users, change roles, read audit logs without authentication. |
| **Frontend Login** | `src/components/forms/SignIn.tsx` | Calls `POST /api/auth/login`, stores `{ isLoggedIn, token, user, role }` in `localStorage`. | Token is stored but **never sent** in subsequent API requests — the `Authorization: Bearer` header is missing from all `fetch` calls in `src/services/api.ts`. |
| **Frontend Auth Hook** | `src/hooks/use-auth.ts` | Reads auth state from `localStorage`. Defines `Role = "Admin" \| "User" \| "Guest"`. | No permission-based filtering of UI. All sidebar items visible to all logged-in users. No route guards beyond the login page redirect. |
| **Dashboard Sidebar** | `src/components/common/app-sidebar.tsx` | Renders navigation items. No filtering based on user role or permissions. | Every user sees every module regardless of access rights. |

### 1.2 Critical Bugs in Current System

1. **JWT Mismatch**: `authController.login` signs tokens with `jsonwebtoken` (npm), but `requireAuth` verifies tokens with the custom `authToken.js` (HMAC). Different implementations, potentially different secrets → **tokens created at login are rejected by the auth middleware**.

2. **Password Hash Mismatch**: `createUser.js` and `authController.js` use `scrypt`, but `adminService.createUser` uses `bcryptjs` → users created through the admin API **cannot log in**.

3. **Token Never Sent**: The frontend stores the JWT in `localStorage` but **zero API calls** include the `Authorization` header → the 4 routes that do require auth will always return 401.

4. **24 of 28 Route Files Unprotected**: No auth middleware on CRM, Sales, Inventory, Orders, Production, Procurement, Reports, Admin, Email, or AI routes.

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                                                                 │
│  Login Page ──► POST /api/auth/login                            │
│       │                                                         │
│       ▼                                                         │
│  localStorage: { token, user: { id, role, permissions[] } }     │
│       │                                                         │
│       ▼                                                         │
│  AuthProvider (Context) ──► useAuth() hook                      │
│       │                                                         │
│       ├── Route Guards (redirect if no access)                  │
│       ├── Sidebar Filtering (hide inaccessible modules)         │
│       └── API Client (auto-attach Bearer token)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express + TiDB)                    │
│                                                                 │
│  requireAuth ──► verifies JWT, sets req.auth                    │
│       │                                                         │
│       ▼                                                         │
│  requireRole('super_admin') ──► checks role hierarchy           │
│       │                                                         │
│       ▼                                                         │
│  checkModuleAccess('crm') ──► checks user_permissions table     │
│       │                                                         │
│       ▼                                                         │
│  Route Handler                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| JWT Library | Consolidate on `authToken.js` (custom HS256) | Already used by `requireAuth`. Remove `jsonwebtoken` dependency. Single implementation. |
| Password Hashing | Consolidate on `scrypt` (`src/utils/passwordHash.js`) | Already has hash + verify. Remove `bcryptjs` usage. Native Node.js, no dependency. |
| Role Storage | `users.role` column stores role string (`super_admin`, `admin`, `user`) | Simple. No join needed for auth checks. |
| Permissions Storage | `user_permissions` table (per-user, per-module) | Allows super admins to grant per-user module access via checkboxes. |
| Super Admin Source | First super admin seeded from `.env` vars (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`) | Bootstrapping without a DB. Subsequent super admins created through the UI. |

---

## 3. Role Hierarchy & Permissions Model

### 3.1 Roles

| Role | Code | Description | Who Creates Them |
|------|------|-------------|-----------------|
| **Super Admin** | `super_admin` | Full unrestricted access to all modules + can create other super admins and admins | Seeded from `.env` or created by another super admin |
| **Admin** | `admin` | Access restricted to modules explicitly granted by a super admin (checkbox-based) | Created by a super admin |
| **User** | `user` | *(Future)* Read-only or further restricted access | Created by an admin or super admin |

### 3.2 Permission Rules

```
super_admin:
  - ALL modules: ✅ (implicit, no DB lookup needed)
  - Can create super_admin: ✅
  - Can create admin: ✅
  - Can assign module permissions to admins: ✅

admin:
  - Module access: ONLY what is checked in user_permissions table
  - Can create admin: ❌
  - Can create super_admin: ❌

user:
  - Module access: ONLY what is checked in user_permissions table
  - Can create anyone: ❌
```

### 3.3 Module Definitions (Sections)

Permissions are granted at the **module level** — a checkbox per module. Each module maps to a sidebar section and its corresponding backend routes.

---

## 4. Dashboard Modules / Sections

These are the permissionable modules. Each maps 1:1 to a sidebar section and a set of backend API routes.

| Module Key | Display Name | Frontend Routes | Backend Route Prefixes |
|-----------|-------------|-----------------|----------------------|
| `dashboard` | Dashboard Overview | `/dashboard` | `/api/dashboard/*`, `/api/analytics` |
| `ai_analytics` | AI Analytics | `/dashboard/ai-analytics` | `/api/ai-report`, `/api/ai-chat` |
| `crm` | CRM | `/dashboard/crm/**` | `/api/crm/*`, `/api/contacts`, `/api/companies`, `/api/deals`, `/api/leads`, `/api/opportunities`, `/api/activities`, `/api/owners` |
| `orders` | Orders | `/dashboard/orders` | `/api/orders` |
| `sales` | Sales | `/dashboard/sales/**` | `/api/sales/*` |
| `inventory` | Inventory | `/dashboard/inventory/**` | `/api/inventory/*` |
| `production` | Production | `/dashboard/production/**` | `/api/production/*`, `/api/bom/*`, `/api/products` |
| `procurement` | Procurement | `/dashboard/procurement/**` | `/api/procurement/*` |
| `reports` | Reports | `/dashboard/reports/**` | `/api/reports/*` |
| `email` | Email & Templates | `/dashboard/crm/emails` | `/api/emails/*` |
| `admin` | Administration | `/dashboard/admin/**` | `/api/admin/*` |

> **Note:** `admin` module access is always restricted to `super_admin` role users only. It cannot be checkbox-granted to regular admins.

---

## 5. Database Changes (TiDB Migrations)

### 5.1 ALTER `users` Table

```sql
-- Add new columns for role-based auth
ALTER TABLE users
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN created_by INT NULL,
  ADD COLUMN last_login TIMESTAMP NULL;

-- Update existing role values to use new naming convention
-- (run once during migration)
UPDATE users SET role = 'admin' WHERE role = 'admin';
UPDATE users SET role = 'user' WHERE role = 'user' OR role = 'User';
```

### 5.2 CREATE `user_permissions` Table

```sql
CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module VARCHAR(64) NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_module (user_id, module),
  KEY idx_up_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.3 Seed Super Admin (Application-Level, On Startup)

On server boot, **if** `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are set in `.env`:

1. Check if a user with that email exists.
2. If not → create user with `role = 'super_admin'`, hashed password via scrypt.
3. If yes → ensure `role = 'super_admin'` and update password hash if changed.

This ensures the super admin always exists and matches the `.env` credentials.

### 5.4 Full Migration Script

```sql
-- Migration: RBAC Auth System
-- Database: TiDB (MySQL-compatible)
-- Run with: mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < migration.sql

-- 1. Alter users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by INT NULL,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- 2. Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module VARCHAR(64) NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_module (user_id, module),
  KEY idx_up_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. Backend Changes

### 6.1 Fix JWT Implementation (Consolidate)

**File:** `src/controller/authController.js`

- Remove `jsonwebtoken` dependency.
- Use `signAuthToken` from `src/utils/authToken.js` instead.
- Include `permissions` array in the JWT payload (for quick frontend access).

```js
// BEFORE (broken):
const jwt = require("jsonwebtoken");
const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: "24h" });

// AFTER (fixed):
const { signAuthToken } = require("../utils/authToken");
const token = signAuthToken({ id: user.id, email: user.email, role: user.role, permissions });
```

### 6.2 Fix Password Hashing (Consolidate)

**File:** `src/services/adminService.js`

- Remove `bcryptjs` import.
- Use `hashPassword` from `src/utils/passwordHash.js`.

```js
// BEFORE (mismatched):
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash(password || 'password123', 10);

// AFTER (consistent):
const { hashPassword } = require('../utils/passwordHash');
const hash = await hashPassword(password);
```

### 6.3 Add `.env` Variables

```env
# --- Auth ---
AUTH_TOKEN_SECRET=<generate-a-strong-64-char-random-string>

# --- Super Admin Seeding ---
SUPER_ADMIN_EMAIL=admin@vacliftaustralia.com
SUPER_ADMIN_PASSWORD=<strong-password-here>
SUPER_ADMIN_NAME=Super Admin
```

### 6.4 Super Admin Seeder (New File)

**New File:** `src/config/seedSuperAdmin.js`

```js
const pool = require("./db");
const { hashPassword } = require("../utils/passwordHash");

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.log("[Seed] SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set, skipping seed.");
    return;
  }

  const [existing] = await pool.execute("SELECT id, role FROM users WHERE email = ?", [email]);

  if (existing.length === 0) {
    const hash = await hashPassword(password);
    await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'super_admin')",
      [name, email, hash]
    );
    console.log(`[Seed] Super admin created: ${email}`);
  } else if (existing[0].role !== "super_admin") {
    await pool.execute("UPDATE users SET role = 'super_admin' WHERE id = ?", [existing[0].id]);
    console.log(`[Seed] Upgraded existing user to super_admin: ${email}`);
  } else {
    console.log(`[Seed] Super admin already exists: ${email}`);
  }
}

module.exports = { seedSuperAdmin };
```

Call in `src/index.js` after `initDb()`.

### 6.5 New Middleware: `requireRole`

**New File:** `src/middleware/requireRole.js`

```js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.auth?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Requires role: ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
```

### 6.6 New Middleware: `checkModuleAccess`

**New File:** `src/middleware/checkModuleAccess.js`

```js
const pool = require("../config/db");

function checkModuleAccess(moduleName) {
  return async (req, res, next) => {
    try {
      const { role, id: userId } = req.auth;

      // Super admins bypass all permission checks
      if (role === "super_admin") {
        return next();
      }

      // Check user-specific module permission
      const [rows] = await pool.execute(
        "SELECT is_allowed FROM user_permissions WHERE user_id = ? AND module = ? LIMIT 1",
        [userId, moduleName]
      );

      if (!rows.length || !rows[0].is_allowed) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message: `No access to module: ${moduleName}`,
        });
      }

      next();
    } catch (error) {
      console.error("Module access check error:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };
}

module.exports = { checkModuleAccess };
```

### 6.7 Apply Auth to All Routes

**Every route file** must be updated to include `requireAuth` and the appropriate `checkModuleAccess`. Example pattern:

```js
// src/routes/contactsRoutes.js — BEFORE
router.get("/crm/contacts", contactsController.getContacts);

// src/routes/contactsRoutes.js — AFTER
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/contacts", requireAuth, checkModuleAccess("crm"), contactsController.getContacts);
```

**Route-to-Module Mapping:**

| Route File | Module Key |
|-----------|-----------|
| `authRoutes.js` | *(no auth needed — this IS the login)* |
| `dashboardRoutes.js` | `dashboard` |
| `analyticsRoutes.js` | `dashboard` |
| `aiRoutes.js` | `ai_analytics` |
| `crmStatsRoutes.js` | `crm` |
| `contactsRoutes.js` | `crm` |
| `companiesRoutes.js` | `crm` |
| `dealsRoutes.js` | `crm` |
| `leadsRoutes.js` | `crm` |
| `opportunitiesRoutes.js` | `crm` |
| `activitiesRoutes.js` | `crm` |
| `ownersRoutes.js` | `crm` |
| `tagsRoutes.js` | `crm` |
| `emailRoutes.js` | `email` |
| `orderRoutes.js` | `orders` |
| `quotationsRoutes.js` | `sales` |
| `salesOrdersRoutes.js` | `sales` |
| `productsRoutes.js` | `production` |
| `bomRoutes.js` | `production` |
| `productionRoutes.js` | `production` |
| `procurementRoutes.js` | `procurement` |
| `inventoryRoutes.js` | `inventory` |
| `reportsRoutes.js` | `reports` |
| `adminRoutes.js` | `admin` (+ `requireRole('super_admin')`) |
| `calendarRoutes.js` | `dashboard` |
| `tasksRoutes.js` | `dashboard` |
| `searchRoutes.js` | *(auth only, no module check — global feature)* |
| `eventAlertsRoutes.js` | `dashboard` |

### 6.8 Update Login Response

The login endpoint should return the user's permissions so the frontend knows what to show:

```js
// In authController.login, after successful password verification:

// Fetch user permissions
const [permRows] = await pool.execute(
  "SELECT module FROM user_permissions WHERE user_id = ? AND is_allowed = TRUE",
  [user.id]
);
const permissions = permRows.map(r => r.module);

// For super_admin, return all modules
const allModules = [
  "dashboard", "ai_analytics", "crm", "orders", "sales",
  "inventory", "production", "procurement", "reports", "email", "admin"
];

const userPermissions = user.role === "super_admin" ? allModules : permissions;

const token = signAuthToken({
  id: user.id,
  email: user.email,
  role: user.role,
  permissions: userPermissions,
});

res.json({
  success: true,
  token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: userPermissions,
  },
});
```

### 6.9 Admin User Management Endpoints (Updated)

| Method | Endpoint | Role Required | Description |
|--------|----------|--------------|-------------|
| `GET` | `/api/admin/users` | `super_admin` | List all users with their permissions |
| `POST` | `/api/admin/users` | `super_admin` | Create a new admin/super_admin user |
| `PUT` | `/api/admin/users/:id` | `super_admin` | Update user role, name, active status |
| `DELETE` | `/api/admin/users/:id` | `super_admin` | Deactivate (soft-delete) a user |
| `PUT` | `/api/admin/users/:id/permissions` | `super_admin` | Update module permissions (checkbox array) |
| `GET` | `/api/admin/users/:id/permissions` | `super_admin` | Get a user's module permissions |
| `POST` | `/api/admin/users/:id/reset-password` | `super_admin` | Reset a user's password |

**Create User Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "admin",
  "permissions": ["crm", "sales", "inventory"]
}
```

**Update Permissions Request Body:**
```json
{
  "permissions": ["crm", "sales", "inventory", "orders"]
}
```

---

## 7. Frontend Changes

### 7.1 API Client — Attach Bearer Token

**File:** `src/services/api.ts`

Create a wrapper around `fetch` that auto-attaches the token:

```typescript
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const auth = JSON.parse(raw);
    return auth?.token || null;
  } catch {
    return null;
  }
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Auto-logout on 401
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("auth");
    window.location.href = "/";
  }

  return response;
}
```

Then replace all `fetch(...)` calls with `authFetch(...)`.

### 7.2 Enhanced Auth Hook & Context

**File:** `src/hooks/use-auth.ts` — enhance with permissions:

```typescript
type Role = "super_admin" | "admin" | "user";

interface AuthState {
  isLoggedIn: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
    permissions: string[];
  } | null;
  role: Role;
  permissions: string[];
}

// Helper functions
export function hasModuleAccess(auth: AuthState, module: string): boolean {
  if (!auth.isLoggedIn) return false;
  if (auth.role === "super_admin") return true;
  return auth.permissions.includes(module);
}

export function isSuperAdmin(auth: AuthState): boolean {
  return auth.role === "super_admin";
}
```

### 7.3 Sidebar Filtering

**File:** `src/components/common/app-sidebar.tsx`

Filter `navItems` based on user permissions:

```typescript
// Module key mapping for each nav item
const navItemModuleMap: Record<string, string> = {
  "Overview": "dashboard",
  "AI Analytics": "ai_analytics",
  "CRM": "crm",
  "Orders": "orders",
  "Sales": "sales",
  "Inventory": "inventory",
  "Production": "production",
  "Procurement": "procurement",
  "Reports": "reports",
  "Administration": "admin",
};

// In the component:
const auth = useAuth();
const filteredNavItems = navItems.filter(item => {
  const moduleKey = navItemModuleMap[item.name];
  if (!moduleKey) return true; // No restriction
  return hasModuleAccess(auth, moduleKey);
});
```

### 7.4 Route Guards

**New File:** `src/components/auth/RouteGuard.tsx`

```typescript
"use client";

import { useAuth, hasModuleAccess } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RouteGuardProps {
  module: string;
  children: React.ReactNode;
}

export function RouteGuard({ module, children }: RouteGuardProps) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoggedIn) {
      router.replace("/");
      return;
    }

    if (!hasModuleAccess(auth, module)) {
      router.replace("/dashboard?error=no-access");
    }
  }, [auth, module, router]);

  if (!auth.isLoggedIn || !hasModuleAccess(auth, module)) {
    return null; // or a loading/access denied UI
  }

  return <>{children}</>;
}
```

Usage in pages:
```tsx
// src/app/dashboard/crm/page.tsx
export default function CRMPage() {
  return (
    <RouteGuard module="crm">
      <CRMContent />
    </RouteGuard>
  );
}
```

### 7.5 Admin Panel — User Management UI

**New Pages:**

| Path | Purpose |
|------|---------|
| `/dashboard/admin` | Admin overview (user count, recent activity) |
| `/dashboard/admin/users` | User list with create/edit/delete |
| `/dashboard/admin/users/[id]` | Edit user + module permission checkboxes |

**Permission Checkboxes UI:**

```
┌─────────────────────────────────────────────┐
│  Module Permissions for "John Doe"          │
│                                             │
│  ☑ Dashboard Overview                       │
│  ☑ AI Analytics                             │
│  ☑ CRM                                      │
│  ☐ Orders                                   │
│  ☑ Sales                                    │
│  ☑ Inventory                                │
│  ☐ Production                               │
│  ☐ Procurement                              │
│  ☐ Reports                                  │
│  ☑ Email & Templates                        │
│                                             │
│           [ Save Permissions ]              │
└─────────────────────────────────────────────┘
```

---

## 8. Super Admin Seeding (`.env`)

### Backend `.env` Additions

```env
# ─── Auth Token ───
AUTH_TOKEN_SECRET=your-64-char-secure-random-string-here

# ─── Super Admin Bootstrap ───
SUPER_ADMIN_EMAIL=admin@vacliftaustralia.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
SUPER_ADMIN_NAME=Super Admin
```

### Behavior

1. On every server start, `seedSuperAdmin()` runs after `initDb()`.
2. If `SUPER_ADMIN_EMAIL` user doesn't exist → creates with `role = 'super_admin'`.
3. If user exists but role ≠ `super_admin` → upgrades role.
4. If user exists and is super_admin → no-op.
5. **Changing the `.env` password** doesn't auto-update the DB password (for safety). To force reset, delete the user first or add an explicit flag.

---

## 9. API Contract (Endpoints)

### 9.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login with email + password → returns JWT + user + permissions |
| `GET` | `/api/auth/me` | ✅ | Returns current user info + permissions (token refresh check) |
| `POST` | `/api/auth/change-password` | ✅ | Change own password |

### 9.2 User Management (Super Admin Only)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/admin/users` | ✅ | `super_admin` | List all users |
| `POST` | `/api/admin/users` | ✅ | `super_admin` | Create user (admin or super_admin) |
| `PUT` | `/api/admin/users/:id` | ✅ | `super_admin` | Update user details |
| `DELETE` | `/api/admin/users/:id` | ✅ | `super_admin` | Deactivate user |
| `PUT` | `/api/admin/users/:id/permissions` | ✅ | `super_admin` | Set module permissions |
| `GET` | `/api/admin/users/:id/permissions` | ✅ | `super_admin` | Get module permissions |
| `POST` | `/api/admin/users/:id/reset-password` | ✅ | `super_admin` | Reset user's password |

### 9.3 All Other Routes

Every other existing route receives `requireAuth` + `checkModuleAccess(moduleName)` middleware. No endpoint signature changes — only middleware is added.

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **JWT Secret** | Must be set via `AUTH_TOKEN_SECRET` env var. Remove fallback/hardcoded secret. Fail startup if not set in production. |
| **Password Policy** | Enforce minimum 8 chars, at least 1 uppercase, 1 number on the backend `createUser` endpoint. |
| **Rate Limiting** | Add rate limiting to `/api/auth/login` (e.g., 5 attempts per minute per IP). |
| **Token Expiry** | Default 24h (configurable via `AUTH_TOKEN_EXPIRES_IN_DAYS`). |
| **Super Admin Protection** | Cannot delete the `.env`-seeded super admin through the API. |
| **Self-Demotion Prevention** | A super admin cannot change their own role to admin. |
| **Inactive Users** | Deactivated users (`is_active = false`) are rejected at login time. |
| **Audit Trail** | All user CRUD and permission changes are logged in the existing `audit_log` table. |
| **CORS** | Tighten from `origin: "*"` to specific frontend URL in production. |

---

## 11. Migration / Rollout Plan

### Phase 1: Backend Fixes (No Breaking Changes)

1. Fix JWT implementation — consolidate on `authToken.js`
2. Fix password hashing — consolidate on `scrypt`
3. Add `AUTH_TOKEN_SECRET` to `.env`
4. Add super admin seed on startup
5. Create `user_permissions` table
6. Alter `users` table (add `is_active`, `created_by`, `last_login`)

### Phase 2: Apply Auth Middleware to All Routes

1. Add `requireAuth` to all 24 unprotected route files
2. Add `checkModuleAccess` to all module-specific routes
3. Add `requireRole('super_admin')` to admin routes
4. Update login endpoint to return permissions

### Phase 3: Frontend Auth Integration

1. Create `authFetch` wrapper — attach Bearer token to all API calls
2. Enhance `useAuth` hook with permissions
3. Filter sidebar based on user permissions
4. Add `RouteGuard` component to all dashboard pages
5. Build admin user management UI with permission checkboxes

### Phase 4: Testing & Hardening

1. Test login flow end-to-end
2. Test permission-based access (admin with partial access)
3. Test super admin seeding from `.env`
4. Test edge cases (deactivated user, expired token, invalid permissions)
5. Remove any remaining hardcoded credentials
6. Tighten CORS configuration

---

## 12. File-Level Change Inventory

### Backend (`mrpeasy-vaclift-backend`)

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `.env` | Add `AUTH_TOKEN_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME` |
| **MODIFY** | `src/index.js` | Call `seedSuperAdmin()` after `initDb()` |
| **MODIFY** | `src/config/initDb.js` | Add `user_permissions` table creation. Alter `users` table. |
| **MODIFY** | `src/controller/authController.js` | Replace `jsonwebtoken` with `authToken.js`. Include permissions in response. Add `/auth/me` handler. |
| **MODIFY** | `src/routes/authRoutes.js` | Add `GET /auth/me` and `POST /auth/change-password` routes. |
| **MODIFY** | `src/services/adminService.js` | Replace `bcryptjs` with `passwordHash.js`. Add permission management. Restrict user creation by role. |
| **MODIFY** | `src/routes/adminRoutes.js` | Add `requireAuth` + `requireRole('super_admin')`. Add permission endpoints. |
| **MODIFY** | `src/controller/adminController.js` | Add permission handlers. Add role validation. |
| **MODIFY** | `src/middleware/checkPermission.js` | Rewrite as `checkModuleAccess.js` to use `user_permissions` table and `req.auth`. |
| **MODIFY** | `src/middleware/requireAuth.js` | Ensure it properly sets `req.auth` (already works, verify only). |
| **CREATE** | `src/middleware/requireRole.js` | New role-checking middleware. |
| **CREATE** | `src/middleware/checkModuleAccess.js` | New module-level permission middleware. |
| **CREATE** | `src/config/seedSuperAdmin.js` | Super admin seeder from `.env`. |
| **MODIFY** | 24 route files | Add `requireAuth` + `checkModuleAccess(moduleName)` to all routes. |
| **DELETE** | `createUser.js` (root) | Remove hardcoded user creation script (replaced by admin API + seeder). |

### Frontend (`custom-ai-dashboard-mrpeasy`)

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `src/services/api.ts` | Add `authFetch` wrapper. Replace all `fetch` with `authFetch`. |
| **MODIFY** | `src/hooks/use-auth.ts` | Add `permissions` to auth state. Add `hasModuleAccess`, `isSuperAdmin` helpers. |
| **MODIFY** | `src/components/forms/SignIn.tsx` | Store `permissions` from login response. |
| **MODIFY** | `src/components/common/app-sidebar.tsx` | Filter nav items by user permissions. |
| **MODIFY** | `src/components/common/app-header.tsx` | Show role badge. Add admin link for super admins. |
| **CREATE** | `src/components/auth/RouteGuard.tsx` | New route protection component. |
| **MODIFY** | `src/app/dashboard/layout.tsx` | Wrap with auth check (redirect to login if not authenticated). |
| **MODIFY** | All dashboard `page.tsx` files | Wrap with `RouteGuard` specifying the module key. |
| **CREATE** | `src/app/dashboard/admin/users/page.tsx` | User management list page. |
| **CREATE** | `src/app/dashboard/admin/users/[id]/page.tsx` | User detail + permission checkboxes page. |
| **CREATE** | `src/app/dashboard/admin/users/create/page.tsx` | Create new user form. |
| **MODIFY** | `src/lib/auth.ts` | Enhance `clearAuth` and add permission helpers. |

---

## Appendix A: Module Permission Matrix (Visual)

```
                     dashboard  ai_analytics  crm  orders  sales  inventory  production  procurement  reports  email  admin
super_admin              ✅         ✅        ✅     ✅     ✅       ✅          ✅           ✅         ✅      ✅      ✅
admin (per checkbox)     ◻          ◻         ◻      ◻      ◻        ◻           ◻            ◻          ◻       ◻      ❌
user  (per checkbox)     ◻          ◻         ◻      ◻      ◻        ◻           ◻            ◻          ◻       ◻      ❌

✅ = Always granted
◻ = Configurable (checkbox)
❌ = Never granted
```

## Appendix B: Login Flow Sequence Diagram

```
Frontend                         Backend                          TiDB
   │                                │                               │
   │  POST /api/auth/login          │                               │
   │  { email, password }           │                               │
   │───────────────────────────────>│                               │
   │                                │  SELECT * FROM users          │
   │                                │  WHERE email = ? AND          │
   │                                │  is_active = TRUE             │
   │                                │──────────────────────────────>│
   │                                │                               │
   │                                │  user row                     │
   │                                │<──────────────────────────────│
   │                                │                               │
   │                                │  verifyPassword(input, hash)  │
   │                                │                               │
   │                                │  SELECT module FROM           │
   │                                │  user_permissions             │
   │                                │  WHERE user_id = ?            │
   │                                │  AND is_allowed = TRUE        │
   │                                │──────────────────────────────>│
   │                                │                               │
   │                                │  permissions[]                │
   │                                │<──────────────────────────────│
   │                                │                               │
   │                                │  signAuthToken({              │
   │                                │    id, email, role,           │
   │                                │    permissions                │
   │                                │  })                           │
   │                                │                               │
   │  { token, user: {              │                               │
   │    id, name, email, role,      │                               │
   │    permissions[] } }           │                               │
   │<───────────────────────────────│                               │
   │                                │                               │
   │  Store in localStorage         │                               │
   │  Redirect to /dashboard        │                               │
   │                                │                               │
```

## Appendix C: Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_TOKEN_SECRET` | **Yes** (prod) | `dev-auth-secret-change-me` | Secret for JWT HS256 signing |
| `AUTH_TOKEN_EXPIRES_IN_DAYS` | No | `7` | JWT token expiry in days |
| `SUPER_ADMIN_EMAIL` | **Yes** | — | Email for the bootstrap super admin |
| `SUPER_ADMIN_PASSWORD` | **Yes** | — | Password for the bootstrap super admin |
| `SUPER_ADMIN_NAME` | No | `Super Admin` | Display name for the bootstrap super admin |
