# PHASE 0: Deep Analysis & Reading - Detailed Mapping

**Status**: IN-PROGRESS  
**Created**: [Current Date]  
**Purpose**: Complete technical inventory of all middleware patterns, tenant context usage, and service layer inconsistencies before implementation

## 1. MIDDLEWARE ARCHITECTURE ANALYSIS

### 1.1 Current Middleware Stack (in index.ts)

```
helmet() → cors() → express.json() → morgan() → performanceMonitoring → resolveTenant → [Routes]
```

**Key Finding**: All routes except `/api/health`, `/api/tenants`, and `/api/auth` have `requireTenant` applied at the **mount point** in index.ts:

```typescript
app.use('/api/users', requireTenant, userRoutes);
app.use('/api/items', requireTenant, itemRoutes);
app.use('/api/inventory', requireTenant, inventoryRoutes);
// ... ALL OTHER ROUTES
```

### 1.2 Route Middleware Patterns

#### PATTERN A: Mount-Point `requireTenant` (CURRENT STANDARD - 24 routes)
These routes have `requireTenant` applied at mount point in index.ts:
- `/api/users` - Has internal `authenticate`
- `/api/items` - Has internal `authenticate`
- `/api/inventory` - Has internal `authenticate, requireTenant` (REDUNDANT)
- `/api/audit` - Has internal `authenticate`
- `/api/suppliers` - Has internal `authenticate`
- `/api/notifications` - Has internal `authenticate`
- `/api/scanner` - Has internal `authenticate`
- `/api/bi` - Has internal `authenticate`
- `/api/analytics` - Has internal `authenticate`
- `/api/financial` - Has internal `authenticate`
- `/api/user-analytics` - Has internal `authenticate`
- `/api/accounting` - Has internal `authenticate` ONLY (NO REQUIRETENANT AT ALL)
- `/api/reports` - Has internal `authenticate`
- `/api/customers` - Has internal `authenticate, requireTenant` (REDUNDANT)
- `/api/loyalty` - Has internal `authenticate`
- `/api/visits` - Has internal `authenticate`
- `/api/crm` - Has internal `authenticate` (UNCLEAR)
- `/api/campaigns` - Has internal `authenticate`
- `/api/workspace` - Has internal `authenticate`
- `/api/sms` - Has internal `authenticate`
- `/api/customer-journey` - Has internal `authenticate`
- `/api/customer-service` - Has internal `authenticate`
- `/api/ordering` - Has internal `authenticate`
- `/api/performance` - Has internal `authenticate`

#### PATTERN B: Public/Unrestricted Routes (NO REQUIRETENANT)
```typescript
app.use('/api/health', healthHandler);      // No auth, no tenant
app.use('/api/tenants', tenantRoutes);      // No requireTenant
app.use('/api/auth', authRoutes);           // No requireTenant (handles resolveTenant manually)
```

#### PATTERN C: Routes with Internal `requireTenant` (REDUNDANT - 2 routes)
- `/api/inventory` - Applies `requireTenant` on specific routes even though it's at mount point
- `/api/customers` - Applies `requireTenant` on specific routes even though it's at mount point

**Issue**: This creates maintenance burden and potential confusion.

### 1.3 Authentication Middleware Analysis

#### authenticate middleware (authMiddleware.ts)
**Purpose**: Verify JWT token and attach user to request  
**Key Logic**:
```typescript
// 1. Extract Bearer token from Authorization header
// 2. Verify token signature
// 3. Find user in database
// 4. Attach user to req.user with: { id, role, tenantId }
```

**Critical Issue**: Uses `req.tenant?.id` if available (for tenant filtering), otherwise filters by decoded.id only:
```typescript
if (req.tenant?.id) {
  // Find user in this specific tenant
  user = await prisma.user.findFirst({
    where: { id: decoded.id, tenantId: req.tenant.id }
  });
} else {
  // Find user without tenant filter (universal login)
  user = await prisma.user.findUnique({
    where: { id: decoded.id }
  });
}
```

**Problem**: This allows **cross-tenant user lookups** during auth routes. A user could theoretically use a token from one tenant on another tenant's subdomain.

#### requireTenant middleware (tenantMiddleware.ts)
**Purpose**: Ensure req.tenant is set before proceeding  
**Logic**: Returns 400 error if `!req.tenant`  
**Current Usage**: 
- At mount point (24 routes)
- Internal to route handlers (2 routes)

**Problem**: Inconsistent application creates confusion about which routes actually require tenant context.

#### authorize middleware (authMiddleware.ts)
**Purpose**: Role-based access control  
**Pattern**: `authorize(['ADMIN', 'MANAGER'])`  
**Issue**: Applied to some routes but not consistently

### 1.4 Tenant Context Resolution in resolveTenant

**How It Works**:
1. Extract subdomain from Host header
2. Check for `X-Tenant-Subdomain` header override
3. Skip if subdomain is 'www', 'admin', or 'api' (unless header provided)
4. Query: `prisma.tenant.findUnique({ where: { subdomain }, include: { features: true } })`
5. Set `req.tenant` with: `{ id, subdomain, name, plan, isActive, features }`

**Critical Insight**: This is **purely subdomain-based** tenant resolution. It has NO connection to the authenticated user's `tenantId`.

**Potential Issue**: A user logged in to tenant A could theoretically hit subdomain B and get B's tenant context while keeping A's user token.

---

## 2. TENANT CONTEXT USAGE ANALYSIS

### 2.1 Dual Tenant Context Sources

The codebase uses **TWO** different sources for tenant context:

#### Source 1: `req.tenant?.id` (From Subdomain via resolveTenant)
- Set by: `resolveTenant` middleware
- Available: After `resolveTenant` middleware runs
- Represents: The **workspace subdomain** user is accessing
- Used in: Route handlers via `req.tenant!.id`

#### Source 2: `req.user?.tenantId` (From JWT Token)
- Set by: `authenticate` middleware
- Available: After `authenticate` middleware runs
- Represents: The **home tenant** where user account exists
- Used in: Service methods, manual filters

### 2.2 Current Usage Pattern in Routes

**inventoryRoutes.ts** (Line 45):
```typescript
const entries = await prisma.inventoryEntry.findMany({
  where: {
    deletedAt: null,
    item: {
      tenantId: req.tenant!.id  // Uses subdomain-based tenant
    }
  }
});
```

**userRoutes.ts** (Line 27):
```typescript
const users = await prisma.user.findMany({
  // NO TENANT FILTER - CRITICAL ISSUE!
  select: { id, name, email, role, ... }
});
```

**accountingRoutes.ts** (Line 12):
```typescript
router.use(authenticate); // Only authenticate, no requireTenant!
// Routes then manually check tenant via req.user?.tenantId
```

**customerRoutes.ts** (Line 47):
```typescript
// Uses req.tenant!.id consistently
const customers = await prisma.customer.findMany({
  where: { tenantId: req.tenant!.id, ... }
});
```

### 2.3 Critical Findings

| Route | Pattern | Issue |
|-------|---------|-------|
| inventoryRoutes | Uses `req.tenant!.id` | ✅ Correct |
| customerRoutes | Uses `req.tenant!.id` | ✅ Correct |
| userRoutes | NO TENANT FILTER | ❌ CRITICAL - Lists all users |
| accountingRoutes | NO `requireTenant` | ❌ CRITICAL - Missing middleware |
| authRoutes | Manual resolution | ⚠️ Handles cross-tenant login |

---

## 3. SERVICE LAYER PATTERN ANALYSIS

### 3.1 Five Different Patterns Identified

#### PATTERN 1: Function-Based (customerService.ts, inventoryService.ts)
```typescript
export function validateAndNormalizePhone(phone: string): PhoneValidationResult { }
export async function createCustomer(data: CustomerCreateData, createdBy: string): Promise<any> {
  const customers = await prisma.customer.findMany({
    where: { tenantId: data.tenantId, ... }  // Tenants passed as param
  });
}
export async function getCustomers(filter: CustomerFilter = {}, tenantId: string): Promise<any> {
  const where = { tenantId, ... };  // Mixed pattern - sometimes optional
}
```

**Characteristics**:
- Export individual async functions
- TenantId passed as parameter in some functions, part of data object in others
- No consistent validation contract
- Can be called directly from routes

**Files Using This Pattern**:
- customerService.ts
- inventoryService.ts
- loyaltyService.ts
- customerJourneyService.ts
- customerInsightsService.ts

#### PATTERN 2: Static Class Methods (chartOfAccountsService.ts, journalEntryService.ts)
```typescript
export class ChartOfAccountsService {
  static async initializeIranianChartOfAccounts(tenantId: string): Promise<void> { }
  static async createAccount(data: ChartOfAccountData) {  // data includes tenantId
    return await prisma.chartOfAccount.create({ data: { ...data, level } });
  }
  static async getAccountHierarchy(tenantId: string, accountType?: AccountType) {
    const where = { tenantId, ... };  // Consistent tenantId handling
  }
}
```

**Characteristics**:
- All methods are static
- TenantId sometimes in data, sometimes as separate parameter
- Class used for namespace grouping only
- No instance state

**Files Using This Pattern**:
- chartOfAccountsService.ts
- journalEntryService.ts
- campaignService.ts

#### PATTERN 3: Instance-Based Class (biService.ts)
```typescript
export class BiService {
  static async calculateTotalRevenue(period: DateRange, tenantId: string): Promise<KPIMetric> {
    const currentRevenue = await this.getRevenueForPeriod(period, tenantId);
  }
  static async getRevenueForPeriod(period: DateRange, tenantId: string): Promise<number> { }
}
```

**Characteristics**:
- Mix of static methods and helper methods
- All methods take tenantId as explicit parameter
- Good separation of concerns

**Files Using This Pattern**:
- biService.ts (1503 lines)

#### PATTERN 4: Prisma Client Created Locally (Most Files)
```typescript
const prisma = new PrismaClient();  // In every service file

export async function someFunction(tenantId: string) {
  await prisma.someModel.findMany({ where: { tenantId } });
}
```

**Issue**: Creates multiple PrismaClient instances. Should reuse from dbService.ts:
```typescript
import { prisma } from '../services/dbService';  // CORRECT
```

#### PATTERN 5: Mixed/Inconsistent (Several Files)
Some files mix patterns, making it unclear how to use them.

### 3.2 TenantId Validation in Services

**Current State**: INCONSISTENT
- Some services require tenantId as explicit parameter ✅
- Some services include tenantId in data object ✅
- Some services have optional/missing tenantId checks ❌
- No BaseService class to enforce validation ❌

**Example of Missing Validation** (biService.ts):
```typescript
static async calculateTotalRevenue(period: DateRange, tenantId: string): Promise<KPIMetric> {
  // No validation that tenantId is provided
  const currentRevenue = await this.getRevenueForPeriod(period, tenantId);
}
```

**Good Example** (customerService.ts):
```typescript
export async function createCustomer(data: CustomerCreateData, createdBy: string): Promise<any> {
  // CustomerCreateData requires tenantId
  // Validates phone
  // Checks duplicate by phone
  // Creates with tenantId
}
```

---

## 4. DATABASE QUERY FILTERING ANALYSIS

### 4.1 Routes with Missing TenantId Filtering

#### CRITICAL: userRoutes.ts (Line 27)
```typescript
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id, name, email, role, ... }
    // ❌ MISSING: where: { tenantId: req.tenant?.id }
  });
});
```
**Risk**: Returns ALL users across ALL tenants!

#### CRITICAL: accountingRoutes.ts
```typescript
router.use(authenticate);  // ❌ NO requireTenant
router.post('/chart-of-accounts/initialize', AccountingController.initializeChartOfAccounts);
// ❌ Controller likely doesn't have req.tenant available
```

### 4.2 Nested Query Filtering (Potential Issues)

**Good Pattern** (inventoryRoutes.ts):
```typescript
const entries = await prisma.inventoryEntry.findMany({
  where: {
    item: {
      tenantId: req.tenant!.id  // ✅ Filters via relation
    }
  }
});
```

**Potential Issue Pattern** (other routes):
```typescript
const data = await prisma.model.findMany({
  include: {
    relatedModel: {
      // ❌ NO WHERE CLAUSE - retrieves all related records?
    }
  }
});
```

### 4.3 Aggregation Queries

**journalEntryService.ts Example** (Correct):
```typescript
const result = await prisma.journalEntryLine.aggregate({
  where: {
    journalEntry: { tenantId },  // ✅ Filters via nested relation
    accountId
  },
  _sum: { debitAmount: true, creditAmount: true }
});
```

---

## 5. ADMIN PANEL ARCHITECTURE ANALYSIS

### 5.1 Admin Authentication

**Location**: `src/admin/backend/src/middlewares/adminAuth.ts`  
**Pattern**: Separate JWT verification for AdminUser model (NOT User model)

```typescript
// Separate from regular authentication
export const adminAuthenticate = async (req, res, next) => {
  // Verifies AdminUser JWT token
  // Different secret than regular auth
};
```

### 5.2 Admin Routes Access to Tenant Data

**Issue**: Admin can access any tenant's data without context tracking

```typescript
// Admin can do:
const tenants = await prisma.tenant.findMany();  // All tenants
const users = await prisma.user.findMany();      // All users
// NO AUDIT TRAIL OF WHO ACCESSED WHAT
```

### 5.3 AdminAuditLog Table (Unused)

**Schema Definition**:
```prisma
model AdminAuditLog {
  id            String   @id @default(cuid())
  adminId       String
  action        String   // CREATE, READ, UPDATE, DELETE, VIEW
  targetModel   String   // User, Item, Tenant, etc.
  targetId      String?  // ID of affected record
  tenantId      String?  // Which tenant was accessed
  // ... timestamp fields
}
```

**Current Usage**: TABLE EXISTS BUT NOT USED ❌

**Missing Context**:
- No AdminTenantContext to track which tenant admin is currently operating on
- No enforcement of read-only operations
- No audit logging on access

---

## 6. PUBLIC ROUTES INVENTORY

Routes that should NOT require tenant context:

| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/api/health` | Health check | ✅ No middleware |
| `/api/tenants` | Tenant registration/lookup | ✅ No requireTenant |
| `/api/auth/login` | User login | ✅ Handles itself |
| `/api/auth/register` | User registration | ✅ Handles itself |
| `/api/auth/refresh` | Token refresh | ✅ No requireTenant |

---

## 7. CRITICAL SECURITY ISSUES

### ISSUE 1: Missing TenantId Filter on User List (CRITICAL)
**File**: `src/backend/src/routes/userRoutes.ts`  
**Line**: ~27  
**Problem**: Lists ALL users across ALL tenants  
**Impact**: MEDIUM - Only returns to authenticated ADMIN/MANAGER  
**Fix**: Add `where: { tenantId: req.tenant!.id }`

### ISSUE 2: Missing requireTenant Middleware (CRITICAL)
**File**: `src/backend/src/routes/accountingRoutes.ts`  
**Problem**: Only has `authenticate`, no `requireTenant`  
**Impact**: Controller may not have req.tenant available  
**Fix**: Mount with `requireTenant` or add to index.ts

### ISSUE 3: Cross-Tenant User Lookup (MEDIUM)
**File**: `src/backend/src/middlewares/authMiddleware.ts`  
**Problem**: Without tenant context, finds user globally  
**Impact**: User from tenant A could theoretically login on tenant B's subdomain  
**Fix**: Always require tenant context for user lookup

### ISSUE 4: Admin Access Not Audited (MEDIUM)
**File**: `src/admin/backend/`  
**Problem**: AdminAuditLog table exists but unused  
**Impact**: Cannot track admin access to tenant data  
**Fix**: Implement audit logging middleware in admin panel

### ISSUE 5: Redundant requireTenant (LOW)
**Files**: `inventoryRoutes.ts`, `customerRoutes.ts`  
**Problem**: Applied at mount point AND per-route  
**Impact**: Maintenance confusion  
**Fix**: Remove redundant per-route middleware

---

## 8. IMPLEMENTATION APPROACH DECISIONS

Based on deep analysis, recommended approach:

### Decision 1: Standardize Middleware Application
- ✅ **Keep mount-point application** (24 routes already correct)
- ✅ **Remove redundant per-route requireTenant** (2 routes)
- ✅ **Add requireTenant to accountingRoutes** (currently missing)
- ✅ **Document public routes** in config file

### Decision 2: Tenant Context Pattern
- ✅ **Use `req.tenant!.id` consistently** (subdomain-based)
- ✅ **Add tenant validation helper** to prevent missing filters
- ✅ **Verify authenticate middleware** doesn't allow cross-tenant lookup

### Decision 3: Service Layer Standardization
- ✅ **Target static class pattern** (already used by 3+ services)
- ✅ **Create BaseService class** for validation enforcement
- ✅ **Refactor all services** to use consistent pattern
- ✅ **Fix PrismaClient imports** (import from dbService, not create new)

### Decision 4: Admin Panel Hardening
- ✅ **Create AdminTenantContext** middleware
- ✅ **Implement AdminAuditLog** service
- ✅ **Track admin operations** with tenant context
- ✅ **Enforce read-only** on sensitive operations

---

## 9. FILES REQUIRING CHANGES (BY PRIORITY)

### PHASE 1: Critical Fixes (This Week)
1. `src/backend/src/routes/userRoutes.ts` - Add tenantId filter
2. `src/backend/src/routes/accountingRoutes.ts` - Add requireTenant
3. `src/backend/src/config/publicRoutes.ts` - CREATE NEW (document public routes)

### PHASE 2: Middleware Standardization (Next Week)
1. `src/backend/src/middlewares/tenantMiddleware.ts` - Already good, add helpers
2. `src/backend/src/index.ts` - Verify mounting
3. `src/backend/src/utils/tenantUtils.ts` - CREATE NEW (getTenantId helper)

### PHASE 3: Service Layer (Weeks 3-4)
1. All 50 service files - Refactor to static class pattern

### PHASE 4: Admin Hardening (Week 5)
1. `src/admin/backend/src/middlewares/adminTenantContext.ts` - CREATE NEW
2. `src/admin/backend/src/services/adminAuditService.ts` - CREATE NEW
3. Admin routes - Add audit wrapping

### PHASE 5: Documentation (Ongoing)
1. `.github/copilot-instructions.md` - Update with final patterns
2. Create `docs/SERVICE_CONTRACTS.md` - Generated service documentation
3. Create `docs/DEVELOPMENT_GUIDE.md` - Developer guide

---

## 10. STATISTICS SUMMARY

| Metric | Count | Status |
|--------|-------|--------|
| Total Route Files | 33 | ✅ Analyzed |
| Routes with Mount-Point requireTenant | 24 | ✅ Correct |
| Routes Missing requireTenant | 1 (accounting) | ❌ Fix in Phase 1 |
| Routes with Redundant requireTenant | 2 | ⚠️ Cleanup in Phase 1 |
| Service Files | 50 | 🔄 Pending Analysis |
| Critical Security Issues | 5 | ❌ Prioritized |
| Database Models | 50+ | ✅ Multi-tenant (tenantId on all) |
| Admin Routes | ~20 | ⚠️ Need hardening |

---

## 11. VALIDATION CHECKLIST FOR PHASE 0 COMPLETION

- [ ] All 33 route files analyzed for middleware patterns
- [ ] All authentication flows documented
- [ ] Tenant context resolution verified (subdomain-based)
- [ ] Service patterns classified (5 patterns identified)
- [ ] Database query filtering reviewed
- [ ] Security issues identified and prioritized
- [ ] Admin panel audit gaps documented
- [ ] Implementation approach validated
- [ ] Public routes inventory created
- [ ] File change priority list created
- [ ] Statistics compiled
- [ ] This document complete and reviewed

---

**Next Step**: Begin PHASE 1: Route Middleware Standardization

