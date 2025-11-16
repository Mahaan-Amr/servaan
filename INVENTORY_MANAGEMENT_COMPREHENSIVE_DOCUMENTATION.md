# Inventory Management Workspace - Comprehensive Documentation

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

The Inventory Management workspace is a comprehensive system for tracking inventory items, managing stock levels, recording transactions (IN/OUT), managing suppliers, and integrating with the ordering system for recipe-based stock management. The system uses **Weighted Average Cost (WAC)** for inventory valuation and supports multi-tenant architecture.

### Key Capabilities
- **Stock Management**: Track inventory levels, transactions, and movements
- **Item Management**: CRUD operations for inventory items with categories, units, barcodes
- **Supplier Management**: Manage supplier relationships and pricing
- **Barcode/QR Scanner**: Quick item identification and transaction processing
- **Low Stock Alerts**: Automatic notifications when items fall below thresholds
- **Recipe Integration**: Automatic stock deduction based on menu item recipes
- **Stock Overrides**: Record and analyze instances where orders proceed despite stock deficits
- **Reporting**: Comprehensive reports on inventory status, movements, and valuation
- **Price Management**: Track prices, validate consistency with recipes, and manage cost calculations

---

## System Architecture

### Technology Stack
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Authentication**: JWT tokens with role-based access control
- **Database**: PostgreSQL with Prisma schema

### Architecture Pattern
- **Layered Architecture**: Routes → Controllers → Services → Database
- **Multi-tenant**: All data is isolated by `tenantId`
- **RESTful API**: Standard HTTP methods for CRUD operations
- **Service Layer**: Business logic separated from HTTP handling

---

## Database Schema

### Core Models

#### `Item`
Represents an inventory item/product.

```prisma
model Item {
  id          String   @id @default(cuid())
  name        String
  category    String
  unit        String
  description String?
  barcode     String?
  minStock    Float    @default(0)
  isActive    Boolean  @default(true)
  image       String?
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  inventoryEntries InventoryEntry[]
  itemSuppliers     ItemSupplier[]
  scanHistory       ScanHistory[]
  stockOverrides    StockOverride[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Key Fields:**
- `minStock`: Minimum stock threshold for low stock alerts
- `barcode`: Optional barcode/QR code for scanning
- `isActive`: Soft delete flag

#### `InventoryEntry`
Represents a stock transaction (IN or OUT).

```prisma
model InventoryEntry {
  id          String            @id @default(cuid())
  itemId      String
  item        Item              @relation(fields: [itemId], references: [id])
  quantity    Float
  type        InventoryEntryType
  unitPrice   Float?
  batchNumber String?
  expiryDate  DateTime?
  note        String?
  userId      String
  user        User              @relation(fields: [userId], references: [id])
  tenantId   String
  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

**Transaction Types:**
- `IN`: Stock addition (positive quantity)
- `OUT`: Stock removal (negative quantity)

**Key Features:**
- `unitPrice`: Required for IN transactions (used in WAC calculation)
- `batchNumber`: Optional batch tracking
- `expiryDate`: Optional expiry date (must be in future)
- `note`: Optional transaction notes

#### `Supplier`
Represents a supplier/vendor.

```prisma
model Supplier {
  id          String   @id @default(cuid())
  name        String
  contactName String?
  email       String?
  phoneNumber String?
  address     String?
  notes       String?
  isActive    Boolean  @default(true)
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  itemSuppliers ItemSupplier[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### `ItemSupplier`
Many-to-many relationship between Items and Suppliers with additional metadata.

```prisma
model ItemSupplier {
  id               String   @id @default(cuid())
  itemId           String
  item             Item     @relation(fields: [itemId], references: [id])
  supplierId       String
  supplier         Supplier @relation(fields: [supplierId], references: [id])
  preferredSupplier Boolean  @default(false)
  unitPrice        Float?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Key Features:**
- `preferredSupplier`: Flags the primary supplier for an item
- `unitPrice`: Supplier-specific pricing

#### `ScanHistory`
Records barcode/QR code scans.

```prisma
model ScanHistory {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  code      String
  format    BarcodeFormat
  scanMode  ScanMode
  itemFound Boolean     @default(false)
  itemId    String?
  item      Item?       @relation(fields: [itemId], references: [id])
  tenantId  String
  tenant    Tenant      @relation(fields: [tenantId], references: [id])
  createdAt DateTime    @default(now())
}
```

**Supported Formats:**
- `EAN_13`, `EAN_8`, `CODE_128`, `CODE_39`, `QR_CODE`, etc.

#### `StockOverride`
Records instances where stock warnings are overridden.

```prisma
model StockOverride {
  id            String       @id @default(cuid())
  orderId      String
  menuItemId   String
  itemId       String
  item         Item         @relation(fields: [itemId], references: [id])
  itemName     String
  requiredQuantity Float
  availableQuantity Float
  overrideReason String
  overrideType OverrideType
  overriddenBy String
  notes        String?
  tenantId     String
  tenant       Tenant      @relation(fields: [tenantId], references: [id])
  createdAt    DateTime    @default(now())
}
```

**Override Types:**
- `STAFF_DECISION`: Staff decision to proceed
- `EMERGENCY_PURCHASE`: Emergency purchase made
- `SUBSTITUTE_INGREDIENT`: Ingredient substitution
- `VIP_CUSTOMER`: VIP customer exception

---

## Backend Implementation

### File Structure

```
src/backend/
├── routes/
│   ├── inventoryRoutes.ts          # Main inventory API routes
│   └── stockValidationRoutes.ts    # Stock validation & override routes
├── controllers/
│   ├── inventoryController.ts      # Inventory request handlers
│   └── stockValidationController.ts # Stock validation handlers
├── services/
│   ├── inventoryService.ts         # Core inventory business logic
│   └── orderInventoryIntegrationService.ts # Order-inventory integration
└── tests/
    ├── unit/inventory.test.ts      # Unit tests
    └── integration/inventory.routes.test.ts # Integration tests
```

### Core Services

#### `inventoryService.ts`

**Key Functions:**

1. **`calculateCurrentStock(itemId, tenantId, startDate?, endDate?)`**
   - Calculates current stock by summing all IN/OUT transactions
   - Supports optional date range filtering
   - Returns: `number` (can be negative for deficits)

2. **`getStockDeficits(tenantId)`**
   - Returns items with negative stock
   - Returns: `Array<{itemId, itemName, currentStock, deficit}>`

3. **`getDeficitSummary(tenantId)`**
   - Provides summary statistics for stock deficits
   - Returns: `{totalDeficits, totalDeficitValue, itemsWithDeficits}`

4. **`getStockMovements(itemId, filter, tenantId)`**
   - Fetches paginated stock movements
   - Supports filtering by date range, type, pagination
   - Returns: `{entries, pagination}`

5. **`validateStockEntry(entry)`**
   - Validates inventory entry data
   - Checks: quantity sign, unitPrice requirement, expiry date
   - Returns: `{isValid, errors[]}`

6. **`isLowStock(itemId, tenantId)`**
   - Checks if item stock is below minimum threshold
   - Returns: `boolean`

7. **`calculateWeightedAverageCost(itemId, tenantId)`**
   - Calculates WAC: `Σ(quantity × unitPrice) / Σ(quantity)` for all IN transactions
   - Only considers IN transactions with unitPrice
   - Returns: `number` (price in rials)

8. **`calculateInventoryValuation(tenantId)`**
   - Calculates total inventory value using WAC
   - Returns: `{totalValue, items: [{itemId, currentStock, averageCost, totalValue}]}`

9. **`canDeleteInventoryEntry(entryId, userId, userRole)`**
   - Checks deletion permissions based on:
     - Role (ADMIN/MANAGER can delete, STAFF can only delete own recent entries)
     - Entry age (entries older than 7 days cannot be deleted)
   - Returns: `{allowed, reason?}`

10. **`adjustStock(itemId, newQuantity, reason, userId, tenantId)`**
    - Creates an adjustment entry to bring stock to a specific quantity
    - Calculates difference and creates appropriate IN/OUT entry
    - Returns: Created inventory entry

11. **`checkStockAvailability(itemId, requestedQuantity, tenantId)`**
    - Checks if sufficient stock is available
    - Returns: `boolean`

12. **`getInventoryPrice(itemId, tenantId)`**
    - Retrieves current WAC and price history
    - Returns: `{currentPrice, priceHistory, lastUpdated}`

13. **`validatePriceConsistency(tenantId)`**
    - Compares inventory WAC with recipe ingredient costs
    - Finds inconsistencies (threshold: 5% difference)
    - Returns: `Array<{itemId, itemName, inventoryPrice, recipePrice, difference, percentage}>`

14. **`getPriceStatistics(tenantId)`**
    - Provides price-related statistics
    - Returns: `{totalItems, itemsWithPrices, averagePrice, minPrice, maxPrice, recentPriceChanges}`

#### `orderInventoryIntegrationService.ts`

**Key Functions:**

1. **`validateRecipeStockAvailability(tenantId, menuItemId, orderQuantity)`**
   - Basic stock validation for recipe ingredients
   - Allows orders to proceed even with deficits (flexible validation)
   - Returns: `{isAvailable, deficits: [{itemId, itemName, required, available, deficit}]}`

2. **`validateFlexibleStockAvailability(tenantId, menuItemId, orderQuantity)`**
   - Advanced stock validation with warnings and suggestions
   - Warning levels: `LOW`, `CRITICAL`, `OUT_OF_STOCK`
   - Returns: `{isAvailable, warnings[], suggestedActions[], canOverride}`

3. **`recordStockOverride(...)`**
   - Records stock override events with full details
   - Returns: Created `StockOverride` record

4. **`getStockOverrideAnalytics(tenantId, startDate?, endDate?)`**
   - Provides analytics on stock override events
   - Returns: `{totalOverrides, byType, byMenuItem, byItem, trends}`

5. **`processRecipeStockDeduction(tenantId, orderId, userId)`**
   - Deducts inventory for recipe ingredients when order is completed
   - Creates OUT transactions for each ingredient
   - Returns: `Array<RecipeBasedStockDeduction>`

6. **`updateMenuItemAvailability(tenantId)`**
   - Automatically updates menu item availability based on ingredient stock
   - Sets menu item to unavailable if any ingredient is out of stock
   - Returns: `{updated, unavailableItems, lowStockItems}`

7. **`getRecipeIngredientLowStockAlerts(tenantId)`**
   - Retrieves low stock alerts for recipe ingredients
   - Prioritized by usage frequency
   - Returns: `{criticalIngredients: [{itemId, itemName, currentStock, minStock, usageFrequency}]}`

8. **`updateRecipeCosts(tenantId)`**
   - Recalculates recipe costs based on current ingredient WAC
   - Updates menu item prices if configured
   - Returns: `{updated, costChanges: [{menuItemId, oldCost, newCost, difference}]}`

9. **`getInventoryIntegrationStatus(tenantId)`**
   - Comprehensive status report on inventory-menu integration
   - Returns: `{totalMenuItems, itemsWithRecipes, availableItems, unavailableItems, lowStockIngredients, integrationHealth}`

### API Routes

#### `inventoryRoutes.ts`

**Main Endpoints:**

- `GET /api/inventory/` - Get paginated inventory entries
- `GET /api/inventory/current` - Get current stock status for all items
- `GET /api/inventory/low-stock` - Get items with low stock
- `GET /api/inventory/low-stock/count` - Get count of low stock items
- `GET /api/inventory/report` - Generate inventory movement report
- `GET /api/inventory/price-consistency` - Validate price consistency
- `GET /api/inventory/price-statistics` - Get price statistics
- `GET /api/inventory/items/:id/price` - Get item price
- `GET /api/inventory/total-quantity` - Get total inventory quantity
- `GET /api/inventory/total-value` - Get total inventory value (WAC)
- `GET /api/inventory/low-stock-alerts` - Get recipe ingredient low stock alerts
- `GET /api/inventory/integration-status` - Get integration status
- `GET /api/inventory/:id` - Get single inventory entry
- `POST /api/inventory/` - Create inventory entry
- `PUT /api/inventory/:id` - Update inventory entry
- `DELETE /api/inventory/:id` - Delete inventory entry
- `PATCH /api/inventory/:itemId/barcode` - Update item barcode
- `GET /api/inventory/today/count` - Get today's transaction count
- `GET /api/inventory/deficits` - Get stock deficits
- `GET /api/inventory/deficits/summary` - Get deficit summary
- `POST /api/inventory/update-menu-availability` - Update menu availability
- `POST /api/inventory/update-recipe-costs` - Update recipe costs

#### `stockValidationRoutes.ts`

**Stock Validation Endpoints:**

- `GET /api/inventory/stock-validation/:menuItemId` - Flexible stock validation
- `POST /api/inventory/validate-order-stock` - Validate multiple order items
- `POST /api/inventory/stock-override` - Record stock override
- `GET /api/inventory/stock-override-analytics` - Get override analytics
- `GET /api/inventory/stock-validation-config` - Get validation configuration

---

## Frontend Implementation

### File Structure

```
src/frontend/
├── app/workspaces/inventory-management/
│   ├── layout.tsx                    # Workspace layout with sidebar
│   ├── page.tsx                      # Dashboard
│   ├── items/
│   │   └── page.tsx                  # Items management page
│   ├── inventory/
│   │   ├── page.tsx                  # Current inventory view
│   │   ├── add/
│   │   │   └── page.tsx              # Add inventory entry (IN)
│   │   ├── remove/
│   │   │   └── page.tsx              # Remove inventory entry (OUT)
│   │   ├── transactions/
│   │   │   └── page.tsx              # Transaction history
│   │   └── reports/
│   │       └── page.tsx              # Inventory reports
│   ├── suppliers/
│   │   └── page.tsx                  # Suppliers management
│   └── scanner/
│       └── page.tsx                  # Barcode/QR scanner
├── components/inventory/
│   ├── LowStockAlerts.tsx            # Low stock alerts component
│   ├── InventoryReport.tsx          # Report component
│   └── InventoryPriceManager.tsx     # Price management component
└── services/
    ├── inventoryService.ts            # Frontend inventory API client
    ├── itemService.ts                 # Frontend item API client
    └── supplierService.ts             # Frontend supplier API client
```

### Pages

#### Dashboard (`page.tsx`)
**Location:** `/workspaces/inventory-management`

**Features:**
- Displays key statistics:
  - Total Items
  - Total Inventory Quantity
  - Low Stock Items
  - Total Inventory Value
- Quick action links:
  - Add Inventory Entry
  - Remove Inventory Entry
  - Add New Item
  - Barcode Scanner
- Recent activities list (last 5 transactions)
- Low Stock Alerts component
- Inventory Price Manager component

**Data Sources:**
- `inventoryService.getInventoryStats()`
- `inventoryService.getRecentActivities()`

#### Items Management (`items/page.tsx`)
**Location:** `/workspaces/inventory-management/items`

**Features:**
- List all items with:
  - Current stock
  - Minimum stock
  - Stock status (Good/Low/Out)
- Search by item name or barcode
- Filter by category and stock status
- Statistics:
  - Total Items
  - In Stock
  - Low Stock
  - Out of Stock
- CRUD operations (Add, View, Edit, Delete)
- Role-based access control

**Data Sources:**
- `itemService.getItems()`
- `inventoryService.getCurrentInventory()`

#### Current Inventory (`inventory/page.tsx`)
**Location:** `/workspaces/inventory-management/inventory`

**Features:**
- Overview statistics:
  - Total Items
  - Total Stock
  - Low Stock Count
- Recent transactions list
- Detailed inventory list with:
  - Item name and category
  - Current stock
  - Stock status (Low/Medium/Available)
- Quick action links:
  - Inventory Transactions
  - Add Inventory Entry
  - Remove Inventory Entry
  - Barcode Scanner
  - Inventory Reports

**Data Sources:**
- `inventoryService.getCurrentInventory()`
- `inventoryService.getInventoryEntries()`
- `inventoryService.getLowStockItems()`

#### Add Inventory Entry (`inventory/add/page.tsx`)
**Location:** `/workspaces/inventory-management/inventory/add`

**Features:**
- Form to create IN transaction:
  - Item selection (dropdown)
  - Quantity (required, > 0)
  - Unit price (optional, in rials)
  - Batch number (optional)
  - Expiry date (optional, must be future)
  - Notes (optional)
- Shows selected item details (unit, description)
- Calculates total value (quantity × unit price)
- Supports return URL for navigation flow
- Validation:
  - Item selection required
  - Quantity must be positive
  - Expiry date must be in future

**Data Sources:**
- `itemService.getItems()` (filtered to active items)
- `inventoryService.createInventoryEntry()`

#### Remove Inventory Entry (`inventory/remove/page.tsx`)
**Location:** `/workspaces/inventory-management/inventory/remove`

**Features:**
- Similar to Add page but for OUT transactions
- Quantity is negative (system handles sign)
- No unit price required for OUT
- Stock availability validation

#### Transactions (`inventory/transactions/page.tsx`)
**Location:** `/workspaces/inventory-management/inventory/transactions`

**Features:**
- List all inventory transactions
- Filters:
  - Type (ALL/IN/OUT)
  - Date range (start/end date)
- Sorting by:
  - Date (createdAt)
  - Quantity
  - Item name
  - Type
- Displays:
  - Item name and category
  - Transaction type (IN/OUT) with color coding
  - Quantity and unit
  - User who created transaction
  - Date and time
  - Notes
- Quick actions:
  - Add Inventory Entry
  - Remove Inventory Entry

**Data Sources:**
- `inventoryService.getInventoryEntries()`

#### Reports (`inventory/reports/page.tsx`)
**Location:** `/workspaces/inventory-management/inventory/reports`

**Features:**
- Summary cards:
  - Total Items
  - Total Value (with pricing status)
  - Low Stock Items
  - Out of Stock Items
- Filters:
  - Search by item name or category
  - Filter by category
  - Filter by stock status (ALL/IN_STOCK/LOW_STOCK/OUT_OF_STOCK)
- Inventory table with:
  - Item name and category
  - Current stock
  - Total IN
  - Total OUT
  - Stock status
- Export options:
  - PDF export
  - Excel export
  - CSV export
- Transaction history section (collapsible):
  - Transaction summary cards
  - Advanced filters (type, date range, item, user)
  - Detailed transaction table
- Supplier performance section (collapsible):
  - Supplier metrics
  - Performance table with:
    - Supplier name
    - Total items
    - Preferred supplier count
    - Average price
    - Recent transactions (30 days)
    - Status badges

**Data Sources:**
- `inventoryService.getCurrentInventory()`
- `inventoryService.getInventoryEntries()`
- `itemService.getItemsWithSuppliers()`
- `inventoryService.getLowStockItems()`

#### Suppliers (`suppliers/page.tsx`)
**Location:** `/workspaces/inventory-management/suppliers`

**Features:**
- List all suppliers with:
  - Name and contact information
  - Active status
  - Associated items count
- Statistics:
  - Total Suppliers
  - Active
  - Inactive
- CRUD operations:
  - Add supplier
  - View supplier details
  - Edit supplier
  - Delete supplier (role-based)
- Role-based access control

**Data Sources:**
- `supplierService.getSuppliers()`

#### Scanner (`scanner/page.tsx`)
**Location:** `/workspaces/inventory-management/scanner`

**Features:**
- Barcode/QR code scanner interface
- Uses `UniversalScanner` component
- Scan history display
- Item lookup:
  - Searches local database by barcode
  - Fuzzy matching for similar items if exact match not found
  - Edit distance calculation for suggestions
- Item details display:
  - Item name and category
  - Current stock
  - Unit
  - Minimum stock
- Quick actions:
  - Add Inventory Entry (IN) with preset quantity
  - Remove Inventory Entry (OUT) with preset quantity
  - Pre-filled notes from scan

**Fuzzy Matching:**
- `getEditDistance(str1, str2)`: Calculates Levenshtein distance
- `calculateSimilarity(str1, str2)`: Calculates similarity percentage
- `suggestSimilarItems(code, items)`: Finds similar items when exact match fails

**Data Sources:**
- `itemService.getItems()`
- `inventoryService.getCurrentInventory()`
- `inventoryService.createInventoryEntry()`

### Components

#### `LowStockAlerts.tsx`
**Location:** `components/inventory/LowStockAlerts.tsx`

**Features:**
- Displays list of items with low stock
- Shows:
  - Item name
  - Category
  - Current stock
  - Minimum stock threshold
- Quick link to add stock
- Supports limiting number of displayed alerts
- Auto-refreshes on data changes

**Data Sources:**
- `inventoryService.getLowStockItems()`

#### `InventoryReport.tsx`
**Location:** `components/inventory/InventoryReport.tsx`

**Features:**
- Inventory movement report generator
- Filters:
  - Date range (start/end date)
  - Specific item
  - Transaction type (IN/OUT/ALL)
- Summary:
  - Total entries
  - Total IN
  - Total OUT
- Per-item summary:
  - Total IN per item
  - Total OUT per item
  - Net change
- Individual transactions list:
  - Item name
  - Type
  - Quantity
  - User
  - Date

**Data Sources:**
- `GET /api/inventory/report`

#### `InventoryPriceManager.tsx`
**Location:** `components/inventory/InventoryPriceManager.tsx`

**Features:**
- Tabbed interface:
  1. **Price Statistics**
     - Total items
     - Items with prices
     - Average price
     - Price range (min/max)
     - Recent price changes
  2. **Consistency Check**
     - Lists items where inventory WAC differs from recipe ingredient costs
     - Shows difference percentage
     - Highlights inconsistencies (>5% difference)
  3. **Synchronization**
     - Bulk sync button to update recipe ingredient prices with current WAC
     - Shows update results
     - Lists cost changes

**Data Sources:**
- `InventoryPriceService` (from `orderingService.ts`)

### Services

#### `inventoryService.ts` (Frontend)
**Location:** `services/inventoryService.ts`

**Functions:**
- `getInventoryEntries()` - Get all inventory entries
- `getInventoryEntry(id)` - Get single entry
- `createInventoryEntry(data)` - Create new entry
- `updateInventoryEntry(id, data)` - Update entry
- `deleteInventoryEntry(id)` - Delete entry
- `getCurrentInventory()` - Get current stock status
- `getLowStockItems()` - Get low stock items
- `getTotalInventoryQuantity()` - Get total quantity
- `getInventoryStats()` - Get dashboard statistics
- `getRecentActivities()` - Get recent transactions

#### `itemService.ts` (Frontend)
**Location:** `services/itemService.ts`

**Functions:**
- `getItems()` - Get all items
- `getItemsWithSuppliers()` - Get items with supplier data
- `getItemById(id)` - Get single item
- `createItem(data)` - Create new item
- `updateItem(id, data)` - Update item
- `deleteItem(id)` - Delete item

#### `supplierService.ts` (Frontend)
**Location:** `services/supplierService.ts`

**Functions:**
- `getSuppliers(activeOnly?)` - Get all suppliers
- `getSupplierById(id)` - Get single supplier
- `createSupplier(data)` - Create new supplier
- `updateSupplier(id, data)` - Update supplier
- `deleteSupplier(id)` - Delete supplier
- `addItemToSupplier(supplierId, data)` - Add item to supplier
- `removeItemFromSupplier(supplierId, itemId)` - Remove item from supplier
- `getSupplierTransactionHistory(supplierId, params)` - Get supplier transactions

---

## Core Features

### 1. Stock Management

#### Current Stock Calculation
- Calculated by summing all IN/OUT transactions
- Formula: `currentStock = Σ(IN quantities) + Σ(OUT quantities)`
- Can be negative (stock deficit)
- Supports date range filtering for historical stock levels

#### Stock Transactions
- **IN Transactions:**
  - Positive quantity
  - Requires `unitPrice` (for WAC calculation)
  - Optional: batch number, expiry date
  - Creates stock addition

- **OUT Transactions:**
  - Negative quantity (system handles sign)
  - No unit price required
  - Validates stock availability (can allow negative for flexibility)
  - Creates stock deduction

#### Stock Validation
- Validates quantity sign matches transaction type
- Checks stock availability for OUT transactions
- Validates expiry date is in future (if provided)
- Validates unit price is positive (if provided)

### 2. Weighted Average Cost (WAC)

#### Calculation Method
```
WAC = Σ(quantity × unitPrice) / Σ(quantity)
```
- Only considers IN transactions with `unitPrice > 0`
- Ignores OUT transactions in cost calculation
- Updates automatically with each IN transaction

#### Usage
- Inventory valuation
- Recipe cost calculation
- Price consistency validation
- Cost of goods sold (COGS) calculation

### 3. Low Stock Alerts

#### Detection
- Compares current stock with `item.minStock`
- Alert triggered when: `currentStock <= minStock`
- Real-time calculation (no caching)

#### Display
- Dashboard widget
- Dedicated low stock page
- Integration with recipe ingredients
- Prioritized by usage frequency

### 4. Stock Deficits

#### Tracking
- Records items with negative stock
- Calculates deficit amount: `deficit = |currentStock|`
- Provides summary statistics

#### Analytics
- Total number of deficits
- Total deficit value (using WAC)
- Items affected
- Historical trends

### 5. Barcode/QR Scanner

#### Supported Formats
- EAN-13, EAN-8
- CODE-128, CODE-39
- QR Code
- And more (via scanner library)

#### Features
- Real-time scanning
- Item lookup by barcode
- Fuzzy matching for similar items
- Quick transaction creation
- Scan history tracking

#### Fuzzy Matching Algorithm
```typescript
function getEditDistance(str1: string, str2: string): number {
  // Levenshtein distance calculation
}

function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  const distance = getEditDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
}

function suggestSimilarItems(code: string, items: Item[]): Item[] {
  // Returns items with similarity > 70%
}
```

### 6. Inventory Reports

#### Movement Report
- Total IN/OUT by date range
- Per-item summary
- Individual transactions
- Filtering by item, type, date

#### Valuation Report
- Total inventory value (WAC)
- Per-item valuation
- Average cost per item
- Price trends

#### Export Formats
- **PDF**: Formatted report with summary
- **Excel**: Spreadsheet with all data
- **CSV**: Raw data export

### 7. Price Management

#### Price Statistics
- Total items with/without prices
- Average price
- Min/max price range
- Recent price changes

#### Price Consistency
- Compares inventory WAC with recipe ingredient costs
- Identifies inconsistencies (>5% difference)
- Highlights items needing price updates

#### Price Synchronization
- Bulk update recipe costs from inventory WAC
- Tracks cost changes
- Updates menu item prices (if configured)

---

## Integration Features

### 1. Recipe-Based Stock Management

#### Stock Validation
- **Basic Validation:**
  - Checks ingredient availability
  - Allows orders to proceed with deficits
  - Returns deficit list

- **Flexible Validation:**
  - Warning levels: LOW, CRITICAL, OUT_OF_STOCK
  - Suggested actions
  - Override capability
  - Detailed deficit information

#### Stock Deduction
- Automatically deducts ingredients when order is completed
- Creates OUT transactions for each ingredient
- Uses recipe quantities
- Tracks order ID for audit

#### Menu Availability
- Automatically updates menu item availability
- Unavailable if any ingredient is out of stock
- Low stock warnings
- Real-time updates

### 2. Stock Overrides

#### Recording
- Records when staff override stock warnings
- Captures:
  - Order ID
  - Menu item
  - Ingredient details
  - Override reason and type
  - User who overrode
  - Notes

#### Analytics
- Total overrides by period
- Breakdown by override type
- Most overridden items
- Trends over time
- User override patterns

### 3. Recipe Cost Management

#### Cost Calculation
- Calculates recipe cost from ingredient WAC
- Updates automatically when ingredient prices change
- Supports manual cost updates

#### Cost Updates
- Bulk recalculation
- Tracks cost changes
- Updates menu item prices (optional)
- Historical cost tracking

### 4. Integration Status

#### Health Monitoring
- Total menu items
- Items with recipes
- Available/unavailable items
- Low stock ingredients
- Integration health score

---

## User Roles and Permissions

### ADMIN
- **Full Access:**
  - All inventory operations
  - Delete any entry (within 7 days)
  - Stock adjustments
  - Supplier management
  - Price management
  - Reports and analytics

### MANAGER
- **Management Access:**
  - View all inventory
  - Create/update entries
  - Delete own entries (within 7 days)
  - Delete others' entries (within 7 days)
  - View reports
  - Supplier management

### STAFF
- **Limited Access:**
  - View inventory
  - Create entries
  - Update own entries (within 7 days)
  - Delete own recent entries (within 7 days)
  - Cannot delete others' entries
  - Cannot perform stock adjustments
  - View basic reports

### WAREHOUSE
- **Warehouse Operations:**
  - View inventory
  - Create IN/OUT entries
  - Barcode scanning
  - View low stock alerts
  - Basic reporting

### Permission Rules

#### Entry Deletion
- **Recent entries (< 7 days):**
  - ADMIN: Can delete any
  - MANAGER: Can delete any
  - STAFF: Can delete own only

- **Old entries (≥ 7 days):**
  - Cannot be deleted by anyone (data integrity)

#### Stock Adjustments
- Only ADMIN and MANAGER can perform adjustments
- Requires reason for audit trail

#### Supplier Management
- ADMIN and MANAGER: Full CRUD
- STAFF: View only

---

## API Endpoints

### Inventory Endpoints

#### GET `/api/inventory/`
Get paginated inventory entries.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `itemId`: Filter by item ID
- `type`: Filter by type (IN/OUT)
- `startDate`: Start date (ISO string)
- `endDate`: End date (ISO string)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "entries": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### GET `/api/inventory/current`
Get current stock status for all items.

**Response:**
```json
[
  {
    "itemId": "item-id",
    "itemName": "Item Name",
    "category": "Category",
    "unit": "kg",
    "current": 100,
    "totalIn": 150,
    "totalOut": 50
  }
]
```

#### GET `/api/inventory/low-stock`
Get items with low stock.

**Response:**
```json
[
  {
    "itemId": "item-id",
    "itemName": "Item Name",
    "currentStock": 5,
    "minStock": 10,
    "deficit": 5
  }
]
```

#### GET `/api/inventory/report`
Generate inventory movement report.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `itemId`: Filter by item
- `type`: Filter by type

**Response:**
```json
{
  "report": {
    "summary": {
      "totalEntries": 100,
      "totalIn": 500,
      "totalOut": 200,
      "netMovement": 300
    },
    "byItem": [...],
    "entries": [...]
  }
}
```

#### POST `/api/inventory/`
Create inventory entry.

**Request Body:**
```json
{
  "itemId": "item-id",
  "quantity": 100,
  "type": "IN",
  "unitPrice": 1000,
  "batchNumber": "BATCH001",
  "expiryDate": "2025-12-31",
  "note": "Stock arrival"
}
```

**Response:**
```json
{
  "id": "entry-id",
  "itemId": "item-id",
  "quantity": 100,
  "type": "IN",
  ...
}
```

#### PUT `/api/inventory/:id`
Update inventory entry.

**Request Body:**
```json
{
  "note": "Updated note",
  "batchNumber": "UPDATED_BATCH"
}
```

**Note:** Cannot update `quantity` or `type`.

#### DELETE `/api/inventory/:id`
Delete inventory entry.

**Constraints:**
- Entry must be < 7 days old
- User must have permission (role-based)

### Stock Validation Endpoints

#### GET `/api/inventory/stock-validation/:menuItemId`
Flexible stock validation for menu item.

**Response:**
```json
{
  "isAvailable": true,
  "warnings": [
    {
      "level": "LOW",
      "itemId": "item-id",
      "itemName": "Item Name",
      "required": 10,
      "available": 8,
      "deficit": 2
    }
  ],
  "suggestedActions": [...],
  "canOverride": true
}
```

#### POST `/api/inventory/validate-order-stock`
Validate stock for multiple order items.

**Request Body:**
```json
{
  "orderItems": [
    {
      "menuItemId": "menu-item-id",
      "quantity": 2
    }
  ]
}
```

#### POST `/api/inventory/stock-override`
Record stock override.

**Request Body:**
```json
{
  "orderId": "order-id",
  "menuItemId": "menu-item-id",
  "itemId": "item-id",
  "itemName": "Item Name",
  "requiredQuantity": 10,
  "availableQuantity": 5,
  "overrideReason": "Emergency purchase",
  "overrideType": "EMERGENCY_PURCHASE",
  "notes": "Additional notes"
}
```

#### GET `/api/inventory/stock-override-analytics`
Get stock override analytics.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date

**Response:**
```json
{
  "totalOverrides": 50,
  "byType": {...},
  "byMenuItem": {...},
  "byItem": {...},
  "trends": [...]
}
```

### Integration Endpoints

#### GET `/api/inventory/low-stock-alerts`
Get low stock alerts for recipe ingredients.

**Response:**
```json
{
  "criticalIngredients": [
    {
      "itemId": "item-id",
      "itemName": "Item Name",
      "currentStock": 5,
      "minStock": 10,
      "usageFrequency": 10,
      "menuItems": [...]
    }
  ]
}
```

#### GET `/api/inventory/integration-status`
Get integration status.

**Response:**
```json
{
  "totalMenuItems": 50,
  "itemsWithRecipes": 45,
  "availableItems": 40,
  "unavailableItems": 5,
  "lowStockIngredients": 3,
  "integrationHealth": "GOOD"
}
```

#### POST `/api/inventory/update-menu-availability`
Update menu item availability.

**Response:**
```json
{
  "updated": 5,
  "unavailableItems": ["menu-item-id"],
  "lowStockItems": ["menu-item-id"]
}
```

#### POST `/api/inventory/update-recipe-costs`
Update recipe costs.

**Response:**
```json
{
  "updated": 10,
  "costChanges": [
    {
      "menuItemId": "menu-item-id",
      "oldCost": 5000,
      "newCost": 5500,
      "difference": 500
    }
  ]
}
```

---

## Business Logic

### 1. Stock Calculation Logic

```typescript
// Current stock = sum of all transactions
currentStock = Σ(IN quantities) + Σ(OUT quantities)

// Can be negative (deficit)
if (currentStock < 0) {
  // Stock deficit detected
}
```

### 2. WAC Calculation Logic

```typescript
// Only consider IN transactions with unitPrice
const inTransactions = entries.filter(e => 
  e.type === 'IN' && e.unitPrice && e.unitPrice > 0
);

const totalQuantity = inTransactions.reduce((sum, e) => sum + e.quantity, 0);
const totalValue = inTransactions.reduce((sum, e) => 
  sum + (e.quantity * e.unitPrice), 0
);

const wac = totalQuantity > 0 ? totalValue / totalQuantity : 0;
```

### 3. Low Stock Detection

```typescript
const isLowStock = currentStock <= item.minStock;
```

### 4. Stock Availability Check

```typescript
// For OUT transactions
if (type === 'OUT') {
  const currentStock = await calculateCurrentStock(itemId);
  const requestedQuantity = Math.abs(quantity);
  
  // Flexible: allow negative stock
  if (currentStock < requestedQuantity) {
    // Warning: insufficient stock
    // But allow transaction to proceed
  }
}
```

### 5. Recipe Stock Validation

```typescript
// For each ingredient in recipe
for (const ingredient of recipe.ingredients) {
  const currentStock = await calculateCurrentStock(ingredient.itemId);
  const required = ingredient.quantity * orderQuantity;
  
  if (currentStock < required) {
    deficits.push({
      itemId: ingredient.itemId,
      required,
      available: currentStock,
      deficit: required - currentStock
    });
  }
}
```

### 6. Stock Deduction on Order Completion

```typescript
// When order is completed
for (const orderItem of order.items) {
  const recipe = await getRecipe(orderItem.menuItemId);
  
  for (const ingredient of recipe.ingredients) {
    await createInventoryEntry({
      itemId: ingredient.itemId,
      quantity: -ingredient.quantity * orderItem.quantity,
      type: 'OUT',
      note: `Order ${orderId} - ${orderItem.menuItemName}`
    });
  }
}
```

### 7. Menu Availability Update

```typescript
// Check all ingredients for menu item
for (const ingredient of recipe.ingredients) {
  const currentStock = await calculateCurrentStock(ingredient.itemId);
  
  if (currentStock <= 0) {
    // Set menu item to unavailable
    await updateMenuItemAvailability(menuItemId, false);
    break;
  }
}
```

### 8. Price Consistency Validation

```typescript
// Compare inventory WAC with recipe ingredient cost
const inventoryPrice = await calculateWeightedAverageCost(itemId);
const recipePrice = recipeIngredient.unitPrice;

const difference = Math.abs(inventoryPrice - recipePrice);
const percentage = (difference / recipePrice) * 100;

if (percentage > 5) {
  // Inconsistency detected
  inconsistencies.push({
    itemId,
    inventoryPrice,
    recipePrice,
    difference,
    percentage
  });
}
```

---

## Testing

### Unit Tests (`inventory.test.ts`)

**Test Coverage:**
- Stock calculations
- Stock movements with pagination
- Stock entry validation
- Low stock detection
- Inventory valuation
- Weighted average cost calculation
- Entry deletion validation

**Key Test Cases:**
- Calculate current stock correctly
- Handle zero stock
- Handle negative stock (deficits)
- Date range filtering
- Pagination
- Type filtering
- Validation rules
- WAC calculation with multiple purchases
- Deletion permissions by role

### Integration Tests (`inventory.routes.test.ts`)

**Test Coverage:**
- API endpoint functionality
- Authentication and authorization
- Request validation
- Response formats
- Error handling

**Key Test Cases:**
- GET endpoints return correct data
- POST creates entries correctly
- PUT updates entries correctly
- DELETE removes entries correctly
- Role-based access control
- Stock availability validation
- Date range filtering
- Pagination
- Report generation

---

## Key Implementation Details

### 1. Route Ordering
**Critical:** Parameterized routes (`/:id`) must be defined AFTER specific routes to prevent conflicts.

```typescript
// Correct order
router.get('/low-stock-alerts', ...);  // Specific route
router.get('/:id', ...);                // Parameterized route (last)
```

### 2. Database Transactions
Used for critical operations to ensure data consistency:

```typescript
await prisma.$transaction(async (tx) => {
  // Create inventory entry
  const entry = await tx.inventoryEntry.create({...});
  
  // Update stock calculations
  // Send notifications
  // Update related records
});
```

### 3. Asynchronous Notifications
Notifications are sent asynchronously to avoid blocking:

```typescript
// Non-blocking notification
setImmediate(async () => {
  await sendLowStockNotification(itemId);
});
```

### 4. Multi-tenant Isolation
All queries include `tenantId` filter:

```typescript
const entries = await prisma.inventoryEntry.findMany({
  where: {
    tenantId: req.user.tenantId,
    // ... other filters
  }
});
```

### 5. Optimized Queries
Uses `groupBy` and `aggregate` for efficient calculations:

```typescript
const stockLevels = await prisma.inventoryEntry.groupBy({
  by: ['itemId'],
  where: { tenantId },
  _sum: { quantity: true }
});
```

### 6. Fuzzy Matching Algorithm
Edit distance calculation for barcode matching:

```typescript
function getEditDistance(str1: string, str2: string): number {
  const matrix = [];
  // Levenshtein distance implementation
  return matrix[str1.length][str2.length];
}
```

---

## Error Handling

### Validation Errors
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **403 Forbidden**: Insufficient permissions

### Business Logic Errors
- Stock availability warnings (non-blocking)
- Price consistency warnings
- Low stock alerts

### Database Errors
- Transaction rollback on failure
- Foreign key constraint handling
- Unique constraint violations

---

## Performance Considerations

### Optimization Strategies
1. **Database Indexing**: Indexes on `itemId`, `tenantId`, `createdAt`
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Consider caching for frequently accessed data (not currently implemented)
4. **Batch Operations**: Group operations when possible
5. **Query Optimization**: Use `groupBy` and `aggregate` for calculations

### Scalability
- Multi-tenant architecture supports horizontal scaling
- Stateless API design
- Database connection pooling
- Efficient query patterns

---

## Future Enhancements (Potential)

1. **Real-time Updates**: WebSocket support for live inventory updates
2. **Advanced Analytics**: Predictive stock forecasting
3. **Automated Reordering**: Automatic purchase orders based on stock levels
4. **Batch Operations**: Bulk import/export
5. **Mobile App**: Native mobile app for warehouse operations
6. **Barcode Generation**: Generate barcodes for items
7. **Inventory Audits**: Periodic stock counting and reconciliation
8. **Expiry Management**: Alerts for expiring items
9. **Multi-location Support**: Track inventory across multiple locations
10. **Advanced Reporting**: Custom report builder

---

## Conclusion

The Inventory Management workspace is a comprehensive system that provides:
- Complete stock tracking and management
- Integration with ordering system for recipe-based operations
- Flexible stock validation with override capabilities
- Advanced reporting and analytics
- Multi-tenant architecture
- Role-based access control
- Barcode/QR code scanning
- Price management and consistency validation

The system is designed for scalability, maintainability, and extensibility, with clear separation of concerns and comprehensive test coverage.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team

