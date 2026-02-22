# Servaan - AI Copilot Instructions

**Servaan** is a comprehensive, multi-tenant cafe/restaurant management system (سِروان) with inventory, accounting, CRM, and business intelligence capabilities. The codebase is large (~150+ TS files) with separate frontend, backend, admin panel, and shared utilities.

## Architecture Overview

### Core Components
- **Frontend** (`src/frontend/`): Next.js 14 (App Router), TypeScript, Tailwind CSS, RTL Farsi UI
- **Backend** (`src/backend/`): Express.js + Prisma ORM, ~30 API route modules
- **Admin Panel** (`src/admin/`): Separate frontend + backend for system admin
- **Database** (`src/prisma/`): PostgreSQL with 50+ models, shared Prisma schema
- **Shared Types** (`src/shared/`): Auto-generated Prisma client, types (NOT `node_modules`)

### Key Architecture Decisions
1. **Multi-Tenancy**: All data isolation via `tenantId` field on every model. Single-tenant routes use `resolveTenant` middleware; admin routes use `requireTenant`.
2. **Relative Import Pattern**: Backend imports use `../../shared/types` (relative paths). Docker builds must preserve project structure (copy entire project, not just backend).
3. **JWT + Role-Based Auth**: `authenticateToken` + `authorize` middlewares in [authMiddleware.ts](../src/backend/src/middlewares/authMiddleware.ts). Roles: ADMIN, MANAGER, STAFF.
4. **Service Layer**: Business logic in services (e.g., `authService.ts`, `inventoryService.ts`). Controllers call services; never call Prisma directly from routes.
5. **Error Handling**: Custom `AppError` class in [errorHandler.ts](../src/backend/src/middlewares/errorHandler.ts) with consistent Farsi messages. Global error handler at app level.
6. **Socket.IO**: Real-time notifications via `socketService` (located in [socketService.ts](../src/backend/src/services/socketService.ts)). Do not emit events directly; use socket service methods.

## Build & Development

### Root-Level Commands
```bash
npm run dev              # All services (frontend, backend, admin-frontend, admin-backend)
npm run dev:main        # Frontend + backend only
npm run dev:admin       # Admin only
npm run build           # Build all services
npm run test            # Test all services
npm run prisma:generate # Regenerate Prisma client (required after schema changes)
npm run prisma:migrate  # Run migrations
npm run docker:up       # Docker Compose local environment
```

### Service-Specific Builds
Each service has its own npm scripts. Before building/testing, `cd` into the service directory (e.g., `cd src/backend && npm run build`).

**Important**: Prisma client is **generated** into `src/shared/generated/client/`, not `node_modules`. Always run `npm run prisma:generate` after schema changes; do not import Prisma from `node_modules`.

## Multi-Tenant Middleware Deep Dive

### resolveTenant vs requireTenant

**`resolveTenant`** (Optional Tenant Context)
- Middleware that **attempts** to extract tenant from subdomain/host header
- **Non-blocking**: If no subdomain found or tenant doesn't exist, continues without `req.tenant` set
- Used on: Auth routes (login, register), public routes, API gateway routes
- Checks: `X-Tenant-Subdomain` header → Host header → skips if neither available
- Behavior: Skips public subdomains (www, admin, api) unless `X-Tenant-Subdomain` header explicitly provided

**`requireTenant`** (Mandatory Tenant Context)
- Middleware that **requires** `req.tenant` to be set (must be called AFTER `resolveTenant`)
- **Blocking**: Returns 400 error if `req.tenant` is undefined
- Used on: All protected routes that operate on tenant data (inventory, accounting, CRM, etc.)
- Pattern: `router.get('/', authenticate, requireTenant, handler)`

### Usage Pattern in Routes

```typescript
// Auth routes - use resolveTenant (optional, allows multi-tenant login)
import { resolveTenant } from '../middlewares/tenantMiddleware';
router.post('/login', resolveTenant, async (req, res) => {
  // Can work with or without tenant context
  // Used for universal login across all tenants
});

// Protected routes - use requireTenant (mandatory)
import { requireTenant } from '../middlewares/tenantMiddleware';
router.get('/', authenticate, requireTenant, async (req, res) => {
  // req.tenant.id is guaranteed to exist
  const tenantId = req.tenant!.id; // Safe to use
  const items = await prisma.item.findMany({
    where: { tenantId }
  });
});
```

### How resolveTenant Resolves Tenant

1. Extracts subdomain from Host header (e.g., "dima.servaan.ir" → "dima")
2. Checks for `X-Tenant-Subdomain` header (overrides Host if present)
3. Queries database: `prisma.tenant.findUnique({ where: { subdomain } })`
4. Validates tenant is active and subscription not expired
5. Sets `req.tenant` object with id, subdomain, name, plan, isActive, features
6. If tenant not found: returns 404 with Farsi error message
7. If database unavailable: returns 503 (allows `/api/tenants` route to continue)

### Admin vs Regular Routes

```typescript
// Admin panel routes - may use requireTenant for workspace switching
// Admin can switch between tenants via UI, so requireTenant ensures tenant context
router.get('/admin/api/tenants/:tenantId/users', 
  authenticate, 
  requireTenant, 
  authorize(['SUPER_ADMIN']), 
  handler
);

// Regular workspace routes - requires tenantId in query/body for multi-tenant apps
// User's tenantId determined by subdomain via resolveTenant
router.get('/api/inventory', 
  authenticate, 
  requireTenant,  // req.tenant.id from subdomain
  handler
);
```

## Critical Workflows

### Adding a New Endpoint
1. **Add Prisma model** to [schema.prisma](../src/prisma/schema.prisma) if needed
2. **Run `npm run prisma:generate`** to regenerate client
3. **Create service method** in `src/backend/src/services/*Service.ts` (e.g., `inventoryService.ts`)
4. **Create route handler** in `src/backend/src/routes/*Routes.ts`
5. **Register route** in [index.ts](../src/backend/src/index.ts) with correct middleware (e.g., `app.use('/api/inventory', inventoryRoutes)`)
6. **Test in integration tests** (see testing section)

### Multi-Tenant Data Handling
- Every endpoint that reads/writes tenant data must check `req.tenant?.id` or use middleware:
  ```typescript
  // Get tenant context from middleware
  const tenantId = req.tenant?.id;
  // Always filter by tenantId
  const data = await prisma.item.findMany({
    where: { tenantId }  // REQUIRED
  });
  ```
- Admin endpoints use `requireTenant` for workspace switching; user endpoints use `resolveTenant`.

### Running Tests
```bash
cd src/backend
npm test                # Run all tests (jest)
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:integration  # Integration tests only
```
Tests run **sequentially** (maxWorkers: 1) to avoid race conditions. Test database is created via [setup-test-db.js](../src/backend/setup-test-db.js).

## Code Patterns & Conventions

### Service Layer Pattern

Services contain business logic and Prisma calls. **Always include `tenantId` parameter and filter all queries by it.** Multiple patterns used across codebase:

**Pattern 1: Export individual async functions (Inventory, Customer services)**
```typescript
// From inventoryService.ts
export const getInventoryEntries = async (
  tenantId: string,
  itemId: string,
  limit: number = 50,
  offset: number = 0
) => {
  if (!tenantId) throw new AppError('Tenant ID required', 400);
  const entries = await prisma.inventoryEntry.findMany({
    where: { tenantId, itemId },        // ALWAYS filter by tenantId
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  return entries;
};
```

**Pattern 2: Export static class methods (Accounting, Chart of Accounts)**
```typescript
// From chartOfAccountsService.ts
export class ChartOfAccountsService {
  static async createAccount(data: ChartOfAccountData) {
    // tenantId is always part of data
    return await prisma.chartOfAccount.create({
      data: {
        ...data,                    // includes tenantId
        level: data.parentAccountId ? 2 : 1,
        isSystemAccount: true
      }
    });
  }

  static async getAccountHierarchy(tenantId: string, accountType?: AccountType) {
    const whereClause = accountType 
      ? { accountType, isActive: true, tenantId }  // Filter by tenantId
      : { isActive: true, tenantId };
    
    const accounts = await prisma.chartOfAccount.findMany({
      where: whereClause,
      orderBy: { accountCode: 'asc' }
    });
    return this.buildHierarchy(accounts);
  }

  static async getAccountBalance(tenantId: string, accountId: string): Promise<number> {
    const result = await prisma.journalEntryLine.aggregate({
      where: { 
        journalEntry: { tenantId },  // Nested filter for related model
        accountId 
      },
      _sum: { debitAmount: true, creditAmount: true }
    });
    return (result._sum?.debitAmount || 0) - (result._sum?.creditAmount || 0);
  }
}
```

**Pattern 3: CRM/Customer service with complex phone validation and filtering**
```typescript
// From customerService.ts - Iranian phone validation
export function validateAndNormalizePhone(phone: string): PhoneValidationResult {
  const errors: string[] = [];
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  
  // Validate Iranian mobile patterns
  const iranianMobilePatterns = [
    /^989[0-9]{9}$/,    // +989XXXXXXXXX
    /^09[0-9]{9}$/,     // 09XXXXXXXXX
    /^9[0-9]{9}$/,      // 9XXXXXXXXX
  ];

  const isValidPattern = iranianMobilePatterns.some(p => p.test(digitsOnly));
  if (!isValidPattern) {
    errors.push('فرمت شماره تلفن معتبر نیست');
    return { isValid: false, errors };
  }

  // Normalize to +98XXXXXXXXXX format
  let normalized = digitsOnly;
  if (normalized.startsWith('09')) {
    normalized = '+98' + normalized.substring(1);
  } else if (normalized.startsWith('9')) {
    normalized = '+98' + normalized;
  }

  return { isValid: true, normalized, errors: [] };
}

export async function createCustomer(
  data: CustomerCreateData,
  createdBy: string
): Promise<any> {
  // Validate phone
  const phoneValidation = validateAndNormalizePhone(data.phone);
  if (!phoneValidation.isValid) {
    throw new AppError(phoneValidation.errors.join(', '), 400);
  }

  // Check existence with tenantId filter
  const exists = await customerExistsByPhone(data.phone, data.tenantId);
  if (exists) {
    throw new AppError('مشتری با این شماره تلفن قبلاً ثبت شده است', 409);
  }

  // Create with tenantId
  const customer = await prisma.customer.create({
    data: {
      phone: data.phone,
      phoneNormalized: phoneValidation.normalized!,
      name: data.name.trim(),
      segment: 'NEW',
      status: 'ACTIVE',
      tenantId: data.tenantId,      // REQUIRED
      createdBy
    }
  });
  return customer;
}

// List with pagination and multi-field filtering
export async function getCustomers(
  filter: CustomerFilter = {},
  tenantId: string  // ALWAYS required
): Promise<any> {
  const page = filter.page || 1;
  const limit = filter.limit || 50;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,  // Base filter - NEVER OMIT
    ...(filter.search && {
      OR: [
        { name: { contains: filter.search } },
        { phone: { contains: filter.search } }
      ]
    }),
    ...(filter.status && { status: filter.status }),
    ...(filter.segment && { segment: filter.segment })
  };

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return { data: customers, pagination: { page, limit, total } };
}
```

**Pattern 4: Journal Entry service with double-entry accounting validation and transactions**
```typescript
// From journalEntryService.ts - Accounting integrations
export class JournalEntryService {
  static async createJournalEntry(data: JournalEntryData, createdBy: string, tenantId: string) {
    // Validate double-entry bookkeeping (debits = credits)
    this.validateDoubleEntry(data.lines);

    // Generate sequential entry number per tenant
    const entryNumber = await this.generateEntryNumber(tenantId);

    return await prisma.$transaction(async (tx) => {
      // Create header
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: data.entryDate,
          description: data.description,
          totalDebit: data.lines.reduce((sum, l) => sum + l.debitAmount, 0),
          totalCredit: data.lines.reduce((sum, l) => sum + l.creditAmount, 0),
          createdBy,
          status: 'DRAFT',
          tenantId  // REQUIRED
        }
      });

      // Create lines (account entries) for each account
      const lines = await Promise.all(
        data.lines.map((line, index) =>
          tx.journalEntryLine.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: line.accountId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              lineNumber: index + 1,
              costCenterId: line.costCenterId,
              tenantId  // REQUIRED on every line
            }
          })
        )
      );

      return { ...journalEntry, lines };
    });
  }

  static validateDoubleEntry(lines: JournalEntryLineData[]): void {
    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError('دفتر حساب‌ها باید متعادل باشد', 400);
    }
  }
}
```

**Pattern 5: Campaign/Marketing service with nested tenant filtering**
```typescript
// From campaignService.ts - Multi-step operations with validation
export class CampaignService {
  static async createCampaign(data: CampaignCreateData, createdBy: string) {
    // Validate segment matches tenant
    const segment = await prisma.crmCustomerSegment.findUnique({
      where: { id: data.targetSegment.segmentId }
    });

    if (!segment || segment.tenantId !== data.tenantId) {
      throw new AppError('بخش هدف در این مجموعه یافت نشد', 404);
    }

    // Use transaction for atomic operations
    return await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          name: data.name,
          campaignType: data.campaignType,
          status: 'DRAFT',
          tenantId: data.tenantId,  // REQUIRED
          createdBy
        }
      });

      // Get segment customers (with tenantId filter)
      const customers = await tx.customer.findMany({
        where: {
          tenantId: data.tenantId,  // REQUIRED
          segment: data.targetSegment.segmentValue
        },
        select: { id: true }
      });

      // Create deliveries
      const deliveries = await tx.campaignDelivery.createMany({
        data: customers.map(c => ({
          campaignId: campaign.id,
          customerId: c.id,
          tenantId: data.tenantId,  // REQUIRED
          status: 'PENDING'
        }))
      });

      return { campaign, deliveriesCreated: deliveries.count };
    });
  }
}
```


### Error Handling Pattern
Always throw `AppError` with Farsi messages (e.g., "موجودی کافی نیست" for low stock):
```typescript
import { AppError } from '../middlewares/errorHandler';
if (!user) throw new AppError('کاربر یافت نشد', 404);
```

### API Response Pattern
Controllers return plain objects; express middleware auto-converts to JSON. Include pagination metadata:
```typescript
return {
  data: items,
  pagination: { page, limit, total: items.length }
};
```

### Frontend Patterns
- **useAuth hook** ([contexts/AuthContext.tsx](../src/frontend/contexts/AuthContext.tsx)): Manages JWT token & user state
- **useWorkspace hook**: Gets current tenant context (subdomain, id)
- **API calls via axios**: Set auth header in `ClientInitializer.tsx` interceptor
- **RTL Layout**: All components include `dir="rtl"` and Tailwind RTL utilities

### Database Constraints
- All timestamps use `DateTime` with `@default(now())` and `@updatedAt`
- Soft deletes not used; rows are deleted or marked inactive
- Weighted Average Cost (WAC) for inventory valuation (not FIFO)
- Inventory operations (IN/OUT) use `type` field; OUT cannot drive stock negative (except ADJUSTMENT with reason)

## Integration Points

### Prisma Schema Changes
1. Edit [schema.prisma](../src/prisma/schema.prisma)
2. Run `npm run prisma:migrate` (creates migration file)
3. Run `npm run prisma:generate` (regenerates client in `src/shared/`)
4. Restart backend (dev will hot-reload)

### Socket.IO Events
Do not emit events directly; use `socketService` methods:
```typescript
import { socketService } from '../services/socketService';
// Emit to specific user
socketService.emitToUser(userId, 'notification', { message: '...' });
// Broadcast to tenant
socketService.emitToTenant(tenantId, 'stockAlert', { itemId, quantity });
```

### Accounting Integration
- Journal entries auto-generated from orders via `orderAccountingIntegrationService`
- Chart of accounts has 45 standard Farsi accounts (see `chartOfAccountsService.ts`)
- All financial statements (ترازنامه, سود و زیان) query journal entries, not raw ledger

### Reports & BI
- Custom reports built via query builder (`queryBuilder.ts`), not hardcoded SQL
- BI dashboards use `biService.ts` for KPI calculations
- Excel export via `exportService.ts` (supports Farsi formatting)

## Environment & Deployment

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Signing secret for tokens (use strong random in production)
- `NODE_ENV`: "development", "test", or "production"
- `BACKEND_PORT`: API server port (default 3001)
- `KAVENEGAR_API_KEY`: SMS service API key (optional, for production SMS)

### Docker Deployment
- Uses multi-stage builds; backend and frontend have separate Dockerfiles
- **Important**: Docker build context must copy entire project (see [DOCKER_DEPLOYMENT_GUIDE.md](../DOCKER_DEPLOYMENT_GUIDE.md))
- Database runs in PostgreSQL container via docker-compose

### Common Issues
1. **Relative import failures**: Ensure Docker copies entire project structure
2. **Prisma client not found**: Run `npm run prisma:generate`; client lives in `src/shared/`, not `node_modules`
3. **CORS errors**: Check allowed origins in [config.ts](../src/backend/src/config.ts)
4. **Token expiration**: Default 7 days; adjust in authService or config

## Useful Files Reference

| File | Purpose |
|------|---------|
| [schema.prisma](../src/prisma/schema.prisma) | Database models (1964 lines, ~50 models) |
| [index.ts](../src/backend/src/index.ts) | Express app setup, route registration, Socket.IO init |
| [authMiddleware.ts](../src/backend/src/middlewares/authMiddleware.ts) | JWT verification, role-based access control |
| [authService.ts](../src/backend/src/services/authService.ts) | Token generation, login, password hashing |
| [inventoryService.ts](../src/backend/src/services/inventoryService.ts) | Core inventory logic (validate stock, calculate valuation) |
| [tenantMiddleware.ts](../src/backend/src/middlewares/tenantMiddleware.ts) | Multi-tenant context resolution |
| [errorHandler.ts](../src/backend/src/middlewares/errorHandler.ts) | AppError class, global error handler |
| [queryBuilder.ts](../src/backend/src/services/queryBuilder.ts) | Dynamic report query construction |
| [socketService.ts](../src/backend/src/services/socketService.ts) | Real-time event emission |
| [layout.tsx](../src/frontend/app/layout.tsx) | Root layout, provider setup, RTL config |
| [AuthContext.tsx](../src/frontend/contexts/AuthContext.tsx) | Frontend auth state management |

## Notes

- **Farsi Localization**: Dates use Farsi calendar/digits, currencies in Toman (no decimals), error messages in Farsi
- **Admin Panel**: Separate from main app; accessible via `/admin` (separate frontend/backend in `src/admin/`)
- **Deep Reading**: Before implementing changes, read related service files, database models, and affected routes to avoid breaking multi-tenant isolation or API contracts
- **Cursor Rules**: See `.cursor/rules/` for additional project-specific conventions

