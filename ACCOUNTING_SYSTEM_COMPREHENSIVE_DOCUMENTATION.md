# Accounting System Workspace - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Core Features](#core-features)
7. [Integration Features](#integration-features)
8. [User Roles and Permissions](#user-roles-and-permissions)
9. [API Endpoints](#api-endpoints)
10. [Business Logic](#business-logic)
11. [Testing](#testing)

---

## Overview

The Accounting System workspace is a comprehensive financial management system designed for Iranian businesses. It implements double-entry bookkeeping principles, supports Persian calendar-based numbering, and provides complete financial reporting capabilities. The system integrates seamlessly with the Ordering & Sales System and Inventory Management workspace to automatically generate journal entries for business transactions.

### Key Characteristics

- **Double-Entry Bookkeeping**: Enforces balanced debit/credit entries
- **Iranian Chart of Accounts**: Pre-configured with 45+ standard Iranian accounts
- **Persian Calendar Support**: Entry numbering based on Shamsi (Persian) year
- **Multi-Tenant Architecture**: Complete data isolation per tenant
- **Real-Time Financial Statements**: Balance Sheet, Income Statement, Cash Flow
- **Financial Ratios Analysis**: Liquidity, profitability, leverage, and activity ratios
- **Automatic Journal Generation**: Integration with POS, Inventory, and Purchase systems
- **Trial Balance**: Real-time account balance verification
- **Cost Center Support**: Departmental and project-based cost tracking
- **Budget Management**: Budget planning and variance analysis
- **Tax Configuration**: Support for VAT, income tax, and other Iranian tax types

### Main Components

1. **Chart of Accounts (دفتر کل حساب‌ها)**: Hierarchical account structure
2. **Journal Entries (اسناد حسابداری)**: Double-entry transaction recording
3. **Financial Statements (صورت‌های مالی)**: Balance Sheet, Income Statement, Cash Flow
4. **Trial Balance (تراز آزمایشی)**: Account balance verification
5. **Financial Ratios (نسبت‌های مالی)**: Performance analysis
6. **Advanced Reports (گزارش‌های پیشرفته)**: Custom financial reports
7. **Cost Centers (مراکز هزینه)**: Departmental cost allocation
8. **Budget Management (بودجه‌بندی)**: Budget planning and tracking

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │ Chart of     │  │  Journal     │     │
│  │              │  │ Accounts     │  │  Entries     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Financial   │  │ Trial        │  │  Financial   │     │
│  │  Statements  │  │ Balance      │  │  Ratios      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Accounting Controller                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Chart of     │  │ Journal      │  │  Financial   │   │
│  │ Accounts     │  │ Entry        │  │  Statements  │   │
│  │ Service      │  │ Service      │  │  Service      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ChartOf      │  │ Journal      │  │  Journal     │     │
│  │ Account      │  │ Entry        │  │  EntryLine   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Financial    │  │ Cost         │  │  Budget      │     │
│  │ Statement    │  │ Center       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (React framework)
- TypeScript
- Tailwind CSS
- React Hooks (useState, useEffect, useCallback)
- Custom UI components (FarsiDatePicker, FormattedNumberInput)

**Backend:**
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Express-validator for input validation

**Database:**
- PostgreSQL
- Prisma schema definitions
- Multi-tenant isolation via `tenantId`

### Data Flow

1. **User Action** → Frontend component
2. **API Call** → AccountingService (frontend)
3. **HTTP Request** → Backend route (accountingRoutes.ts)
4. **Validation** → Express-validator middleware
5. **Business Logic** → Service layer (ChartOfAccountsService, JournalEntryService, etc.)
6. **Database Operation** → Prisma ORM
7. **Response** → JSON response to frontend
8. **UI Update** → React state update

---

## Database Schema

### Core Models

#### ChartOfAccount Model

```prisma
model ChartOfAccount {
  id                String             @id @default(cuid())
  tenantId          String
  tenant            Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  accountCode       String             @db.VarChar(20)
  accountName       String             @db.VarChar(255)
  accountNameEn     String?            @db.VarChar(255)
  accountType       AccountType        // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentAccountId   String?
  level             Int                @default(1)
  normalBalance     BalanceType        // DEBIT or CREDIT
  isActive          Boolean            @default(true)
  isSystemAccount   Boolean            @default(false)
  description       String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  parentAccount     ChartOfAccount?    @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  childAccounts     ChartOfAccount[]  @relation("AccountHierarchy")
  journalEntryLines JournalEntryLine[]
  budgetLines       BudgetLine[]

  @@unique([tenantId, accountCode])
  @@index([tenantId])
  @@map("chart_of_accounts")
}
```

**Key Features:**
- Hierarchical structure with parent-child relationships
- Unique account codes per tenant
- System accounts vs. user-created accounts
- Normal balance type (DEBIT/CREDIT) for balance calculation

#### JournalEntry Model

```prisma
model JournalEntry {
  id             String             @id @default(cuid())
  tenantId       String
  tenant         Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  entryNumber    String             @unique @db.VarChar(50)  // Format: YYYY-NNNNNN (Shamsi year)
  entryDate      DateTime           @db.Date
  description    String
  reference      String?            @db.VarChar(255)
  totalDebit     Decimal            @db.Decimal(15, 2)
  totalCredit    Decimal            @db.Decimal(15, 2)
  status         JournalStatus      @default(DRAFT)  // DRAFT, POSTED, REVERSED
  sourceType     SourceType?        // MANUAL, POS, INVENTORY, PAYROLL, SYSTEM, BANK, PURCHASE, CRM
  sourceId       String?
  createdBy      String
  approvedBy     String?
  approvedAt     DateTime?
  reversedBy     String?
  reversedAt     DateTime?
  reversalReason String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  
  // Relations
  createdByUser  User               @relation("JournalCreatedBy", fields: [createdBy], references: [id])
  approvedByUser User?              @relation("JournalApprovedBy", fields: [approvedBy], references: [id])
  reversedByUser User?              @relation("JournalReversedBy", fields: [reversedBy], references: [id])
  lines          JournalEntryLine[]

  @@index([tenantId])
  @@map("journal_entries")
}
```

**Key Features:**
- Unique entry numbers based on Persian calendar year
- Status workflow: DRAFT → POSTED → REVERSED
- Source tracking for automatic vs. manual entries
- Approval workflow with user tracking

#### JournalEntryLine Model

```prisma
model JournalEntryLine {
  id             String         @id @default(cuid())
  tenantId       String
  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  journalEntryId String
  accountId      String
  description    String?
  debitAmount    Decimal        @default(0) @db.Decimal(15, 2)
  creditAmount   Decimal        @default(0) @db.Decimal(15, 2)
  lineNumber     Int
  costCenterId   String?
  projectCode    String?        @db.VarChar(100)
  createdAt      DateTime       @default(now())
  
  // Relations
  account        ChartOfAccount @relation(fields: [accountId], references: [id])
  costCenter     CostCenter?    @relation(fields: [costCenterId], references: [id])
  journalEntry   JournalEntry   @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("journal_entry_lines")
}
```

**Key Features:**
- Each line links to one account
- Supports cost center and project code allocation
- Line numbers for ordering

### Supporting Models

#### CostCenter Model

```prisma
model CostCenter {
  id                 String             @id @default(cuid())
  tenantId           String
  tenant             Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code               String             @unique @db.VarChar(20)
  name               String             @db.VarChar(255)
  nameEn             String?            @db.VarChar(255)
  description        String?
  parentCostCenterId String?
  level              Int                @default(1)
  isActive           Boolean            @default(true)
  managerId          String?
  budgetAllocated    Decimal            @default(0) @db.Decimal(15, 2)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  // Relations
  manager            User?              @relation(fields: [managerId], references: [id])
  parentCostCenter   CostCenter?        @relation("CostCenterHierarchy", fields: [parentCostCenterId], references: [id])
  childCostCenters   CostCenter[]      @relation("CostCenterHierarchy")
  budgetLines        BudgetLine[]
  journalEntryLines  JournalEntryLine[]

  @@index([tenantId])
  @@map("cost_centers")
}
```

#### FinancialStatement Model

```prisma
model FinancialStatement {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  statementType   StatementType // BALANCE_SHEET, INCOME_STATEMENT, CASH_FLOW, EQUITY_CHANGES
  fiscalYear      Int
  period          String        @db.VarChar(50)
  startDate       DateTime      @db.Date
  endDate         DateTime      @db.Date
  data            Json          // Cached statement data
  generatedBy     String
  generatedAt     DateTime      @default(now())
  generatedByUser User          @relation(fields: [generatedBy], references: [id])

  @@unique([statementType, fiscalYear, period])
  @@index([tenantId])
  @@map("financial_statements")
}
```

#### Budget and BudgetLine Models

```prisma
model Budget {
  id             String       @id @default(cuid())
  tenantId       String
  tenant         Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name           String       @db.VarChar(255)
  nameEn         String?      @db.VarChar(255)
  fiscalYear     Int
  startDate      DateTime     @db.Date
  endDate        DateTime     @db.Date
  status         BudgetStatus @default(DRAFT)  // DRAFT, APPROVED, ACTIVE, CLOSED
  totalBudget    Decimal      @default(0) @db.Decimal(15, 2)
  description    String?
  createdBy      String
  approvedBy     String?
  approvedAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  lines          BudgetLine[]
  approvedByUser User?        @relation("BudgetApprovedBy", fields: [approvedBy], references: [id])
  createdByUser  User         @relation("BudgetCreatedBy", fields: [createdBy], references: [id])

  @@index([tenantId])
  @@map("budgets")
}

model BudgetLine {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  budgetId        String
  accountId       String
  costCenterId   String?
  plannedAmount   Decimal        @db.Decimal(15, 2)
  actualAmount    Decimal        @default(0) @db.Decimal(15, 2)
  variance        Decimal        @default(0) @db.Decimal(15, 2)
  variancePercent Decimal        @default(0) @db.Decimal(5, 2)
  periodType      PeriodType     @default(MONTHLY)  // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  account         ChartOfAccount @relation(fields: [accountId], references: [id])
  budget          Budget         @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  costCenter      CostCenter?    @relation(fields: [costCenterId], references: [id])

  @@index([tenantId])
  @@map("budget_lines")
}
```

### Enums

```prisma
enum AccountType {
  ASSET      // دارایی
  LIABILITY // بدهی
  EQUITY    // حقوق صاحبان سهام
  REVENUE   // درآمد
  EXPENSE   // هزینه
}

enum BalanceType {
  DEBIT   // بدهکار
  CREDIT  // بستانکار
}

enum JournalStatus {
  DRAFT    // پیش‌نویس
  POSTED   // ثبت شده
  REVERSED // ابطال شده
}

enum SourceType {
  MANUAL     // دستی
  POS        // فروشگاه
  INVENTORY  // موجودی
  PAYROLL    // حقوق و دستمزد
  SYSTEM     // سیستم
  BANK       // بانک
  PURCHASE   // خرید
  CRM        // مدیریت ارتباط با مشتری
}

enum StatementType {
  BALANCE_SHEET    // ترازنامه
  INCOME_STATEMENT // صورت سود و زیان
  CASH_FLOW        // صورت جریان وجه نقد
  EQUITY_CHANGES   // صورت تغییرات حقوق صاحبان سهام
}

enum BudgetStatus {
  DRAFT    // پیش‌نویس
  APPROVED // تصویب شده
  ACTIVE   // فعال
  CLOSED   // بسته شده
}

enum PeriodType {
  DAILY     // روزانه
  WEEKLY    // هفتگی
  MONTHLY   // ماهانه
  QUARTERLY // سه‌ماهه
  YEARLY    // سالانه
}

enum TaxType {
  VAT             // مالیات بر ارزش افزوده
  INCOME_TAX      // مالیات بر درآمد
  WITHHOLDING_TAX // مالیات تکلیفی
  MUNICIPAL_TAX   // مالیات شهرداری
}

enum PeriodStatus {
  OPEN    // باز
  CLOSED  // بسته
  LOCKED  // قفل شده
}
```

### Database Indexes

Key indexes for performance:

```sql
-- Chart of Accounts
CREATE INDEX idx_chart_of_accounts_tenant ON chart_of_accounts(tenant_id);
CREATE UNIQUE INDEX idx_chart_of_accounts_tenant_code ON chart_of_accounts(tenant_id, account_code);

-- Journal Entries
CREATE INDEX idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_date_status ON journal_entries(entry_date, status);
CREATE INDEX idx_journal_entries_source ON journal_entries(source_type, source_id);

-- Journal Entry Lines
CREATE INDEX idx_journal_entry_lines_tenant ON journal_entry_lines(tenant_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);

-- Financial Statements
CREATE INDEX idx_financial_statements_tenant ON financial_statements(tenant_id);
CREATE UNIQUE INDEX idx_financial_statements_unique ON financial_statements(statement_type, fiscal_year, period);
```

---

## Backend Implementation

### Route Structure

**File:** `src/backend/src/routes/accountingRoutes.ts`

All accounting routes are prefixed with `/api/accounting` and require authentication via JWT middleware.

#### Route Categories

1. **Chart of Accounts Routes** (`/chart-of-accounts/*`)
2. **Journal Entries Routes** (`/journal-entries/*`)
3. **Financial Statements Routes** (`/financial-statements/*`)
4. **Trial Balance Routes** (`/trial-balance`)
5. **Dashboard Summary Routes** (`/summary`, `/accounts/count`, etc.)

### Service Layer

#### ChartOfAccountsService

**File:** `src/backend/src/services/chartOfAccountsService.ts`

**Key Methods:**

1. **`initializeIranianChartOfAccounts(tenantId: string)`**
   - Initializes standard Iranian chart of accounts (45+ accounts)
   - Account codes: 1000-5000 series
   - Creates hierarchical structure automatically
   - Idempotent operation (can be called multiple times safely)

2. **`createAccount(data: ChartOfAccountData)`**
   - Creates new account with validation
   - Calculates level based on parent account
   - Enforces unique account codes per tenant
   - Validates account type and normal balance consistency

3. **`getAccountHierarchy(tenantId: string, accountType?: AccountType)`**
   - Returns hierarchical tree structure of accounts
   - Calculates balances for all accounts in parallel
   - Filters by account type if provided
   - Builds parent-child relationships

4. **`getAccountBalance(tenantId: string, accountId: string, asOfDate?: Date)`**
   - Calculates account balance as of specific date
   - Considers only POSTED journal entries
   - Uses normal balance type (DEBIT/CREDIT) for calculation
   - Formula:
     - DEBIT accounts: `balance = totalDebits - totalCredits`
     - CREDIT accounts: `balance = totalCredits - totalDebits`

5. **`validateRequiredAccounts(tenantId: string)`**
   - Validates presence of required accounts for integrations
   - Required codes: 1101 (Cash), 1102 (Bank), 1103 (AR), 1104 (Inventory), 4101 (Sales), 5100 (COGS), 2102 (Tax Payable)
   - Returns list of missing accounts

6. **`searchAccounts(tenantId: string, query: string, accountType?: AccountType)`**
   - Searches by account name, code, or description
   - Case-insensitive search
   - Optional filtering by account type
   - Returns up to 50 results

**Standard Iranian Accounts Structure:**

```
1000 - دارایی‌ها (Assets)
  1100 - دارایی‌های جاری (Current Assets)
    1101 - صندوق (Cash)
    1102 - بانک (Bank)
    1103 - حساب‌های دریافتنی (Accounts Receivable)
    1104 - موجودی کالا (Inventory)
    1105 - پیش‌پرداخت‌ها (Prepaid Expenses)
  1200 - دارایی‌های ثابت (Fixed Assets)
    1201 - ساختمان (Buildings)
    1202 - تجهیزات (Equipment)
    1203 - استهلاک انباشته (Accumulated Depreciation)

2000 - بدهی‌ها (Liabilities)
  2100 - بدهی‌های جاری (Current Liabilities)
    2101 - حساب‌های پرداختنی (Accounts Payable)
    2102 - مالیات پرداختنی (Tax Payable)
    2103 - بیمه پرداختنی (Insurance Payable)
    2104 - حقوق پرداختنی (Salaries Payable)

3000 - حقوق صاحبان سهام (Equity)
  3101 - سرمایه (Capital)
  3102 - سود انباشته (Retained Earnings)

4000 - درآمدها (Revenue)
  4101 - فروش کالا (Sales Revenue)
  4102 - درآمدهای متفرقه (Other Revenue)

5000 - هزینه‌ها (Expenses)
  5100 - بهای تمام شده کالای فروخته شده (COGS)
    5101 - خرید کالا (Purchases)
    5102 - حمل و نقل خرید (Freight In)
  5200 - هزینه‌های عملیاتی (Operating Expenses)
    5201 - حقوق و دستمزد (Salaries and Wages)
    5202 - اجاره (Rent Expense)
    5203 - برق و گاز (Utilities)
    5204 - تلفن و اینترنت (Communication)
    5205 - تبلیغات و بازاریابی (Marketing)
    5206 - استهلاک (Depreciation)
    5207 - تعمیر و نگهداری (Maintenance)
    5208 - لوازم اداری (Office Supplies)
```

#### JournalEntryService

**File:** `src/backend/src/services/journalEntryService.ts`

**Key Methods:**

1. **`createJournalEntry(data: JournalEntryData, createdBy: string, tenantId: string)`**
   - Validates double-entry bookkeeping (debits = credits)
   - Generates unique entry number (Shamsi year format: `YYYY-NNNNNN`)
   - Creates entry with DRAFT status
   - Uses database transaction for consistency
   - Calculates and stores totalDebit and totalCredit

2. **`postJournalEntry(id: string, approvedBy: string)`**
   - Changes status from DRAFT to POSTED
   - Re-validates double-entry balance
   - Records approver and approval timestamp
   - Only DRAFT entries can be posted

3. **`reverseJournalEntry(id: string, reversedBy: string, reversalReason: string, tenantId: string)`**
   - Marks original entry as REVERSED
   - Creates reversal entry with swapped debits/credits
   - Only POSTED entries can be reversed
   - Reversal entry number format: `REV-{originalNumber}`
   - Uses transaction to ensure consistency

4. **`getJournalEntries(filter: JournalEntryFilter, page: number, limit: number)`**
   - Server-side pagination
   - Filtering by:
     - Date range (startDate, endDate)
     - Account ID
     - Status (DRAFT, POSTED, REVERSED)
     - Source type (MANUAL, POS, INVENTORY, etc.)
     - Cost center ID
     - Search term (description, entry number, reference)
   - Returns entries with related data (lines, accounts, users)
   - Tenant isolation enforced

5. **`updateJournalEntry(id: string, data: Partial<JournalEntryData>)`**
   - Only DRAFT entries can be updated
   - Validates double-entry if lines are modified
   - Deletes and recreates lines if changed
   - Updates totals automatically

6. **`deleteJournalEntry(id: string)`**
   - Only DRAFT entries can be deleted
   - Cascades to delete all lines

7. **`generateEntryNumber()`**
   - Generates unique entry number based on Persian calendar
   - Format: `{ShamsiYear}-{6-digit-sequence}`
   - Example: `1403-000001` (first entry of year 1403)
   - Thread-safe via database query

8. **`getTrialBalance(asOfDate?: Date)`**
   - Calculates balances for all active accounts
   - Returns debit and credit balances per account
   - Filters out zero-balance accounts
   - Validates that total debits = total credits
   - Uses account normal balance for calculation

9. **`generateSalesEntry(saleData, createdBy, tenantId)`**
   - Automatic journal entry generation for sales
   - Debit: Cash/Bank/Accounts Receivable (based on payment method)
   - Credit: Sales Revenue, Tax Payable (if applicable)
   - Also creates COGS entry if recipe exists:
     - Debit: COGS account
     - Credit: Inventory account
   - Links to order via sourceId

10. **`generatePurchaseEntry(purchaseData, createdBy, tenantId)`**
    - Automatic journal entry generation for purchases
    - Debit: Purchases, Tax (if applicable)
    - Credit: Cash/Bank/Accounts Payable (based on payment method)
    - Links to purchase via sourceId

**Double-Entry Validation:**

```typescript
private static validateDoubleEntry(lines: JournalEntryLineData[]) {
  // Must have at least 2 lines
  if (lines.length < 2) {
    throw new Error('Journal entry must have at least 2 lines');
  }

  // Total debits must equal total credits
  const totalDebits = lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.creditAmount, 0);
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`Debits (${totalDebits}) must equal Credits (${totalCredits})`);
  }

  // Each line must have either debit OR credit (not both, not neither)
  for (const line of lines) {
    if (line.debitAmount > 0 && line.creditAmount > 0) {
      throw new Error('Each line must have either debit or credit amount, not both');
    }
    if (line.debitAmount === 0 && line.creditAmount === 0) {
      throw new Error('Each line must have either debit or credit amount');
    }
  }
}
```

#### FinancialStatementsService

**File:** `src/backend/src/services/financialStatementsService.ts`

**Key Methods:**

1. **`generateBalanceSheet(tenantId: string, asOfDate: Date)`**
   - Generates balance sheet as of specific date
   - Separates assets into current (1100 series) and fixed (1200 series)
   - Separates liabilities into current (2100 series) and long-term (2200 series)
   - Calculates totals and percentages
   - Validates: Total Assets = Total Liabilities + Total Equity
   - Caches result in FinancialStatement table

2. **`generateIncomeStatement(tenantId: string, startDate: Date, endDate: Date)`**
   - Generates income statement for period
   - Revenue accounts (4000 series)
   - Separates expenses into COGS (5100 series) and operating (5200 series)
   - Calculates:
     - Gross Profit = Total Revenue - COGS
     - Net Income = Total Revenue - Total Expenses
   - Caches result

3. **`generateCashFlowStatement(tenantId: string, startDate: Date, endDate: Date)`**
   - Generates cash flow statement
   - Operating Activities: Net Income + Adjustments (depreciation, etc.)
   - Investing Activities: Asset purchases/sales
   - Financing Activities: Loans, equity transactions
   - Calculates net cash flow and ending cash balance

4. **`getFinancialRatios(tenantId: string, asOfDate: Date)`**
   - Calculates comprehensive financial ratios:
     - **Liquidity Ratios:**
       - Current Ratio = Current Assets / Current Liabilities
       - Quick Ratio = (Current Assets - Inventory) / Current Liabilities
       - Cash Ratio = Cash & Equivalents / Current Liabilities
     - **Profitability Ratios:**
       - Gross Profit Margin = (Gross Profit / Revenue) × 100
       - Net Profit Margin = (Net Income / Revenue) × 100
       - Return on Assets (ROA) = (Net Income / Total Assets) × 100
       - Return on Equity (ROE) = (Net Income / Total Equity) × 100
     - **Leverage Ratios:**
       - Debt to Assets = (Total Liabilities / Total Assets) × 100
       - Debt to Equity = (Total Liabilities / Total Equity) × 100
       - Equity Ratio = (Total Equity / Total Assets) × 100
     - **Activity Ratios:**
       - Asset Turnover = Revenue / Total Assets
       - Inventory Turnover = COGS / Average Inventory
       - Receivables Turnover = Revenue / Accounts Receivable

5. **`getComparativeStatements(tenantId: string, currentPeriodEnd: Date, previousPeriodEnd: Date)`**
   - Generates comparative financial statements
   - Compares current period vs. previous period
   - Calculates variances and percentage changes
   - Returns both balance sheet and income statement comparisons

### Controller Layer

**File:** `src/backend/src/controllers/accountingController.ts`

The controller handles HTTP requests and delegates to service layer. All methods:

1. Extract tenant context from request
2. Validate authentication
3. Parse and validate request data
4. Call appropriate service method
5. Return standardized JSON response

**Response Format:**

```typescript
{
  success: boolean;
  message: string;        // Persian message
  messageEn?: string;      // English message (optional)
  data?: any;             // Response data
  error?: string;         // Error message (if failed)
}
```

**Key Controller Methods:**

- `initializeChartOfAccounts` - POST `/chart-of-accounts/initialize`
- `getAccountHierarchy` - GET `/chart-of-accounts/hierarchy`
- `createAccount` - POST `/chart-of-accounts`
- `updateAccount` - PUT `/chart-of-accounts/:id`
- `getAccountBalance` - GET `/chart-of-accounts/:accountId/balance`
- `createJournalEntry` - POST `/journal-entries`
- `getJournalEntries` - GET `/journal-entries`
- `postJournalEntry` - PUT `/journal-entries/:id/post`
- `reverseJournalEntry` - PUT `/journal-entries/:id/reverse`
- `generateBalanceSheet` - GET `/financial-statements/balance-sheet`
- `generateIncomeStatement` - GET `/financial-statements/income-statement`
- `generateCashFlowStatement` - GET `/financial-statements/cash-flow`
- `getFinancialRatios` - GET `/financial-statements/ratios`
- `getTrialBalance` - GET `/trial-balance`
- `getSummary` - GET `/summary`

### Validation

**File:** `src/backend/src/routes/accountingRoutes.ts`

Uses Express-validator for input validation:

- Account codes: max 20 characters, required
- Account names: max 255 characters, required
- Account types: enum validation (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- Normal balance: enum validation (DEBIT, CREDIT)
- Journal entry dates: ISO8601 format
- Journal entry lines: minimum 2 lines, debit/credit validation
- Amounts: numeric, non-negative
- Entry numbers: CUID format validation

---

## Frontend Implementation

### Page Structure

All accounting pages are located under `src/frontend/app/workspaces/accounting-system/`:

```
accounting-system/
├── layout.tsx                    # Workspace layout with sidebar
├── page.tsx                      # Dashboard
├── chart-of-accounts/
│   └── page.tsx                  # Chart of Accounts management
├── journal-entries/
│   ├── page.tsx                  # Journal Entries list
│   └── create/
│       └── page.tsx              # Create new journal entry
├── financial-statements/
│   └── page.tsx                  # Financial Statements (Balance Sheet, Income Statement)
├── trial-balance/
│   └── page.tsx                  # Trial Balance report
├── financial-ratios/
│   └── page.tsx                  # Financial Ratios analysis
└── advanced-reports/
    └── page.tsx                  # Advanced custom reports
```

### Service Layer

**File:** `src/frontend/services/accountingService.ts`

The `AccountingService` class provides a clean interface to all accounting API endpoints.

**Key Methods:**

1. **Chart of Accounts:**
   - `initializeChartOfAccounts()` - Initialize standard accounts
   - `getAccountHierarchy(accountType?)` - Get hierarchical account structure
   - `createAccount(accountData)` - Create new account
   - `updateAccount(accountId, accountData)` - Update account
   - `getAccountById(accountId)` - Get account details
   - `searchAccounts(query, accountType?)` - Search accounts
   - `getAccountBalance(accountId, asOfDate?)` - Get account balance

2. **Journal Entries:**
   - `createJournalEntry(entryData)` - Create new entry
   - `getJournalEntries(params)` - Get entries with filters and pagination
   - `getJournalEntryById(id)` - Get entry details
   - `postJournalEntry(id)` - Approve/post entry
   - `reverseJournalEntry(id, reason)` - Reverse entry
   - `updateJournalEntry(id, entryData)` - Update entry
   - `deleteJournalEntry(id)` - Delete entry
   - `getTrialBalance(asOfDate?)` - Get trial balance

3. **Financial Statements:**
   - `generateBalanceSheet(asOfDate?)` - Generate balance sheet
   - `generateIncomeStatement(startDate, endDate)` - Generate income statement
   - `generateCashFlowStatement(startDate, endDate)` - Generate cash flow
   - `getFinancialRatios(asOfDate?)` - Get financial ratios
   - `getComparativeStatements(currentPeriodEnd, previousPeriodEnd)` - Get comparative statements

4. **Utility Methods:**
   - `formatCurrency(amount)` - Format as Iranian Toman
   - `formatNumber(amount)` - Format number with Persian digits
   - `formatPercentage(value)` - Format as percentage
   - `getAccountTypeLabel(accountType)` - Get Persian label
   - `getJournalStatusLabel(status)` - Get Persian status label
   - `getJournalStatusColor(status)` - Get status badge color

**API Request Pattern:**

```typescript
private static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}/accounting${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  // Extract data from API response structure
  if (result.success && result.data !== undefined) {
    return result.data;
  }
  
  return result;
}
```

### Dashboard Page

**File:** `src/frontend/app/workspaces/accounting-system/page.tsx`

**Features:**
- Real-time statistics cards:
  - Total Accounts
  - Monthly Journal Entries
  - Current Balance
  - Pending Entries
- Quick action buttons
- Recent journal entries table
- Responsive design (mobile-friendly)

**Data Fetching:**

```typescript
const fetchAccountingData = async () => {
  const json = await getAccountingSummary();
  // Updates stats and recent entries
};
```

**API Endpoint:** `GET /api/accounting/summary`

### Chart of Accounts Page

**File:** `src/frontend/app/workspaces/accounting-system/chart-of-accounts/page.tsx`

**Features:**
- Hierarchical tree view of accounts
- Search and filter by account type
- Create new account modal
- Edit account modal
- View account details modal
- Account balance display
- Color-coded account types

**Key Components:**
- Account tree with expand/collapse
- Account type filters (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- Account form with validation
- Balance display with currency formatting

**State Management:**
- `accounts` - Array of accounts with hierarchy
- `searchTerm` - Search filter
- `selectedType` - Account type filter
- `showAddModal`, `showEditModal`, `showViewModal` - Modal states

### Journal Entries Page

**File:** `src/frontend/app/workspaces/accounting-system/journal-entries/page.tsx`

**Features:**
- List of journal entries with pagination
- Filter by status (DRAFT, POSTED, REVERSED)
- Filter by account
- Search by description, entry number, reference
- View entry details modal
- Approve/post entry
- Reverse entry with reason
- Edit draft entries
- Delete draft entries

**Entry Display:**
- Entry number (Persian calendar format)
- Entry date
- Description
- Total debit/credit amounts
- Status badge (color-coded)
- Source type indicator
- Action buttons (Approve, Reverse, Edit, Delete)

**Entry Details Modal:**
- All entry information
- List of all lines with:
  - Account code and name
  - Description
  - Debit amount
  - Credit amount
  - Cost center (if applicable)
  - Project code (if applicable)
- Totals validation (debits = credits)

### Create Journal Entry Page

**File:** `src/frontend/app/workspaces/accounting-system/journal-entries/create/page.tsx`

**Features:**
- Multi-line entry form
- Account selection modal
- Real-time balance validation
- Add/remove lines dynamically
- Date picker (Persian calendar)
- Formatted number inputs
- Auto-calculation of totals

**Form Validation:**
- Minimum 2 lines required
- Each line must have account selected
- Each line must have either debit OR credit (not both)
- Total debits must equal total credits
- Entry date required
- Description required

**Account Selection:**
- Hierarchical account tree
- Search functionality
- Account type filtering
- Account balance display

### Financial Statements Page

**File:** `src/frontend/app/workspaces/accounting-system/financial-statements/page.tsx`

**Features:**
- Tabbed interface:
  - Balance Sheet (ترازنامه)
  - Income Statement (صورت سود و زیان)
- Date range selection
- Real-time statement generation
- Formatted currency display
- Percentage calculations
- Responsive layout

**Balance Sheet Display:**
- Assets section:
  - Current Assets (with breakdown)
  - Fixed Assets (with breakdown)
  - Total Assets
- Liabilities & Equity section:
  - Current Liabilities
  - Long-term Liabilities
  - Total Liabilities
  - Equity Accounts
  - Total Equity
  - Total Liabilities & Equity

**Income Statement Display:**
- Revenue section:
  - Revenue accounts with amounts
  - Total Revenue
- Expenses section:
  - Cost of Goods Sold
  - Operating Expenses
  - Total Expenses
- Calculated values:
  - Gross Profit
  - Net Income

### Trial Balance Page

**File:** `src/frontend/app/workspaces/accounting-system/trial-balance/page.tsx`

**Features:**
- Date selection (as of date)
- Account list with balances
- Debit and credit columns
- Account type filtering
- Search functionality
- Balance validation indicator
- Export functionality

**Display:**
- Account code and name
- Account type badge
- Debit balance
- Credit balance
- Totals row with validation

### Financial Ratios Page

**File:** `src/frontend/app/workspaces/accounting-system/financial-ratios/page.tsx`

**Features:**
- Category-based organization:
  - Liquidity Ratios (نسبت‌های نقدینگی)
  - Profitability Ratios (نسبت‌های سودآوری)
  - Leverage Ratios (نسبت‌های اهرم مالی)
  - Activity Ratios (نسبت‌های فعالیت)
- Visual charts (Bar chart, Pie chart)
- Status indicators (Good, Warning, Poor)
- Target values comparison
- Percentage formatting

**Ratio Cards:**
- Ratio name and description
- Current value
- Target value
- Status badge
- Visual progress indicator

### Advanced Reports Page

**File:** `src/frontend/app/workspaces/accounting-system/advanced-reports/page.tsx`

**Features:**
- Custom report builder
- Field selection
- Filter configuration
- Report type selection (Tabular, Chart, Dashboard, Pivot)
- Report execution
- Export to PDF/Excel
- Report templates

### Layout Component

**File:** `src/frontend/app/workspaces/accounting-system/layout.tsx`

**Features:**
- Sidebar navigation with icons
- Workspace branding
- User context
- Responsive sidebar (expandable/collapsible)
- Active route highlighting

**Navigation Items:**
1. Dashboard (داشبورد حسابداری)
2. Chart of Accounts (دفتر کل حساب‌ها)
3. Journal Entries (سند حسابداری)
4. Financial Reports (گزارش‌های مالی)
5. Trial Balance (تراز آزمایشی)
6. Financial Ratios (نسبت‌های مالی)
7. Advanced Reports (گزارش‌های پیشرفته)

### UI Components

**FarsiDatePicker:**
- Persian calendar support
- Date selection with calendar popup
- Formatted display (Persian digits)

**FormattedNumberInput:**
- Persian digit formatting
- Currency formatting
- Input validation
- Thousand separators

**Common Patterns:**
- Loading states with spinners
- Error handling with user-friendly messages
- Success notifications
- Confirmation dialogs for destructive actions
- Responsive grid layouts
- Dark mode support

---

## Core Features

### 1. Chart of Accounts Management

#### Account Hierarchy

The system supports a hierarchical account structure with unlimited levels:

- **Parent-Child Relationships**: Accounts can have parent accounts, creating a tree structure
- **Level Calculation**: Automatically calculates account level based on parent
- **Account Codes**: Unique codes per tenant (e.g., 1101, 1102, 4101)
- **Account Types**: Five main types (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- **Normal Balance**: Each account has a normal balance type (DEBIT or CREDIT)

#### Account Operations

**Create Account:**
- Account code (unique per tenant)
- Account name (Persian and English)
- Account type selection
- Normal balance type
- Parent account selection (optional)
- Description

**Update Account:**
- Can update name, description
- Cannot change account code or type if transactions exist
- Cannot change parent if child accounts exist

**Deactivate Account:**
- Soft delete (sets `isActive = false`)
- Cannot deactivate if transactions exist
- Preserves historical data

**Account Balance Calculation:**
- Real-time balance calculation
- Considers only POSTED journal entries
- Uses normal balance type for correct sign
- Supports "as of date" queries

#### Standard Iranian Accounts

The system includes 45+ pre-configured accounts following Iranian accounting standards:

- **1000 Series**: Assets (دارایی‌ها)
- **2000 Series**: Liabilities (بدهی‌ها)
- **3000 Series**: Equity (حقوق صاحبان سهام)
- **4000 Series**: Revenue (درآمدها)
- **5000 Series**: Expenses (هزینه‌ها)

### 2. Journal Entries

#### Double-Entry Bookkeeping

Every journal entry enforces double-entry principles:

- **Minimum 2 Lines**: Each entry must have at least 2 lines
- **Balance Validation**: Total debits must equal total credits
- **Line Rules**: Each line must have either debit OR credit (not both, not neither)
- **Account Validation**: All accounts must exist and be active

#### Entry Status Workflow

```
DRAFT → POSTED → REVERSED
```

**DRAFT:**
- Newly created entries
- Can be edited or deleted
- Not included in financial statements
- Not included in account balances

**POSTED:**
- Approved entries
- Cannot be edited or deleted
- Included in financial statements
- Included in account balances
- Can be reversed

**REVERSED:**
- Cancelled entries
- Original entry marked as REVERSED
- Reversal entry created with swapped debits/credits
- Both entries remain in system for audit trail

#### Entry Numbering

- **Format**: `{ShamsiYear}-{6-digit-sequence}`
- **Example**: `1403-000001` (first entry of Persian year 1403)
- **Uniqueness**: Guaranteed by database constraint
- **Persian Calendar**: Based on Shamsi (Persian) year, not Gregorian

#### Entry Sources

Entries can be created from multiple sources:

- **MANUAL**: Created manually by user
- **POS**: Generated from Point of Sale transactions
- **INVENTORY**: Generated from inventory movements
- **PAYROLL**: Generated from payroll processing
- **SYSTEM**: System-generated entries
- **BANK**: Bank transaction imports
- **PURCHASE**: Purchase order processing
- **CRM**: Customer relationship management events

#### Entry Operations

**Create Entry:**
- Entry date (Persian calendar support)
- Description (required)
- Reference (optional)
- Multiple lines with accounts, amounts
- Cost center allocation (optional)
- Project code (optional)

**Approve/Post Entry:**
- Changes status from DRAFT to POSTED
- Records approver and timestamp
- Validates balance before posting
- Updates account balances

**Reverse Entry:**
- Requires reversal reason
- Creates reversal entry automatically
- Maintains audit trail
- Only POSTED entries can be reversed

**Edit Entry:**
- Only DRAFT entries can be edited
- Can modify all fields including lines
- Re-validates balance after changes

**Delete Entry:**
- Only DRAFT entries can be deleted
- Permanently removes entry and lines

### 3. Financial Statements

#### Balance Sheet (ترازنامه)

**Purpose**: Shows financial position at a specific date

**Structure:**
- **Assets**:
  - Current Assets (1100 series)
  - Fixed Assets (1200 series)
  - Total Assets
- **Liabilities**:
  - Current Liabilities (2100 series)
  - Long-term Liabilities (2200 series)
  - Total Liabilities
- **Equity**:
  - Equity Accounts (3000 series)
  - Total Equity
- **Validation**: Total Assets = Total Liabilities + Total Equity

**Features:**
- Date selection (as of date)
- Account breakdown with amounts
- Percentage calculations
- Caching for performance

#### Income Statement (صورت سود و زیان)

**Purpose**: Shows financial performance over a period

**Structure:**
- **Revenue**:
  - Revenue accounts (4000 series)
  - Total Revenue
- **Expenses**:
  - Cost of Goods Sold (5100 series)
  - Operating Expenses (5200 series)
  - Total Expenses
- **Calculated Values**:
  - Gross Profit = Total Revenue - COGS
  - Net Income = Total Revenue - Total Expenses

**Features:**
- Date range selection
- Period-based calculations
- Percentage of revenue
- Caching for performance

#### Cash Flow Statement (صورت جریان وجه نقد)

**Purpose**: Shows cash movements over a period

**Structure:**
- **Operating Activities**:
  - Net Income
  - Adjustments (depreciation, etc.)
  - Net Cash from Operating
- **Investing Activities**:
  - Asset purchases/sales
  - Net Cash from Investing
- **Financing Activities**:
  - Loans, equity transactions
  - Net Cash from Financing
- **Summary**:
  - Net Cash Flow
  - Beginning Cash
  - Ending Cash

### 4. Trial Balance

**Purpose**: Verifies that debits equal credits for all accounts

**Features:**
- Date selection (as of date)
- All active accounts listed
- Debit and credit balances
- Account type grouping
- Balance validation indicator
- Search and filter functionality
- Export capability

**Validation:**
- Total Debits = Total Credits
- Zero-balance accounts filtered out
- Uses account normal balance for calculation

### 5. Financial Ratios

#### Liquidity Ratios (نسبت‌های نقدینگی)

**Current Ratio:**
- Formula: Current Assets / Current Liabilities
- Target: ≥ 2.0
- Indicates: Short-term solvency

**Quick Ratio:**
- Formula: (Current Assets - Inventory) / Current Liabilities
- Target: ≥ 1.0
- Indicates: Immediate liquidity

**Cash Ratio:**
- Formula: Cash & Equivalents / Current Liabilities
- Target: ≥ 0.5
- Indicates: Cash availability

#### Profitability Ratios (نسبت‌های سودآوری)

**Gross Profit Margin:**
- Formula: (Gross Profit / Revenue) × 100
- Target: ≥ 20%
- Indicates: Production efficiency

**Net Profit Margin:**
- Formula: (Net Income / Revenue) × 100
- Target: ≥ 10%
- Indicates: Overall profitability

**Return on Assets (ROA):**
- Formula: (Net Income / Total Assets) × 100
- Target: ≥ 5%
- Indicates: Asset utilization

**Return on Equity (ROE):**
- Formula: (Net Income / Total Equity) × 100
- Target: ≥ 15%
- Indicates: Shareholder return

#### Leverage Ratios (نسبت‌های اهرم مالی)

**Debt to Assets:**
- Formula: (Total Liabilities / Total Assets) × 100
- Target: ≤ 50%
- Indicates: Financial leverage

**Debt to Equity:**
- Formula: (Total Liabilities / Total Equity) × 100
- Target: ≤ 100%
- Indicates: Capital structure

**Equity Ratio:**
- Formula: (Total Equity / Total Assets) × 100
- Target: ≥ 50%
- Indicates: Financial stability

#### Activity Ratios (نسبت‌های فعالیت)

**Asset Turnover:**
- Formula: Revenue / Total Assets
- Target: ≥ 1.0
- Indicates: Asset efficiency

**Inventory Turnover:**
- Formula: COGS / Average Inventory
- Target: ≥ 4.0
- Indicates: Inventory management

**Receivables Turnover:**
- Formula: Revenue / Accounts Receivable
- Target: ≥ 6.0
- Indicates: Collection efficiency

### 6. Cost Centers

**Purpose**: Track costs by department, project, or location

**Features:**
- Hierarchical structure
- Budget allocation
- Manager assignment
- Cost tracking in journal entries
- Budget vs. actual reporting

### 7. Budget Management

**Purpose**: Plan and track financial performance

**Features:**
- Budget creation by fiscal year
- Account-level budgeting
- Cost center allocation
- Period-based budgets (monthly, quarterly, yearly)
- Actual vs. planned tracking
- Variance analysis
- Budget approval workflow

**Budget Status:**
- DRAFT: Being prepared
- APPROVED: Approved by management
- ACTIVE: Currently in use
- CLOSED: Period ended

### 8. Tax Configuration

**Purpose**: Manage tax settings for Iranian tax compliance

**Tax Types:**
- VAT (مالیات بر ارزش افزوده)
- Income Tax (مالیات بر درآمد)
- Withholding Tax (مالیات تکلیفی)
- Municipal Tax (مالیات شهرداری)

**Features:**
- Tax rate configuration
- Effective date ranges
- Tax account mapping
- Automatic tax calculation in journal entries

---

## Integration Features

### 1. Ordering & Sales System Integration

#### Automatic Journal Entry Generation

When an order is completed and paid, the system automatically generates journal entries:

**Service:** `OrderAccountingIntegrationService`

**Entry Structure for Sales:**

**Debit Side:**
- Cash/Bank/Accounts Receivable (based on payment method)
  - Account: 1101 (Cash) for CASH payments
  - Account: 1102 (Bank) for CARD payments
  - Account: 1103 (Accounts Receivable) for CREDIT payments
  - Amount: Total order amount

- COGS (Cost of Goods Sold)
  - Account: 5100 (COGS)
  - Amount: Total COGS calculated from recipe ingredients

**Credit Side:**
- Sales Revenue
  - Account: 4101 (Sales Revenue)
  - Amount: Order total minus tax

- Tax Payable (if applicable)
  - Account: 2102 (Tax Payable)
  - Amount: Tax amount (VAT, etc.)

- Inventory (for COGS entry)
  - Account: 1104 (Inventory)
  - Amount: Total COGS (reduces inventory value)

**Entry Metadata:**
- Source Type: `POS`
- Source ID: Order ID
- Description: `فروش - شماره سفارش: {orderNumber}`
- Reference: `SALE-{orderId}`

#### Recipe-Based COGS Calculation

**Process:**
1. System retrieves recipe for each menu item in order
2. For each ingredient in recipe:
   - Calculates required quantity = recipe quantity × order quantity
   - Retrieves current WAC (Weighted Average Cost) from inventory
   - Calculates ingredient cost = quantity × WAC
3. Sums all ingredient costs for total COGS
4. Creates journal entry lines for COGS and Inventory reduction

**Example:**
```
Order: 2x Pizza (each requires 200g flour, 100g cheese)
Recipe costs:
- Flour: 200g × 2 × 50 Toman/g = 20,000 Toman
- Cheese: 100g × 2 × 100 Toman/g = 20,000 Toman
Total COGS: 40,000 Toman

Journal Entry:
Debit:  COGS (5100)          40,000
Credit: Inventory (1104)      40,000
```

#### Refund Processing

When an order is refunded:

1. **Reverse Sales Entry:**
   - Creates reversal entry for original sales journal entry
   - Swaps all debits and credits
   - Links to refund via sourceId

2. **Payment Reversal:**
   - Reduces Cash/Bank/Accounts Receivable
   - Increases Sales Revenue (negative amount)
   - Reduces Tax Payable (if applicable)

3. **COGS Reversal:**
   - Reduces COGS (negative amount)
   - Increases Inventory (restores inventory value)

#### Tax Calculation

**Iranian Tax Support:**
- VAT (Value Added Tax) calculation
- Tax rates configurable per tenant
- Automatic tax account mapping
- Tax reporting for compliance

**Tax Calculation in Sales:**
- Tax amount = (Order total × Tax rate) / (1 + Tax rate)
- Net amount = Order total - Tax amount
- Tax recorded in Tax Payable account (2102)

### 2. Inventory Management Integration

#### Inventory Valuation

**Account Mapping:**
- Inventory account: 1104 (موجودی کالا)
- COGS account: 5100 (بهای تمام شده)

**Valuation Method:**
- Weighted Average Cost (WAC)
- Real-time cost updates
- Automatic journal entries for inventory movements

#### Inventory Transactions

**Purchase Transactions:**
- When inventory is added:
  - Debit: Inventory (1104)
  - Credit: Cash/Bank/Accounts Payable
  - Amount: Purchase cost (WAC)

**Sales Transactions:**
- When inventory is sold (via orders):
  - Debit: COGS (5100)
  - Credit: Inventory (1104)
  - Amount: COGS calculated from recipe

**Adjustment Transactions:**
- Inventory adjustments (losses, gains):
  - Debit/Credit: Inventory (1104)
  - Debit/Credit: Adjustment account
  - Amount: Adjustment value

### 3. Required Accounts Validation

**Service:** `ChartOfAccountsService.validateRequiredAccounts()`

**Required Accounts for Integration:**
- `1101`: Cash (صندوق) - For cash payments
- `1102`: Bank (بانک) - For card payments
- `1103`: Accounts Receivable (حساب‌های دریافتنی) - For credit sales
- `1104`: Inventory (موجودی کالا) - For inventory valuation
- `4101`: Sales Revenue (فروش کالا) - For sales recording
- `5100`: COGS (بهای تمام شده) - For cost tracking
- `2102`: Tax Payable (مالیات پرداختنی) - For tax compliance

**Validation Process:**
1. Checks if all required accounts exist
2. Verifies accounts are active
3. Returns list of missing accounts
4. Used during tenant setup and integration checks

### 4. Integration Points

#### Order Completion Hook

**Location:** `OrderService.createOrder()` or `OrderService.completeOrder()`

**Process:**
1. Order is marked as completed
2. Payment is processed
3. `OrderAccountingIntegrationService.generateRecipeOrderJournalEntry()` is called
4. Journal entry is created with DRAFT status
5. Entry is automatically POSTED
6. Account balances are updated

#### Inventory Movement Hook

**Location:** Inventory transaction processing

**Process:**
1. Inventory transaction is recorded
2. WAC is calculated
3. Journal entry is generated if needed
4. Inventory account balance is updated

### 5. Data Consistency

#### Transaction Safety

- All journal entry creation uses database transactions
- Ensures atomicity: all or nothing
- Prevents partial updates
- Maintains referential integrity

#### Audit Trail

- All automatic entries include:
  - Source type (POS, INVENTORY, etc.)
  - Source ID (order ID, transaction ID)
  - Reference number
  - Creation timestamp
  - Created by user

#### Error Handling

- If journal entry creation fails:
  - Order/inventory transaction is not committed
  - Error is logged
  - User is notified
  - System remains in consistent state

---

## API Endpoints

All endpoints are prefixed with `/api/accounting` and require JWT authentication.

### Chart of Accounts Endpoints

#### Initialize Chart of Accounts
```
POST /api/accounting/chart-of-accounts/initialize
```
**Description:** Initializes standard Iranian chart of accounts (45+ accounts)

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "message": "دفتر حساب‌های ایرانی با موفقیت راه‌اندازی شد",
  "messageEn": "Iranian Chart of Accounts initialized successfully"
}
```

#### Get Account Hierarchy
```
GET /api/accounting/chart-of-accounts/hierarchy?accountType={type}
```
**Description:** Returns hierarchical tree structure of accounts

**Query Parameters:**
- `accountType` (optional): ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "accountCode": "1000",
      "accountName": "دارایی‌ها",
      "accountType": "ASSET",
      "level": 1,
      "balance": 5000000,
      "children": [...]
    }
  ]
}
```

#### Create Account
```
POST /api/accounting/chart-of-accounts
```
**Request Body:**
```json
{
  "accountCode": "1101",
  "accountName": "صندوق",
  "accountNameEn": "Cash",
  "accountType": "ASSET",
  "normalBalance": "DEBIT",
  "parentAccountId": "optional-cuid",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "حساب جدید با موفقیت ایجاد شد",
  "data": { /* account object */ }
}
```

#### Update Account
```
PUT /api/accounting/chart-of-accounts/:id
```
**Request Body:** Same as create (all fields optional)

#### Get Account by ID
```
GET /api/accounting/chart-of-accounts/:id
```
**Response:** Account object with balance

#### Get Account Balance
```
GET /api/accounting/chart-of-accounts/:accountId/balance?asOfDate=2024-01-01
```
**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1500000
  }
}
```

#### Search Accounts
```
GET /api/accounting/chart-of-accounts/search?query=صندوق&accountType=ASSET
```
**Response:** Array of matching accounts

#### Validate Required Accounts
```
GET /api/accounting/chart-of-accounts/validate
```
**Response:**
```json
{
  "success": true,
  "data": {
    "requiredCodes": ["1101", "1102", "1103", "1104", "4101", "5100", "2102"],
    "missing": [
      { "code": "1101", "description": "Cash صندوق" }
    ],
    "present": ["1102", "1103", "4101"]
  }
}
```

### Journal Entries Endpoints

#### Create Journal Entry
```
POST /api/accounting/journal-entries
```
**Request Body:**
```json
{
  "entryDate": "2024-01-15",
  "description": "فروش کالا",
  "reference": "INV-001",
  "lines": [
    {
      "accountId": "cuid",
      "description": "دریافت نقدی",
      "debitAmount": 100000,
      "creditAmount": 0
    },
    {
      "accountId": "cuid",
      "description": "فروش",
      "debitAmount": 0,
      "creditAmount": 100000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "سند حسابداری با موفقیت ایجاد شد",
  "data": { /* journal entry object */ }
}
```

#### Get Journal Entries
```
GET /api/accounting/journal-entries?startDate=2024-01-01&endDate=2024-01-31&status=POSTED&page=1&limit=50
```
**Query Parameters:**
- `startDate` (optional): ISO8601 date
- `endDate` (optional): ISO8601 date
- `status` (optional): DRAFT, POSTED, REVERSED
- `sourceType` (optional): MANUAL, POS, INVENTORY, etc.
- `accountId` (optional): Filter by account
- `costCenterId` (optional): Filter by cost center
- `search` (optional): Search in description, entry number, reference
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [ /* array of journal entries */ ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

#### Get Journal Entry by ID
```
GET /api/accounting/journal-entries/:id
```
**Response:** Journal entry with all lines and related data

#### Post Journal Entry
```
PUT /api/accounting/journal-entries/:id/post
```
**Description:** Approves and posts a DRAFT entry

**Response:**
```json
{
  "success": true,
  "message": "سند حسابداری با موفقیت تصویب شد",
  "data": { /* updated journal entry */ }
}
```

#### Reverse Journal Entry
```
PUT /api/accounting/journal-entries/:id/reverse
```
**Request Body:**
```json
{
  "reversalReason": "خطا در ثبت"
}
```

**Response:** Creates reversal entry and marks original as REVERSED

#### Update Journal Entry
```
PUT /api/accounting/journal-entries/:id
```
**Description:** Updates a DRAFT entry (same body structure as create)

#### Delete Journal Entry
```
DELETE /api/accounting/journal-entries/:id
```
**Description:** Deletes a DRAFT entry

### Financial Statements Endpoints

#### Generate Balance Sheet
```
GET /api/accounting/financial-statements/balance-sheet?asOfDate=2024-01-31
```
**Response:**
```json
{
  "success": true,
  "data": {
    "assets": {
      "currentAssets": [ /* account balances */ ],
      "fixedAssets": [ /* account balances */ ],
      "totalAssets": 10000000
    },
    "liabilities": {
      "currentLiabilities": [ /* account balances */ ],
      "longTermLiabilities": [ /* account balances */ ],
      "totalLiabilities": 3000000
    },
    "equity": {
      "equityAccounts": [ /* account balances */ ],
      "totalEquity": 7000000
    },
    "totalLiabilitiesAndEquity": 10000000
  }
}
```

#### Generate Income Statement
```
GET /api/accounting/financial-statements/income-statement?startDate=2024-01-01&endDate=2024-01-31
```
**Query Parameters:**
- `startDate` (required): ISO8601 date
- `endDate` (required): ISO8601 date

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "revenueAccounts": [ /* account balances */ ],
      "totalRevenue": 5000000
    },
    "expenses": {
      "costOfGoodsSold": [ /* account balances */ ],
      "operatingExpenses": [ /* account balances */ ],
      "totalExpenses": 3000000
    },
    "grossProfit": 2000000,
    "netIncome": 2000000
  }
}
```

#### Generate Cash Flow Statement
```
GET /api/accounting/financial-statements/cash-flow?startDate=2024-01-01&endDate=2024-01-31
```
**Response:** Cash flow statement with operating, investing, and financing activities

#### Get Financial Ratios
```
GET /api/accounting/financial-statements/ratios?asOfDate=2024-01-31
```
**Response:**
```json
{
  "success": true,
  "data": {
    "liquidityRatios": {
      "currentRatio": 2.5,
      "quickRatio": 1.8,
      "cashRatio": 0.9
    },
    "profitabilityRatios": {
      "grossProfitMargin": 25.5,
      "netProfitMargin": 12.3,
      "returnOnAssets": 8.5,
      "returnOnEquity": 15.2
    },
    "leverageRatios": {
      "debtToAssets": 45.0,
      "debtToEquity": 82.0,
      "equityRatio": 55.0
    },
    "activityRatios": {
      "assetTurnover": 1.2,
      "inventoryTurnover": 4.5,
      "receivablesTurnover": 6.8
    }
  }
}
```

#### Get Comparative Statements
```
GET /api/accounting/financial-statements/comparative?currentPeriodEnd=2024-01-31&previousPeriodEnd=2023-01-31
```
**Response:** Comparative balance sheet and income statement with variances

### Trial Balance Endpoint

#### Get Trial Balance
```
GET /api/accounting/trial-balance?asOfDate=2024-01-31
```
**Response:**
```json
{
  "success": true,
  "data": {
    "asOfDate": "2024-01-31T00:00:00.000Z",
    "accounts": [
      {
        "accountId": "cuid",
        "accountCode": "1101",
        "accountName": "صندوق",
        "accountType": "ASSET",
        "debitBalance": 500000,
        "creditBalance": 0
      }
    ],
    "totalDebits": 10000000,
    "totalCredits": 10000000,
    "isBalanced": true
  }
}
```

### Dashboard Endpoints

#### Get Summary
```
GET /api/accounting/summary
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalAccounts": 45,
    "monthlyEntries": 120,
    "currentBalance": 5000000,
    "pendingEntries": 5,
    "recentEntries": [ /* recent journal entries */ ]
  }
}
```

#### Get Accounts Count
```
GET /api/accounting/accounts/count
```
**Response:**
```json
{
  "success": true,
  "data": {
    "count": 45
  }
}
```

#### Get Monthly Journal Entries Count
```
GET /api/accounting/journal-entries/monthly/count
```
**Response:**
```json
{
  "success": true,
  "data": {
    "count": 120
  }
}
```

#### Get Today's Balance
```
GET /api/accounting/balance/today
```
**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 500000,
    "totalDebit": 1000000,
    "totalCredit": 500000,
    "entriesCount": 15
  }
}
```

### Cost Centers Endpoint

#### Get Cost Centers
```
GET /api/accounting/cost-centers
```
**Response:** Array of cost centers

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "خطا در ایجاد حساب",
  "messageEn": "Error creating account",
  "error": "Account code already exists"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Business Logic

### Double-Entry Bookkeeping Rules

#### Fundamental Equation
```
Assets = Liabilities + Equity
```

#### Account Type Rules

**ASSET Accounts:**
- Normal Balance: DEBIT
- Increases: DEBIT
- Decreases: CREDIT
- Examples: Cash, Bank, Inventory, Accounts Receivable

**LIABILITY Accounts:**
- Normal Balance: CREDIT
- Increases: CREDIT
- Decreases: DEBIT
- Examples: Accounts Payable, Tax Payable, Loans

**EQUITY Accounts:**
- Normal Balance: CREDIT
- Increases: CREDIT
- Decreases: DEBIT
- Examples: Capital, Retained Earnings

**REVENUE Accounts:**
- Normal Balance: CREDIT
- Increases: CREDIT
- Decreases: DEBIT
- Examples: Sales Revenue, Service Revenue

**EXPENSE Accounts:**
- Normal Balance: DEBIT
- Increases: DEBIT
- Decreases: CREDIT
- Examples: COGS, Operating Expenses

### Balance Calculation Logic

#### Account Balance Formula

For **DEBIT** normal balance accounts:
```typescript
balance = totalDebits - totalCredits
```

For **CREDIT** normal balance accounts:
```typescript
balance = totalCredits - totalDebits
```

#### Balance Aggregation

Parent account balances are calculated by summing child account balances:
```typescript
parentBalance = sum(childBalances)
```

### Entry Number Generation

#### Persian Calendar Conversion

```typescript
const currentYear = new Date().getFullYear();
const shamsiYear = currentYear - 621; // Convert Gregorian to Shamsi
```

#### Entry Number Format

```
{ShamsiYear}-{6-digit-sequence}
```

**Example:**
- First entry of year 1403: `1403-000001`
- Second entry: `1403-000002`
- Next year: `1404-000001`

#### Uniqueness Guarantee

- Database unique constraint on `entryNumber`
- Thread-safe via database query
- Auto-incrementing sequence per year

### Journal Entry Workflow

#### Creation Flow

1. **Validate Input:**
   - Entry date is valid
   - Description is not empty
   - At least 2 lines provided
   - All accounts exist and are active

2. **Validate Double-Entry:**
   - Total debits = Total credits
   - Each line has either debit OR credit (not both)
   - No line has zero amounts

3. **Generate Entry Number:**
   - Get current Shamsi year
   - Find last entry for year
   - Increment sequence

4. **Create Entry:**
   - Create journal entry with DRAFT status
   - Create all journal entry lines
   - Calculate and store totals
   - Use database transaction

5. **Return Result:**
   - Return created entry with lines
   - Include entry number

#### Posting Flow

1. **Validate Entry:**
   - Entry exists
   - Status is DRAFT
   - Re-validate double-entry balance

2. **Update Status:**
   - Change status to POSTED
   - Record approver and timestamp
   - Update account balances (implicitly via queries)

3. **Return Result:**
   - Return updated entry

#### Reversal Flow

1. **Validate Entry:**
   - Entry exists
   - Status is POSTED
   - Reversal reason provided

2. **Mark Original:**
   - Set status to REVERSED
   - Record reverser and timestamp
   - Store reversal reason

3. **Create Reversal Entry:**
   - Swap all debits and credits
   - Prefix description with "ابطال:"
   - Set reference to `REV-{originalNumber}`
   - Create as DRAFT, then auto-post

4. **Return Result:**
   - Return reversal entry

### Financial Statement Generation

#### Balance Sheet Logic

1. **Get All Accounts:**
   - Filter by account type (ASSET, LIABILITY, EQUITY)
   - Only active accounts
   - Calculate balances as of date

2. **Categorize:**
   - Assets: 1100 series = Current, 1200 series = Fixed
   - Liabilities: 2100 series = Current, 2200 series = Long-term
   - Equity: 3000 series

3. **Calculate Totals:**
   - Sum each category
   - Calculate percentages
   - Validate: Assets = Liabilities + Equity

4. **Cache Result:**
   - Store in FinancialStatement table
   - Key: statementType + fiscalYear + period

#### Income Statement Logic

1. **Get Period Accounts:**
   - Revenue accounts (4000 series) for period
   - Expense accounts (5000 series) for period
   - Calculate period activity (not balance)

2. **Categorize Expenses:**
   - 5100 series = COGS
   - 5200 series = Operating Expenses

3. **Calculate:**
   - Total Revenue
   - Total COGS
   - Gross Profit = Revenue - COGS
   - Total Operating Expenses
   - Net Income = Revenue - Total Expenses

4. **Cache Result:**
   - Store with period dates

### Trial Balance Logic

1. **Get All Active Accounts:**
   - Query all accounts with `isActive = true`
   - Order by account code

2. **Calculate Balances:**
   - For each account:
     - Sum debits from POSTED entries
     - Sum credits from POSTED entries
     - Calculate balance based on normal balance type
     - Determine debit/credit balance columns

3. **Filter Zero Balances:**
   - Remove accounts with zero balance
   - Keep only accounts with activity

4. **Validate:**
   - Sum all debit balances
   - Sum all credit balances
   - Check if equal (within 0.01 tolerance)

### Financial Ratios Calculation

#### Liquidity Ratios

```typescript
currentRatio = currentAssets / currentLiabilities
quickRatio = (currentAssets - inventory) / currentLiabilities
cashRatio = cashAndEquivalents / currentLiabilities
```

#### Profitability Ratios

```typescript
grossProfitMargin = (grossProfit / totalRevenue) * 100
netProfitMargin = (netIncome / totalRevenue) * 100
returnOnAssets = (netIncome / totalAssets) * 100
returnOnEquity = (netIncome / totalEquity) * 100
```

#### Leverage Ratios

```typescript
debtToAssets = (totalLiabilities / totalAssets) * 100
debtToEquity = (totalLiabilities / totalEquity) * 100
equityRatio = (totalEquity / totalAssets) * 100
```

#### Activity Ratios

```typescript
assetTurnover = totalRevenue / totalAssets
inventoryTurnover = totalCOGS / averageInventory
receivablesTurnover = totalRevenue / accountsReceivable
```

### Multi-Tenant Isolation

#### Tenant Context

All queries include tenant filtering:
```typescript
where: {
  tenantId: req.tenant.id,
  // ... other filters
}
```

#### Data Isolation

- Accounts: Unique per tenant (accountCode + tenantId)
- Journal Entries: Filtered by tenant
- Financial Statements: Tenant-specific
- No cross-tenant data access

### Validation Rules

#### Account Validation

- Account code: Required, max 20 chars, unique per tenant
- Account name: Required, max 255 chars
- Account type: Must be valid enum value
- Normal balance: Must match account type rules
- Parent account: Must exist and be in same tenant

#### Journal Entry Validation

- Entry date: Required, valid date
- Description: Required, max 1000 chars
- Reference: Optional, max 100 chars
- Lines: Minimum 2, maximum unlimited
- Each line:
  - Account ID: Required, valid CUID
  - Description: Optional, max 500 chars
  - Debit OR Credit: One must be > 0, not both
  - Amounts: Non-negative numbers
- Total validation: Debits must equal credits

### Error Handling

#### Validation Errors

- Return 400 Bad Request
- Include field-level error messages
- Persian and English messages

#### Business Logic Errors

- Account code already exists
- Account has transactions (cannot modify)
- Entry not in correct status for operation
- Double-entry balance mismatch
- Account not found

#### System Errors

- Database connection errors
- Transaction failures
- Return 500 Internal Server Error
- Log error details
- Return user-friendly message

---

## User Roles and Permissions

### Role-Based Access Control

The accounting system uses implicit RBAC based on user roles in the authentication system.

#### Admin Role

**Full Access:**
- Initialize chart of accounts
- Create, update, delete accounts
- Create, edit, delete journal entries
- Post and reverse journal entries
- Generate all financial statements
- View all reports
- Manage cost centers and budgets
- Configure tax settings

#### Manager Role

**Management Access:**
- View all accounts and entries
- Create and edit journal entries
- Post journal entries (approve)
- Reverse journal entries (with reason)
- Generate financial statements
- View all reports
- Cannot delete accounts or entries

#### Accountant Role

**Accounting Access:**
- View accounts and entries
- Create journal entries
- Edit DRAFT entries
- Cannot post or reverse entries
- View financial statements
- View reports
- Cannot delete anything

#### Staff Role

**Limited Access:**
- View accounts (read-only)
- View posted journal entries (read-only)
- View financial statements (read-only)
- Cannot create, edit, or delete anything

### Permission Matrix

| Feature | Admin | Manager | Accountant | Staff |
|---------|-------|---------|-----------|-------|
| Initialize COA | ✅ | ❌ | ❌ | ❌ |
| Create Account | ✅ | ✅ | ❌ | ❌ |
| Update Account | ✅ | ✅ | ❌ | ❌ |
| Delete Account | ✅ | ❌ | ❌ | ❌ |
| Create Journal Entry | ✅ | ✅ | ✅ | ❌ |
| Edit Journal Entry | ✅ | ✅ | ✅ | ❌ |
| Post Journal Entry | ✅ | ✅ | ❌ | ❌ |
| Reverse Journal Entry | ✅ | ✅ | ❌ | ❌ |
| Delete Journal Entry | ✅ | ❌ | ❌ | ❌ |
| View Financial Statements | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ✅ | ✅ | ✅ | ❌ |
| Manage Budgets | ✅ | ✅ | ❌ | ❌ |
| Configure Tax | ✅ | ❌ | ❌ | ❌ |

### Audit Trail

All operations record:
- **Created By**: User who created the record
- **Approved By**: User who approved/posted (if applicable)
- **Reversed By**: User who reversed (if applicable)
- **Timestamps**: Created at, updated at, approved at, reversed at

### Security Features

- **JWT Authentication**: Required for all endpoints
- **Tenant Isolation**: Users can only access their tenant's data
- **Input Validation**: All inputs validated server-side
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based validation

---

## Testing

### Unit Testing

#### Service Layer Tests

**ChartOfAccountsService Tests:**
- Account creation with valid data
- Account creation with duplicate code (should fail)
- Account hierarchy building
- Balance calculation for DEBIT accounts
- Balance calculation for CREDIT accounts
- Account search functionality
- Required accounts validation

**JournalEntryService Tests:**
- Entry creation with balanced debits/credits
- Entry creation with unbalanced amounts (should fail)
- Entry number generation
- Entry posting workflow
- Entry reversal workflow
- Trial balance calculation

**FinancialStatementsService Tests:**
- Balance sheet generation
- Income statement generation
- Cash flow statement generation
- Financial ratios calculation
- Comparative statements

### Integration Testing

#### API Endpoint Tests

**Chart of Accounts Endpoints:**
- POST /chart-of-accounts/initialize
- GET /chart-of-accounts/hierarchy
- POST /chart-of-accounts (create)
- PUT /chart-of-accounts/:id (update)
- GET /chart-of-accounts/:id/balance

**Journal Entries Endpoints:**
- POST /journal-entries (create)
- GET /journal-entries (list with filters)
- PUT /journal-entries/:id/post (post)
- PUT /journal-entries/:id/reverse (reverse)
- PUT /journal-entries/:id (update)
- DELETE /journal-entries/:id (delete)

**Financial Statements Endpoints:**
- GET /financial-statements/balance-sheet
- GET /financial-statements/income-statement
- GET /financial-statements/cash-flow
- GET /financial-statements/ratios

#### Database Transaction Tests

- Test atomicity of journal entry creation
- Test rollback on validation failure
- Test concurrent entry number generation
- Test tenant isolation

### End-to-End Testing

#### Complete Workflows

1. **Account Setup Workflow:**
   - Initialize chart of accounts
   - Verify all accounts created
   - Create custom account
   - Verify hierarchy

2. **Journal Entry Workflow:**
   - Create DRAFT entry
   - Verify balance validation
   - Post entry
   - Verify account balances updated
   - Reverse entry
   - Verify reversal entry created

3. **Financial Statement Workflow:**
   - Create multiple journal entries
   - Generate balance sheet
   - Verify totals balance
   - Generate income statement
   - Verify calculations

4. **Integration Workflow:**
   - Complete order in POS
   - Verify journal entry created
   - Verify COGS calculated correctly
   - Verify inventory account updated

### Test Data

#### Sample Accounts

- Cash (1101): Starting balance 1,000,000
- Bank (1102): Starting balance 5,000,000
- Sales Revenue (4101): Starting balance 0
- COGS (5100): Starting balance 0

#### Sample Journal Entries

**Sales Entry:**
- Debit: Cash (1101) - 100,000
- Credit: Sales Revenue (4101) - 100,000

**Purchase Entry:**
- Debit: Inventory (1104) - 50,000
- Credit: Cash (1101) - 50,000

### Performance Testing

#### Load Testing

- Test with 1000+ accounts
- Test with 10,000+ journal entries
- Test balance calculation performance
- Test financial statement generation time

#### Optimization

- Database indexes on frequently queried fields
- Caching of financial statements
- Parallel balance calculations
- Pagination for large datasets

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Main user workflows
- **Performance Tests**: Response time < 2s for statements

---

## Conclusion

The Accounting System workspace provides a comprehensive, production-ready financial management solution for Iranian businesses. It implements industry-standard double-entry bookkeeping, supports Persian calendar-based operations, and seamlessly integrates with the Ordering & Sales and Inventory Management systems.

### Key Strengths

- **Complete Feature Set**: Chart of accounts, journal entries, financial statements, ratios, budgets
- **Iranian Standards**: Pre-configured accounts, Persian calendar, tax compliance
- **Integration Ready**: Automatic journal entry generation from business transactions
- **Multi-Tenant**: Complete data isolation and security
- **Scalable**: Efficient database design with proper indexing
- **User-Friendly**: Persian interface with responsive design

### Future Enhancements

Potential areas for future development:
- Bank reconciliation
- Accounts payable/receivable aging reports
- Fixed asset depreciation automation
- Multi-currency support
- Advanced budgeting features
- Financial forecasting
- Export to accounting software (QuickBooks, etc.)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** Servaan Development Team

