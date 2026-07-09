# RBAC Auth System — Development Plan

> **Reference:** [auth-system.md](./auth-system.md) (Design Document)  
> **Status:** Ready for Development  
> **DB Migrations:** ✅ Completed (`users` table altered, `user_permissions` table created)  
> **Last Updated:** 2026-07-08

---

## How to Use This Document

This is a **task-by-task implementation guide**. Each task has:
- A clear deliverable with exact file paths
- Complete "before" and "after" code (copy-paste ready)
- Dependencies on other tasks (what must be done first)
- An acceptance criteria checklist

Tasks are ordered by dependency — complete them top-to-bottom. Backend tasks come first because the frontend depends on them.

---

## Prerequisites

Before starting, add these variables to `mrpeasy-vaclift-backend/.env`:

```env
# ─── Auth Token ───
AUTH_TOKEN_SECRET=Kx7pRmZvQ3uWjY9dN8gLs2fHtA5bE0cVi6oP4yXwM1nJ

# ─── Super Admin Bootstrap ───
SUPER_ADMIN_EMAIL=admin@vacliftaustralia.com
SUPER_ADMIN_PASSWORD=VacLift@SuperAdmin2026!
SUPER_ADMIN_NAME=Super Admin
```

> ⚠️ **Change these values in production.** The `AUTH_TOKEN_SECRET` should be a random 64+ character string. Generate one with: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

---

## Task Overview

| # | Task | Repo | Depends On | Estimated Effort |
|---|------|------|-----------|-----------------|
| B1 | Create `requireRole` middleware | Backend | — | 15 min |
| B2 | Create `checkModuleAccess` middleware | Backend | — | 20 min |
| B3 | Fix `authController.js` — consolidate JWT | Backend | — | 30 min |
| B4 | Fix `adminService.js` — consolidate password hashing | Backend | — | 20 min |
| B5 | Create super admin seeder | Backend | B3, B4 | 30 min |
| B6 | Update `adminController.js` + `adminService.js` — permission management | Backend | B4 | 45 min |
| B7 | Update `adminRoutes.js` — protect + add permission endpoints | Backend | B1, B2, B6 | 20 min |
| B8 | Protect all 24 unprotected route files | Backend | B1, B2 | 45 min |
| B9 | Wire seeder into server startup | Backend | B5 | 10 min |
| B10 | Add `GET /auth/me` + `POST /auth/change-password` | Backend | B3 | 20 min |
| F1 | Create `authFetch` wrapper + attach Bearer token | Frontend | B3 | 30 min |
| F2 | Enhance `useAuth` hook with permissions | Frontend | — | 20 min |
| F3 | Create `RouteGuard` component | Frontend | F2 | 20 min |
| F4 | Filter sidebar by user permissions | Frontend | F2 | 20 min |
| F5 | Protect dashboard layout (redirect if not logged in) | Frontend | F2 | 15 min |
| F6 | Wrap all dashboard pages with `RouteGuard` | Frontend | F3 | 30 min |
| F7 | Build admin user management pages | Frontend | F1, F2 | 2-3 hours |
| F8 | Update `SignIn.tsx` to store permissions | Frontend | B3, F2 | 15 min |

---

# Backend Tasks

## B1 — Create `requireRole` Middleware

**File:** `mrpeasy-vaclift-backend/src/middleware/requireRole.js` **(NEW)**  
**Depends on:** Nothing  

### What It Does
Checks that `req.auth.role` (set by `requireAuth`) matches one of the allowed roles. Used to restrict admin routes to `super_admin` only.

### Code

```js
// src/middleware/requireRole.js

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

### Acceptance Criteria
- [x] File exists at `src/middleware/requireRole.js`
- [x] Exports `{ requireRole }`
- [x] Returns 403 with clear error message when role doesn't match
- [x] Passes through when role matches

---

## B2 — Create `checkModuleAccess` Middleware

**File:** `mrpeasy-vaclift-backend/src/middleware/checkModuleAccess.js` **(NEW)**  
**Depends on:** Nothing  

### What It Does
Checks the `user_permissions` table to verify the current user has access to a specific module. `super_admin` bypasses all checks.

### Code

```js
// src/middleware/checkModuleAccess.js

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

### Acceptance Criteria
- [x] File exists at `src/middleware/checkModuleAccess.js`
- [x] `super_admin` role always gets through without a DB query
- [x] Regular users are checked against `user_permissions` table
- [x] Returns 403 when user has no permission row or `is_allowed = false`

---

## B3 — Fix `authController.js` — Consolidate JWT

**File:** `mrpeasy-vaclift-backend/src/controller/authController.js` **(MODIFY)**  
**Depends on:** Nothing  

### Problem
Currently uses `jsonwebtoken` npm package to sign tokens, but `requireAuth` middleware uses `src/utils/authToken.js` to verify them. The token formats are incompatible — **login produces tokens that the auth middleware rejects**.

### Changes
1. Remove `jsonwebtoken` import
2. Use `signAuthToken` from `src/utils/authToken.js`
3. Fetch user permissions from `user_permissions` table and include them in the response
4. Check `is_active` flag before allowing login
5. Update `last_login` timestamp

### Full Replacement Code

```js
// src/controller/authController.js

const pool = require("../config/db");
const { verifyPassword } = require("../utils/passwordHash");
const { signAuthToken } = require("../utils/authToken");

// All available modules — super_admin gets all of these
const ALL_MODULES = [
  "dashboard", "ai_analytics", "crm", "orders", "sales",
  "inventory", "production", "procurement", "reports", "email", "admin"
];

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // 1. Find user (must be active)
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = rows[0];

    // 2. Verify password (supports both scrypt and legacy formats via passwordHash.js)
    const { ok, needsRehash } = await verifyPassword(password, user.password);

    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 3. Rehash if needed (legacy plain-text or old format)
    if (needsRehash) {
      const { hashPassword } = require("../utils/passwordHash");
      const newHash = await hashPassword(password);
      await pool.execute("UPDATE users SET password = ? WHERE id = ?", [newHash, user.id]);
    }

    // 4. Fetch user permissions
    let permissions;
    if (user.role === "super_admin") {
      permissions = ALL_MODULES;
    } else {
      const [permRows] = await pool.execute(
        "SELECT module FROM user_permissions WHERE user_id = ? AND is_allowed = TRUE",
        [user.id]
      );
      permissions = permRows.map(r => r.module);
    }

    // 5. Sign token with authToken.js (same lib that requireAuth uses to verify)
    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions,
    });

    // 6. Update last_login
    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // 7. Return response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
```

### What to Verify
- [x] `const jwt = require("jsonwebtoken")` is **removed**
- [x] `const JWT_SECRET = ...` line is **removed**
- [x] `const verifyScryptHash = ...` function is **removed** (replaced by `passwordHash.js`)
- [x] Token is signed with `signAuthToken` from `src/utils/authToken.js`
- [x] Login response includes `permissions` array
- [x] `is_active = TRUE` check is in the SQL query
- [x] `last_login` is updated on successful login

### Test
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vacliftaustralia.com","password":"VacLift@SuperAdmin2026!"}'
```

Expected response should include `permissions` array and a JWT that `requireAuth` can verify.

---

## B4 — Fix `adminService.js` — Consolidate Password Hashing

**File:** `mrpeasy-vaclift-backend/src/services/adminService.js` **(MODIFY)**  
**Depends on:** Nothing  

### Problem
Currently uses `bcryptjs` to hash passwords, but `authController.login` verifies with `scrypt`. Users created through admin API **cannot log in**.

### Changes
Replace the `bcrypt` import and usage with `passwordHash.js`.

### What to Change

**Line 2** — Replace:
```js
const bcrypt = require('bcryptjs');
```
With:
```js
const { hashPassword } = require('../utils/passwordHash');
```

**Line 12** — In `createUser`, replace:
```js
const hash = await bcrypt.hash(password || 'password123', 10);
```
With:
```js
if (!password || password.length < 8) {
  throw new Error("Password must be at least 8 characters");
}
const hash = await hashPassword(password);
```

### Acceptance Criteria
- [x] `bcryptjs` is no longer imported
- [x] `hashPassword` from `src/utils/passwordHash.js` is used instead
- [x] Password validation (minimum 8 characters) is enforced
- [x] No default password fallback (`'password123'` is removed)

---

## B5 — Create Super Admin Seeder

**File:** `mrpeasy-vaclift-backend/src/config/seedSuperAdmin.js` **(NEW)**  
**Depends on:** B3, B4  

### What It Does
On server start, checks `.env` for `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`. Creates or upgrades the super admin user in the `users` table.

### Code

```js
// src/config/seedSuperAdmin.js

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

  try {
    const [existing] = await pool.execute(
      "SELECT id, role FROM users WHERE email = ?",
      [email]
    );

    if (existing.length === 0) {
      // Create new super admin
      const hash = await hashPassword(password);
      await pool.execute(
        "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'super_admin', TRUE)",
        [name, email, hash]
      );
      console.log(`[Seed] Super admin created: ${email}`);
    } else if (existing[0].role !== "super_admin") {
      // Upgrade existing user to super_admin
      await pool.execute(
        "UPDATE users SET role = 'super_admin' WHERE id = ?",
        [existing[0].id]
      );
      console.log(`[Seed] Upgraded existing user to super_admin: ${email}`);
    } else {
      console.log(`[Seed] Super admin already exists: ${email}`);
    }
  } catch (error) {
    console.error("[Seed] Super admin seed failed:", error?.message || error);
  }
}

module.exports = { seedSuperAdmin };
```

### Acceptance Criteria
- [x] File exists at `src/config/seedSuperAdmin.js`
- [x] If env vars are not set → logs a message and exits cleanly (no crash)
- [x] If user doesn't exist → creates with `role = 'super_admin'`
- [x] If user exists but isn't super_admin → upgrades the role
- [x] If user exists and is super_admin → no-op, just logs

---

## B6 — Update Admin Controller + Service for Permission Management

**File:** `mrpeasy-vaclift-backend/src/services/adminService.js` **(MODIFY)**  
**File:** `mrpeasy-vaclift-backend/src/controller/adminController.js` **(MODIFY)**  
**Depends on:** B4  

### Add to `adminService.js`

Add these functions **at the bottom** of the file (before `module.exports` if applicable, or just at the end since it uses `exports.*`):

```js
// --- User Permissions ---
exports.getUserPermissions = async (userId) => {
  const [rows] = await db.execute(
    'SELECT module, is_allowed FROM user_permissions WHERE user_id = ?',
    [userId]
  );
  return rows;
};

exports.updateUserPermissions = async (userId, modules, grantedBy) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing permissions for this user
    await connection.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

    // Insert new permissions
    for (const mod of modules) {
      await connection.execute(
        'INSERT INTO user_permissions (user_id, module, is_allowed, granted_by) VALUES (?, ?, TRUE, ?)',
        [userId, mod, grantedBy]
      );
    }

    await connection.commit();
    return { success: true, permissions: modules };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.resetUserPassword = async (userId, newPassword) => {
  const { hashPassword } = require('../utils/passwordHash');
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const hash = await hashPassword(newPassword);
  await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
  return { success: true };
};
```

### Update `getUsers` in `adminService.js`

Replace the existing `getUsers` to include permissions:

```js
exports.getUsers = async () => {
  const [users] = await db.execute(
    'SELECT id, name, email, role, is_active, created_by, last_login, created_at FROM users'
  );

  // Fetch all permissions in one query
  const [allPerms] = await db.execute('SELECT user_id, module FROM user_permissions WHERE is_allowed = TRUE');

  return users.map(u => ({
    ...u,
    permissions: allPerms.filter(p => p.user_id === u.id).map(p => p.module),
  }));
};
```

### Update `createUser` in `adminService.js`

Replace the existing `createUser` to support role and permissions:

```js
exports.createUser = async (data) => {
  const { name, email, password, role, permissions = [] } = data;

  // Validate role
  const validRoles = ['super_admin', 'admin', 'user'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Hash password
  const { hashPassword } = require('../utils/passwordHash');
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const hash = await hashPassword(password);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create user
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [name, email, hash, role]
    );
    const userId = result.insertId;

    // Insert permissions (for non-super_admin users)
    if (role !== 'super_admin' && permissions.length > 0) {
      for (const mod of permissions) {
        await connection.execute(
          'INSERT INTO user_permissions (user_id, module, is_allowed, granted_by) VALUES (?, ?, TRUE, ?)',
          [userId, mod, data.created_by || 1]
        );
      }
    }

    await connection.commit();
    return { id: userId, name, email, role, permissions };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
```

### Add to `adminController.js`

Add these handler functions:

```js
// --- User Permissions ---
exports.getUserPermissions = async (req, res) => {
  try {
    const perms = await adminService.getUserPermissions(req.params.id);
    res.json({ success: true, data: perms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserPermissions = async (req, res) => {
  try {
    const grantedBy = req.auth?.id || 1;
    const result = await adminService.updateUserPermissions(
      req.params.id,
      req.body.permissions,
      grantedBy
    );
    await adminService.logAction({
      user_id: grantedBy,
      action: 'update_permissions',
      entity_type: 'user',
      entity_id: req.params.id,
      new_values: req.body.permissions,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    await adminService.resetUserPassword(req.params.id, req.body.password);
    await adminService.logAction({
      user_id: req.auth?.id || 1,
      action: 'reset_password',
      entity_type: 'user',
      entity_id: req.params.id,
    });
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Also Update Existing Controller Methods

In `adminController.js`, update all occurrences of `req.user ? req.user.id : 1` to `req.auth?.id || 1`:

```
// FIND AND REPLACE (6 occurrences):
// BEFORE: req.user ? req.user.id : 1
// AFTER:  req.auth?.id || 1
```

### Acceptance Criteria
- [x] `GET /api/admin/users` returns users with `permissions` array
- [x] `POST /api/admin/users` accepts `permissions` array in body
- [x] `GET /api/admin/users/:id/permissions` returns user's module permissions
- [x] `PUT /api/admin/users/:id/permissions` updates module permissions
- [x] `POST /api/admin/users/:id/reset-password` resets password
- [x] All audit logging uses `req.auth?.id` instead of `req.user?.id`

---

## B7 — Update `adminRoutes.js` — Protect + Add Permission Endpoints

**File:** `mrpeasy-vaclift-backend/src/routes/adminRoutes.js` **(MODIFY)**  
**Depends on:** B1, B2, B6  

### Full Replacement Code

```js
// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { requireAuth } = require('../middleware/requireAuth');
const { requireRole } = require('../middleware/requireRole');

// All admin routes require: authenticated + super_admin role
router.use(requireAuth, requireRole('super_admin'));

// Users
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// User Permissions
router.get('/users/:id/permissions', adminController.getUserPermissions);
router.put('/users/:id/permissions', adminController.updateUserPermissions);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Roles & Permissions (legacy — kept for backward compat)
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);
router.put('/roles/:id/permissions', adminController.updateRolePermissions);

// Audit Log
router.get('/audit-log', adminController.getAuditLogs);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);

module.exports = router;
```

### Key Change
- Added `router.use(requireAuth, requireRole('super_admin'))` at the top — **every admin route is now protected**
- Added 3 new permission endpoints for users

### Acceptance Criteria
- [x] Unauthenticated request to `/api/admin/users` returns 401
- [x] Authenticated non-super_admin request returns 403
- [x] Authenticated super_admin request works correctly
- [x] New permission endpoints are routed correctly

---

## B8 — Protect All 24 Unprotected Route Files

**Depends on:** B1, B2  

This is the largest task. Every route file needs two imports added at the top, and every route definition needs `requireAuth` and `checkModuleAccess(moduleName)` added as middleware.

### Pattern

For every route file, add these imports:
```js
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");
```

Then change every route line from:
```js
router.get("/some-path", controller.handler);
```
To:
```js
router.get("/some-path", requireAuth, checkModuleAccess("module_name"), controller.handler);
```

### Complete File-by-File Reference

Below is the **exact code** for each route file after modification. For brevity, only the module key and route lines are shown — the structure is identical for all.

---

#### `orderRoutes.js` → Module: `orders`

```js
const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController.js");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/orders", requireAuth, checkModuleAccess("orders"), orderController.createOrder);
router.get("/orders", requireAuth, checkModuleAccess("orders"), orderController.getOrders);
router.get("/orders/:code", requireAuth, checkModuleAccess("orders"), orderController.getOrder);

module.exports = router;
```

---

#### `analyticsRoutes.js` → Module: `dashboard`

```js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controller/analyticsController.js");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/analytics", requireAuth, checkModuleAccess("dashboard"), analyticsController.getOrdersAnalytics);
router.get("/analytics/recommendations", requireAuth, checkModuleAccess("dashboard"), analyticsController.getRecommendations);
router.get("/analytics/command-center", requireAuth, checkModuleAccess("dashboard"), analyticsController.getCommandCenter);
router.get("/analytics/customer-segmentation", requireAuth, checkModuleAccess("dashboard"), analyticsController.getCustomerSegmentation);
router.get("/analytics/profit", requireAuth, checkModuleAccess("dashboard"), analyticsController.getProfit);
router.get("/analytics/cohorts", requireAuth, checkModuleAccess("dashboard"), analyticsController.getCohorts);
router.get("/analytics/supply-chain", requireAuth, checkModuleAccess("dashboard"), analyticsController.getSupplyChain);

module.exports = router;
```

---

#### `aiRoutes.js` → Module: `ai_analytics`

```js
const express = require("express");
const { AIChat, AIReport, AIExecutiveBriefing } = require("../controller/aiController.js");
const router = express.Router();
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/ai-chat", (req, res) => {
    return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
        details: "Use POST /api/ai-chat with JSON body: { \"question\": \"...\" }",
    });
});

router.post("/ai-chat", requireAuth, checkModuleAccess("ai_analytics"), AIChat);
router.get("/ai-report", requireAuth, checkModuleAccess("ai_analytics"), AIReport);
router.get("/ai-executive-briefing", requireAuth, checkModuleAccess("ai_analytics"), AIExecutiveBriefing);

// CRM AI
const { getLeadScore, getWinProbability, getExecutiveSummary } = require("../controller/aiController.js");
router.post("/ai-lead-score", requireAuth, checkModuleAccess("crm"), getLeadScore);
router.post("/ai-win-probability", requireAuth, checkModuleAccess("crm"), getWinProbability);
router.post("/ai-executive-summary", requireAuth, checkModuleAccess("crm"), getExecutiveSummary);

module.exports = router;
```

---

#### `eventAlertsRoutes.js` → Module: `dashboard`

```js
const express = require("express");
const router = express.Router();
const { previewEventAlerts, runEventAlerts } = require("../controller/eventAlertsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/event-alerts/preview", requireAuth, checkModuleAccess("dashboard"), previewEventAlerts);
router.post("/event-alerts/run", requireAuth, checkModuleAccess("dashboard"), runEventAlerts);
router.get("/event-alerts/run", requireAuth, checkModuleAccess("dashboard"), runEventAlerts);

module.exports = router;
```

---

#### `crmStatsRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const crmStatsController = require("../controller/crmStatsController.js");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/stats", requireAuth, checkModuleAccess("crm"), crmStatsController.getStats);
router.get("/crm/contacts/by-lifecycle", requireAuth, checkModuleAccess("crm"), crmStatsController.getContactsByLifecycle);
router.get("/crm/companies/by-industry", requireAuth, checkModuleAccess("crm"), crmStatsController.getCompaniesByIndustry);
router.get("/crm/deals/pipeline", requireAuth, checkModuleAccess("crm"), crmStatsController.getDealsPipeline);

module.exports = router;
```

---

#### `contactsRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const contactsController = require("../controller/contactsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/contacts", requireAuth, checkModuleAccess("crm"), contactsController.getContacts);
router.get("/crm/contacts/:id", requireAuth, checkModuleAccess("crm"), contactsController.getContactById);

module.exports = router;
```

---

#### `companiesRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const companiesController = require("../controller/companiesController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/companies", requireAuth, checkModuleAccess("crm"), companiesController.getCompanies);
router.get("/crm/companies/:id", requireAuth, checkModuleAccess("crm"), companiesController.getCompanyById);

module.exports = router;
```

---

#### `dealsRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const dealsController = require("../controller/dealsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/deals", requireAuth, checkModuleAccess("crm"), dealsController.getDeals);
router.get("/crm/deals/:id", requireAuth, checkModuleAccess("crm"), dealsController.getDealById);

module.exports = router;
```

---

#### `ownersRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const ownersController = require("../controller/ownersController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/crm/owners", requireAuth, checkModuleAccess("crm"), ownersController.getOwners);

module.exports = router;
```

---

#### `leadsRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const leadsController = require("../controller/leadsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/crm/leads", requireAuth, checkModuleAccess("crm"), leadsController.createLead);
router.get("/crm/leads", requireAuth, checkModuleAccess("crm"), leadsController.getLeads);
router.get("/crm/leads/:id", requireAuth, checkModuleAccess("crm"), leadsController.getLeadById);
router.put("/crm/leads/:id", requireAuth, checkModuleAccess("crm"), leadsController.updateLead);
router.delete("/crm/leads/:id", requireAuth, checkModuleAccess("crm"), leadsController.deleteLead);
router.post("/crm/leads/:id/convert", requireAuth, checkModuleAccess("crm"), leadsController.convertLead);

module.exports = router;
```

---

#### `opportunitiesRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const opportunitiesController = require("../controller/opportunitiesController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/crm/opportunities", requireAuth, checkModuleAccess("crm"), opportunitiesController.createOpportunity);
router.get("/crm/opportunities", requireAuth, checkModuleAccess("crm"), opportunitiesController.getOpportunities);
router.get("/crm/opportunities/:id", requireAuth, checkModuleAccess("crm"), opportunitiesController.getOpportunityById);
router.put("/crm/opportunities/:id", requireAuth, checkModuleAccess("crm"), opportunitiesController.updateOpportunity);
router.delete("/crm/opportunities/:id", requireAuth, checkModuleAccess("crm"), opportunitiesController.deleteOpportunity);

module.exports = router;
```

---

#### `activitiesRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const activitiesController = require("../controller/activitiesController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/crm/activities", requireAuth, checkModuleAccess("crm"), activitiesController.createActivity);
router.get("/crm/activities", requireAuth, checkModuleAccess("crm"), activitiesController.getActivities);
router.get("/crm/activities/:id", requireAuth, checkModuleAccess("crm"), activitiesController.getActivityById);
router.put("/crm/activities/:id", requireAuth, checkModuleAccess("crm"), activitiesController.updateActivity);
router.delete("/crm/activities/:id", requireAuth, checkModuleAccess("crm"), activitiesController.deleteActivity);

module.exports = router;
```

---

#### `tagsRoutes.js` → Module: `crm`

```js
const express = require("express");
const router = express.Router();
const tagsController = require("../controller/tagsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/contacts/tags", requireAuth, checkModuleAccess("crm"), tagsController.getTags);

module.exports = router;
```

---

#### `emailRoutes.js` → Module: `email`

```js
const express = require('express');
const router = express.Router();
const emailController = require('../controller/emailController');
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get('/email/segments', requireAuth, checkModuleAccess("email"), emailController.getSegments);
router.post('/email/templates', requireAuth, checkModuleAccess("email"), emailController.createTemplate);
router.get('/email/templates', requireAuth, checkModuleAccess("email"), emailController.getTemplates);
router.post('/email/send-hot-leads', requireAuth, checkModuleAccess("email"), emailController.sendHotLeads);
router.post('/email/send-newsletter', requireAuth, checkModuleAccess("email"), emailController.sendNewsletter);
router.post('/email/send-selected', requireAuth, checkModuleAccess("email"), emailController.sendSelected);

module.exports = router;
```

---

#### `quotationsRoutes.js` → Module: `sales`

```js
const express = require("express");
const router = express.Router();
const quotationsController = require("../controller/quotationsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/sales/quotations", requireAuth, checkModuleAccess("sales"), quotationsController.createQuotation);
router.get("/sales/quotations", requireAuth, checkModuleAccess("sales"), quotationsController.getQuotations);
router.get("/sales/quotations/:id", requireAuth, checkModuleAccess("sales"), quotationsController.getQuotationById);
router.put("/sales/quotations/:id", requireAuth, checkModuleAccess("sales"), quotationsController.updateQuotation);
router.delete("/sales/quotations/:id", requireAuth, checkModuleAccess("sales"), quotationsController.deleteQuotation);

router.post("/sales/quotations/:id/send", requireAuth, checkModuleAccess("sales"), quotationsController.sendQuotation);
router.post("/sales/quotations/:id/approve", requireAuth, checkModuleAccess("sales"), quotationsController.approveQuotation);
router.post("/sales/quotations/:id/convert", requireAuth, checkModuleAccess("sales"), quotationsController.convertToSalesOrder);
router.get("/sales/quotations/:id/pdf", requireAuth, checkModuleAccess("sales"), quotationsController.generatePdf);

module.exports = router;
```

---

#### `salesOrdersRoutes.js` → Module: `sales`

```js
const express = require("express");
const router = express.Router();
const salesOrdersController = require("../controller/salesOrdersController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/sales/orders", requireAuth, checkModuleAccess("sales"), salesOrdersController.createSalesOrder);
router.get("/sales/orders", requireAuth, checkModuleAccess("sales"), salesOrdersController.getSalesOrders);
router.get("/sales/orders/:id", requireAuth, checkModuleAccess("sales"), salesOrdersController.getSalesOrderById);
router.put("/sales/orders/:id", requireAuth, checkModuleAccess("sales"), salesOrdersController.updateSalesOrder);
router.delete("/sales/orders/:id", requireAuth, checkModuleAccess("sales"), salesOrdersController.deleteSalesOrder);
router.post("/sales/orders/:id/confirm", requireAuth, checkModuleAccess("sales"), salesOrdersController.confirmSalesOrder);
router.get("/sales/orders/:id/pdf", requireAuth, checkModuleAccess("sales"), salesOrdersController.generatePdf);

module.exports = router;
```

---

#### `productsRoutes.js` → Module: `production`

```js
const express = require("express");
const router = express.Router();
const productsController = require("../controller/productsController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/products", requireAuth, checkModuleAccess("production"), productsController.createProduct);
router.get("/products", requireAuth, checkModuleAccess("production"), productsController.getProducts);
router.get("/products/:id", requireAuth, checkModuleAccess("production"), productsController.getProductById);
router.put("/products/:id", requireAuth, checkModuleAccess("production"), productsController.updateProduct);
router.delete("/products/:id", requireAuth, checkModuleAccess("production"), productsController.deleteProduct);

module.exports = router;
```

---

#### `bomRoutes.js` → Module: `production`

```js
const express = require("express");
const router = express.Router();
const bomController = require("../controller/bomController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.post("/", requireAuth, checkModuleAccess("production"), bomController.createBom);
router.get("/", requireAuth, checkModuleAccess("production"), bomController.getAllBoms);
router.get("/:id", requireAuth, checkModuleAccess("production"), bomController.getBomById);
router.get("/by-product/:productId", requireAuth, checkModuleAccess("production"), bomController.getBomByProductId);
router.put("/:id", requireAuth, checkModuleAccess("production"), bomController.updateBom);
router.delete("/:id", requireAuth, checkModuleAccess("production"), bomController.deleteBom);

module.exports = router;
```

---

#### `productionRoutes.js` → Module: `production`

```js
const express = require("express");
const router = express.Router();
const productionController = require("../controller/productionController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/progress", requireAuth, checkModuleAccess("production"), productionController.getProgress);

router.post("/orders", requireAuth, checkModuleAccess("production"), productionController.createOrder);
router.get("/orders", requireAuth, checkModuleAccess("production"), productionController.getAllOrders);
router.get("/orders/:id", requireAuth, checkModuleAccess("production"), productionController.getOrderById);
router.put("/orders/:id", requireAuth, checkModuleAccess("production"), productionController.updateOrder);

router.post("/orders/:id/start", requireAuth, checkModuleAccess("production"), productionController.startOrder);
router.post("/orders/:id/complete", requireAuth, checkModuleAccess("production"), productionController.completeOrder);
router.post("/orders/:id/consume", requireAuth, checkModuleAccess("production"), productionController.consumeMaterial);

module.exports = router;
```

---

#### `procurementRoutes.js` → Module: `procurement`

```js
const express = require("express");
const router = express.Router();
const procurementController = require("../controller/procurementController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

// Suppliers
router.post("/suppliers", requireAuth, checkModuleAccess("procurement"), procurementController.createSupplier);
router.get("/suppliers", requireAuth, checkModuleAccess("procurement"), procurementController.getSuppliers);
router.get("/suppliers/:id", requireAuth, checkModuleAccess("procurement"), procurementController.getSupplierById);
router.put("/suppliers/:id", requireAuth, checkModuleAccess("procurement"), procurementController.updateSupplier);
router.delete("/suppliers/:id", requireAuth, checkModuleAccess("procurement"), procurementController.deleteSupplier);

// Purchase Orders
router.post("/orders", requireAuth, checkModuleAccess("procurement"), procurementController.createPurchaseOrder);
router.get("/orders", requireAuth, checkModuleAccess("procurement"), procurementController.getPurchaseOrders);
router.get("/orders/:id", requireAuth, checkModuleAccess("procurement"), procurementController.getPurchaseOrderById);
router.put("/orders/:id", requireAuth, checkModuleAccess("procurement"), procurementController.updatePurchaseOrder);
router.post("/orders/:id/send", requireAuth, checkModuleAccess("procurement"), procurementController.sendPurchaseOrder);

// Goods Receipt
router.post("/goods-receipt", requireAuth, checkModuleAccess("procurement"), procurementController.receiveGoods);
router.get("/goods-receipt/:poId", requireAuth, checkModuleAccess("procurement"), procurementController.getGoodsReceiptsByPo);

module.exports = router;
```

---

#### `inventoryRoutes.js` → Module: `inventory`

```js
const express = require("express");
const router = express.Router();
const inventoryController = require("../controller/inventoryController");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

// Warehouses
router.post("/warehouses", requireAuth, checkModuleAccess("inventory"), inventoryController.createWarehouse);
router.get("/warehouses", requireAuth, checkModuleAccess("inventory"), inventoryController.listWarehouses);
router.put("/warehouses/:id", requireAuth, checkModuleAccess("inventory"), inventoryController.updateWarehouse);
router.delete("/warehouses/:id", requireAuth, checkModuleAccess("inventory"), inventoryController.deleteWarehouse);

// Inventory / Stock
router.get("/stock", requireAuth, checkModuleAccess("inventory"), inventoryController.getStock);
router.get("/stock/:productId", requireAuth, checkModuleAccess("inventory"), inventoryController.getStockByProduct);
router.get("/low-stock", requireAuth, checkModuleAccess("inventory"), inventoryController.getLowStock);

// Stock Movements
router.post("/stock-in", requireAuth, checkModuleAccess("inventory"), inventoryController.stockIn);
router.post("/stock-out", requireAuth, checkModuleAccess("inventory"), inventoryController.stockOut);
router.post("/adjustment", requireAuth, checkModuleAccess("inventory"), inventoryController.stockAdjustment);

// Stock Movement History
router.get("/history", requireAuth, checkModuleAccess("inventory"), inventoryController.getHistory);
router.get("/history/:productId", requireAuth, checkModuleAccess("inventory"), inventoryController.getHistoryByProduct);

module.exports = router;
```

---

#### `reportsRoutes.js` → Module: `reports`

```js
const express = require("express");
const router = express.Router();
const reportsController = require("../controller/reportsController.js");
const { requireAuth } = require("../middleware/requireAuth");
const { checkModuleAccess } = require("../middleware/checkModuleAccess");

router.get("/sales", requireAuth, checkModuleAccess("reports"), reportsController.getSalesReport);
router.get("/inventory", requireAuth, checkModuleAccess("reports"), reportsController.getInventoryReport);
router.get("/production", requireAuth, checkModuleAccess("reports"), reportsController.getProductionReport);
router.get("/purchase", requireAuth, checkModuleAccess("reports"), reportsController.getPurchaseReport);
router.get("/receivables", requireAuth, checkModuleAccess("reports"), reportsController.getReceivablesReport);
router.get("/payables", requireAuth, checkModuleAccess("reports"), reportsController.getPayablesReport);
router.get("/dashboard", requireAuth, checkModuleAccess("reports"), reportsController.getDashboardReport);
router.get("/export/:type", requireAuth, checkModuleAccess("reports"), reportsController.exportReport);

module.exports = router;
```

---

#### Already-protected routes (update only — add `checkModuleAccess`)

These files already have `requireAuth` but need `checkModuleAccess` added:

**`dashboardRoutes.js`** → Module: `dashboard`
**`calendarRoutes.js`** → Module: `dashboard`
**`tasksRoutes.js`** → Module: `dashboard`
**`searchRoutes.js`** → Auth only (no module check — global feature)

For `searchRoutes.js`, just keep it as-is (already has `requireAuth`, no module needed).

For the other three, add `checkModuleAccess("dashboard")` after `requireAuth` on each line.

---

#### `authRoutes.js` — NO CHANGES (except B10 additions)

Login must remain unprotected. Changes for `GET /auth/me` are covered in Task B10.

---

### Acceptance Criteria for B8
- [x] All 24 previously-unprotected route files now have `requireAuth` + `checkModuleAccess`
- [x] `authRoutes.js` remains unprotected (login endpoint)
- [x] Server starts without errors after all changes
- [x] Unauthenticated requests to any protected route return `401`
- [x] Authenticated user without module access gets `403`

---

## B9 — Wire Seeder Into Server Startup

**File:** `mrpeasy-vaclift-backend/src/index.js` **(MODIFY)**  
**Depends on:** B5  

### Change

Add the seeder call after `initDb()`. Find this block:

```js
(async () => {
    try {
        await initDb();
        console.log("DB initialized (tables ensured).");
    } catch (error) {
```

Change to:

```js
const { seedSuperAdmin } = require("./config/seedSuperAdmin");

(async () => {
    try {
        await initDb();
        console.log("DB initialized (tables ensured).");

        await seedSuperAdmin();
    } catch (error) {
```

### Acceptance Criteria
- [x] `seedSuperAdmin` is imported at the top
- [x] `seedSuperAdmin()` is called after `initDb()` and before `app.listen()`
- [x] Server logs `[Seed] Super admin created: ...` on first boot
- [x] Server logs `[Seed] Super admin already exists: ...` on subsequent boots

---

## B10 — Add `GET /auth/me` + `POST /auth/change-password`

**File:** `mrpeasy-vaclift-backend/src/controller/authController.js` **(MODIFY)**  
**File:** `mrpeasy-vaclift-backend/src/routes/authRoutes.js` **(MODIFY)**  
**Depends on:** B3  

### Add to `authController.js`

```js
exports.me = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE",
      [req.auth.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found or deactivated" });
    }

    const user = rows[0];

    // Fetch permissions
    let permissions;
    if (user.role === "super_admin") {
      permissions = ALL_MODULES;
    } else {
      const [permRows] = await pool.execute(
        "SELECT module FROM user_permissions WHERE user_id = ? AND is_allowed = TRUE",
        [user.id]
      );
      permissions = permRows.map(r => r.module);
    }

    res.json({
      success: true,
      user: { ...user, permissions },
    });
  } catch (error) {
    console.error("Me Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const [rows] = await pool.execute("SELECT password FROM users WHERE id = ?", [req.auth.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { verifyPassword, hashPassword } = require("../utils/passwordHash");
    const { ok } = await verifyPassword(currentPassword, rows[0].password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const newHash = await hashPassword(newPassword);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [newHash, req.auth.id]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
```

### Update `authRoutes.js`

```js
const express = require("express");
const authController = require("../controller/authController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", requireAuth, authController.me);
router.post("/auth/change-password", requireAuth, authController.changePassword);

module.exports = router;
```

### Acceptance Criteria
- [x] `GET /api/auth/me` with valid token returns user + permissions
- [x] `GET /api/auth/me` with invalid/expired token returns 401
- [x] `POST /api/auth/change-password` validates current password before allowing change
- [x] Password minimum 8 characters enforced

---

# Frontend Tasks

## F1 — Create `authFetch` Wrapper

**File:** `custom-ai-dashboard-mrpeasy/src/services/api.ts` **(MODIFY)**  
**Depends on:** B3  

### What It Does
Wraps all `fetch` calls to automatically attach the `Authorization: Bearer` header. Auto-redirects to login on 401.

### Add This Near the Top of `api.ts` (After the `API_BASE_URL` constant)

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
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  // Auto-logout on 401
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}
```

### Then Replace All `fetch(` Calls

Search and replace across the entire `api.ts` file:

```
FIND:    fetch(`${API_BASE_URL}
REPLACE: authFetch(`${API_BASE_URL}
```

**Exception:** Do NOT replace the `fetch` inside `loginDashboard` — that function needs to work without a token.

### Acceptance Criteria
- [ ] `authFetch` helper is defined
- [ ] All API functions (except `loginDashboard`) use `authFetch`
- [ ] `loginDashboard` still uses plain `fetch`
- [ ] 401 responses auto-clear localStorage and redirect to `/`

---

## F2 — Enhance `useAuth` Hook with Permissions

**File:** `custom-ai-dashboard-mrpeasy/src/hooks/use-auth.ts` **(MODIFY)**  
**Depends on:** Nothing  

### Full Replacement

```typescript
// src/hooks/use-auth.ts

import * as React from "react";

export type Role = "super_admin" | "admin" | "user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
}

export interface AuthState {
  isLoggedIn: boolean;
  token: string;
  user: AuthUser | null;
  role: Role | undefined;
  permissions: string[];
}

export function useAuth(): AuthState {
  const [auth, setAuth] = React.useState<AuthState>({
    isLoggedIn: false,
    token: "",
    role: undefined,
    user: null,
    permissions: [],
  });

  const loadAuth = React.useCallback(() => {
    try {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        setAuth({
          ...parsed,
          permissions: parsed.user?.permissions || parsed.permissions || [],
        });
      } else {
        setAuth({
          isLoggedIn: false,
          token: "",
          role: undefined,
          user: null,
          permissions: [],
        });
      }
    } catch {
      setAuth({
        isLoggedIn: false,
        token: "",
        role: undefined,
        user: null,
        permissions: [],
      });
    }
  }, []);

  React.useEffect(() => {
    loadAuth();

    const handleAuthChange = () => loadAuth();
    window.addEventListener("authChange", handleAuthChange);

    return () => window.removeEventListener("authChange", handleAuthChange);
  }, [loadAuth]);

  return auth;
}

// Helper functions
export function hasModuleAccess(auth: AuthState, module: string): boolean {
  if (!auth.isLoggedIn) return false;
  if (auth.role === "super_admin") return true;
  return auth.permissions.includes(module);
}

export function isSuperAdmin(auth: AuthState): boolean {
  return auth.isLoggedIn && auth.role === "super_admin";
}
```

### Acceptance Criteria
- [ ] `AuthState` now includes `permissions: string[]`
- [ ] `Role` type is `"super_admin" | "admin" | "user"`
- [ ] `hasModuleAccess` and `isSuperAdmin` are exported helper functions
- [ ] Existing `useAuth()` callers still work (backward compatible)

---

## F3 — Create `RouteGuard` Component

**File:** `custom-ai-dashboard-mrpeasy/src/components/auth/RouteGuard.tsx` **(NEW)**  
**Depends on:** F2  

### Code

```tsx
// src/components/auth/RouteGuard.tsx

"use client";

import { useAuth, hasModuleAccess } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

interface RouteGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RouteGuard({ module, children, fallback }: RouteGuardProps) {
  const auth = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to load from localStorage
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => setChecked(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checked) return;

    if (!auth.isLoggedIn) {
      router.replace("/");
      return;
    }
  }, [auth.isLoggedIn, checked, router]);

  // Still loading
  if (!checked || !auth.isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No access to this module
  if (!hasModuleAccess(auth, module)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to access this section. Contact your administrator to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

### Acceptance Criteria
- [ ] File exists at `src/components/auth/RouteGuard.tsx`
- [ ] Unauthenticated users are redirected to `/`
- [ ] Users without module access see "Access Denied" message
- [ ] Users with access see the children content
- [ ] Loading state shows a spinner

---

## F4 — Filter Sidebar by User Permissions

**File:** `custom-ai-dashboard-mrpeasy/src/components/common/app-sidebar.tsx` **(MODIFY)**  
**Depends on:** F2  

### Changes

1. Import `useAuth` and `hasModuleAccess`
2. Add module key mapping
3. Filter `navItems` before rendering

### Add Imports

```tsx
import { useAuth, hasModuleAccess } from "@/hooks/use-auth";
```

### Add Module Map (after `navItems` array definition)

```tsx
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
```

### In the `AppSidebar` Component, Add Filtering

After `const [activeHash, setActiveHash] = React.useState("");` add:

```tsx
const auth = useAuth();

const filteredNavItems = navItems.filter(item => {
  const moduleKey = navItemModuleMap[item.name];
  if (!moduleKey) return true; // No mapping = always show
  return hasModuleAccess(auth, moduleKey);
});
```

Then change the render from `{navItems.map((item) => {` to `{filteredNavItems.map((item) => {`.

### Acceptance Criteria
- [ ] Super admins see all sidebar items
- [ ] Admins see only items they have permission for
- [ ] Items without a module mapping (if any) are always shown

---

## F5 — Protect Dashboard Layout

**File:** `custom-ai-dashboard-mrpeasy/src/app/dashboard/layout.tsx` **(MODIFY)**  
**Depends on:** F2  

### What It Does
Wraps the entire dashboard layout with an auth check. If not logged in, redirect to login page.

### Full Replacement

```tsx
// src/app/dashboard/layout.tsx

"use client";

import AppHeader from "@/components/common/app-header";
import { AppSidebar } from "@/components/common/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && !auth.isLoggedIn) {
      router.replace("/");
    }
  }, [ready, auth.isLoggedIn, router]);

  if (!ready || !auth.isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Acceptance Criteria
- [ ] Dashboard layout is now a client component (`"use client"`)
- [ ] Unauthenticated users see a loader then get redirected to `/`
- [ ] Authenticated users see the normal layout

---

## F6 — Wrap All Dashboard Pages with `RouteGuard`

**Depends on:** F3  

For each dashboard page, wrap the content with `<RouteGuard module="module_key">`. Here's the mapping:

| Page Path | Module Key |
|-----------|-----------|
| `dashboard/page.tsx` | `dashboard` |
| `dashboard/ai-analytics/page.tsx` | `ai_analytics` |
| `dashboard/crm/page.tsx` and all children | `crm` |
| `dashboard/orders/page.tsx` | `orders` |
| `dashboard/sales/page.tsx` | `sales` |
| `dashboard/inventory/page.tsx` and all children | `inventory` |
| `dashboard/production/page.tsx` and all children | `production` |
| `dashboard/procurement/page.tsx` and all children | `procurement` |
| `dashboard/reports/page.tsx` and all children | `reports` |
| `dashboard/admin/page.tsx` and all children | `admin` |

### Pattern (apply to each page)

```tsx
import { RouteGuard } from "@/components/auth/RouteGuard";

// Wrap the default export's return:
export default function SomePage() {
  return (
    <RouteGuard module="module_key">
      {/* existing page content */}
    </RouteGuard>
  );
}
```

### Acceptance Criteria
- [ ] Every dashboard page is wrapped with `RouteGuard`
- [ ] Users without module access see "Access Denied" on that page
- [ ] Users with access see the page normally

---

## F7 — Build Admin User Management Pages

**Depends on:** F1, F2  
**Estimated Effort:** 2-3 hours  

This is the largest frontend task. Build the admin UI for managing users and their permissions.

### Pages to Build/Update

| Path | Purpose |
|------|---------|
| `dashboard/admin/page.tsx` | Already exists — update to wrap with `RouteGuard` |
| `dashboard/admin/users/page.tsx` | **User list** — table with name, email, role, status, actions |
| `dashboard/admin/users/create/page.tsx` | **Create user** — form with name, email, password, role, permission checkboxes |
| `dashboard/admin/users/[id]/page.tsx` | **Edit user** — edit details + permission checkboxes |

### API Functions Needed in `api.ts`

Add these functions to `src/services/api.ts`:

```typescript
// ─── Admin: Users ───
async function fetchAdminUsers() {
  const response = await authFetch(`${API_BASE_URL}/admin/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}) {
  const response = await authFetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error || "Failed to create user");
  }
  return response.json();
}

async function updateAdminUser(id: number, data: Record<string, any>) {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
}

async function deleteAdminUser(id: number) {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete user");
  return response;
}

async function updateUserPermissions(id: number, permissions: string[]) {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
  if (!response.ok) throw new Error("Failed to update permissions");
  return response.json();
}

async function resetUserPassword(id: number, password: string) {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (!response.ok) throw new Error("Failed to reset password");
  return response.json();
}
```

Remember to add these to the `export { ... }` block at the bottom.

### Module Keys for Permission Checkboxes

```typescript
export const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Dashboard Overview" },
  { key: "ai_analytics", label: "AI Analytics" },
  { key: "crm", label: "CRM" },
  { key: "orders", label: "Orders" },
  { key: "sales", label: "Sales" },
  { key: "inventory", label: "Inventory" },
  { key: "production", label: "Production" },
  { key: "procurement", label: "Procurement" },
  { key: "reports", label: "Reports" },
  { key: "email", label: "Email & Templates" },
] as const;
```

> **Note:** `admin` is intentionally excluded — only `super_admin` role users can access admin, it can't be granted via checkbox.

### UI Design Notes
- User list page: Use a table/data-table component. Show name, email, role badge, active status, last login, action buttons (edit/delete).
- Create/edit user page: Form with text inputs for name/email/password, a radio/select for role, and a grid of checkboxes for module permissions.
- When `role = "super_admin"` is selected: disable checkboxes and show a note "Super admins have access to all modules".
- Show a confirmation dialog before deleting a user.

### Acceptance Criteria
- [ ] User list page shows all users with their roles and status
- [ ] Create user form with name, email, password, role selector, permission checkboxes
- [ ] Edit user page with the same fields (password change is separate)
- [ ] Permission checkboxes update `user_permissions` via the API
- [ ] Delete user shows confirmation before acting
- [ ] All pages wrapped with `<RouteGuard module="admin">`

---

## F8 — Update `SignIn.tsx` to Store Permissions

**File:** `custom-ai-dashboard-mrpeasy/src/components/forms/SignIn.tsx` **(MODIFY)**  
**Depends on:** B3, F2  

### Change

In the `onSuccess` callback, the auth data structure already includes `data.user` from the login response. Since B3 now includes `permissions` in the response, the existing code just needs a small update.

Find:
```typescript
const authData = {
    isLoggedIn: true,
    token: data.token,
    user: data.user || null,
    role: data.user?.role || 'USER',
};
```

Replace with:
```typescript
const authData = {
    isLoggedIn: true,
    token: data.token,
    user: data.user || null,
    role: data.user?.role || 'user',
    permissions: data.user?.permissions || [],
};
```

### Acceptance Criteria
- [ ] `permissions` array is included in localStorage auth data
- [ ] Default role is lowercase `'user'` (not `'USER'`)

---

# Testing Checklist

After all tasks are complete, verify:

### Auth Flow
- [ ] Login with super admin credentials → gets all permissions
- [ ] Login with admin credentials → gets only granted permissions
- [ ] Login with deactivated user → gets rejected
- [ ] Wrong password → gets rejected

### API Protection
- [ ] Unauthenticated request to any protected route → 401
- [ ] Authenticated admin without CRM access calling `/api/crm/contacts` → 403
- [ ] Authenticated admin with CRM access calling `/api/crm/contacts` → 200
- [ ] Super admin calling any route → 200

### Frontend
- [ ] Sidebar shows only permitted modules
- [ ] Direct URL to forbidden module shows "Access Denied"
- [ ] Logout clears auth and redirects to login
- [ ] Token auto-attaches to all API calls
- [ ] 401 from API auto-logs out

### Admin Panel
- [ ] Super admin can create new admins
- [ ] Super admin can set module permissions via checkboxes
- [ ] Super admin can create other super admins
- [ ] Regular admin cannot access admin routes (403)
- [ ] Password reset works
- [ ] Audit log captures all changes

---

## Cleanup After Everything Works

- [ ] Delete `createUser.js` from the backend root (replaced by admin API + seeder)
- [ ] Remove `bcryptjs` from `package.json` dependencies (`npm uninstall bcryptjs`)
- [ ] Remove `jsonwebtoken` from `package.json` dependencies (`npm uninstall jsonwebtoken`)
- [ ] Tighten CORS from `origin: "*"` to the actual frontend URL
- [ ] Change the `.env` `AUTH_TOKEN_SECRET` to a production-grade random string
