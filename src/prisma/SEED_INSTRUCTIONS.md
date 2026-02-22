# 🌱 Dima Tenant Seed File - Complete Guide

## Overview

`dima-seed-final.js` is a comprehensive seed file that populates the **dima** tenant with realistic data for:

1. **Inventory Management**: 12 suppliers, 35 items, 300+ transactions across 116 days (Sept 1 - Dec 24, 2024)
2. **Ordering System**: 10 restaurant tables, 5 menu categories, 35+ menu items, 25+ orders with payments
3. **Business Intelligence**: Complete transactional data for BI calculations

All data is in **Farsi** for an authentic Iranian restaurant experience.

## Prerequisites

```bash
# Ensure Node.js packages are installed
cd src/prisma
npm install bcrypt

# Ensure Prisma client is generated
npm run prisma:generate

# Database must be running
# Check DATABASE_URL in .env file
```

## Usage

### Option 1: Direct Execution

```bash
cd d:\servaan
node src/prisma/dima-seed-final.js
```

### Option 2: From Backend Directory

```bash
cd src/backend
node ../prisma/dima-seed-final.js
```

### Option 3: Using npm Script

Add to `package.json` in root:
```json
{
  "scripts": {
    "seed:dima": "node src/prisma/dima-seed-final.js"
  }
}
```

Then run:
```bash
npm run seed:dima
```

## Output Example

```
🌱 Starting seed for dima tenant...

Creating Tenant...
✓ Tenant created: dima
Creating Tenant Features...
✓ Tenant Features created
Creating Inventory Settings...
✓ Inventory Settings created
Creating Ordering Settings...
✓ Ordering Settings created
Creating Users...
✓ 4 Users created
Creating Suppliers...
✓ 12 Suppliers created
Creating Items...
✓ 35 Items created
Creating Item-Supplier relationships...
✓ 54 Item-Supplier relationships created
Creating Inventory Entries (300+)...
✓ 300 Inventory Entries created
Creating Tables...
✓ 10 Tables created
Creating Menu Categories...
✓ 5 Menu Categories created
Creating Menu Items (10+ per category)...
✓ 35 Menu Items created
Creating Customers (50+)...
✓ 50 Customers created
Creating Orders (20+)...
✓ 25 Orders created
Creating Order Items...
✓ 72 Order Items created
Creating Order Payments...
✓ 25 Order Payments created
Creating Kitchen Display entries...
✓ 15 Kitchen Display entries created

✅ Seed completed successfully!

📊 Summary:
  • Tenant: dima (رستوران دیما)
  • Users: 4 (1 Admin, 1 Manager, 2 Staff)
  • Suppliers: 12
  • Inventory Items: 35
  • Inventory Transactions: 300+
  • Customers: 50+
  • Tables: 10
  • Menu Categories: 5
  • Menu Items: 35+
  • Orders: 25+
  • Order Payments: 25+
  • Kitchen Display Entries: 15

✨ Ready for Inventory, Ordering, and BI testing!
```

## Tenant Details

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dima.ir | admin@dima123 |
| Manager | manager@dima.ir | admin@dima123 |
| Staff 1 | staff1@dima.ir | staff@dima123 |
| Staff 2 | staff2@dima.ir | staff@dima123 |

### Tenant Info

- **Subdomain**: `dima`
- **Business Name**: رستوران دیما (Dima Restaurant)
- **Owner**: محمد علی سپهری (Mohammad Ali Sepehri)
- **Phone**: +989121234567
- **Address**: تهران، خیابان والفجر (Tehran, Valfajr St.)
- **Business Type**: رستوران (Restaurant)
- **Currency**: TOMAN (تومان)
- **Timezone**: Asia/Tehran
- **Locale**: fa-IR (Farsi - Iran)

## Data Details

### 1. Inventory Management

#### Suppliers (12 total)
All Farsi names with realistic contact information:
- سپاهان تجارت
- الماس آذر
- خط سیمرغ
- ... and 9 more

#### Items (35 total)
Categorized across 5 food categories:
- **خوراک** (Main Dishes): Biryani, Kabab variations, Fish, Stews
- **انواع_نوشیدنی** (Beverages): Fresh juices, tea, coffee
- **سالادها** (Salads): Traditional Iranian salads
- **حبوبات** (Legumes): Rice, beans
- **دریایی** (Seafood): Fish and shrimp varieties

#### Inventory Transactions (300+)
- **Time Range**: Sept 1 - Dec 24, 2024 (116 days)
- **Types**: IN (stock received) and OUT (stock sold)
- **Quantities**: Realistic purchase/sale amounts
- **Unit Prices**: Varies from 10,000 to 600,000 TOMAN

### 2. Ordering System

#### Tables (10)
- **Capacity**: 4-8 seats per table
- **Sections**: داخل (Inside), بیرونی (Outside), سالن (Hall)
- **Floors**: 2 levels
- **Status**: AVAILABLE

#### Menu Items (35+)
Across 5 categories:
1. **گرمها** (Main Dishes) - 11 items (95K-200K TOMAN)
2. **نوشیدنیها** (Beverages) - 11 items (8K-22K TOMAN)
3. **سالادها** (Salads) - 5 items (32K-45K TOMAN)
4. **پیش غذاها** (Appetizers) - 5 items (25K-45K TOMAN)
5. **دسرها** (Desserts) - 5 items (22K-35K TOMAN)

#### Orders (25+)
- **Order Types**: DINE_IN, TAKEAWAY, DELIVERY (mixed)
- **Status**: COMPLETED, SERVED, CONFIRMED, PREPARING
- **Subtotals**: 100K - 600K TOMAN
- **Dates**: Oct 1 - Dec 24, 2024 (85 days)
- **Payment Method**: CASH, CARD, ONLINE (mixed)
- **Tax**: 9% of subtotal
- **Service Charge**: 10% of subtotal
- **Discount**: Random (0-10% sometimes applied)

#### Customers (50+)
Authentic Farsi names with:
- Phone numbers (normalized Iranian format)
- Email addresses
- Status: ACTIVE
- Segment: NEW, OCCASIONAL, REGULAR, VIP (mixed)

### 3. Business Intelligence Data

The seed provides comprehensive data for BI calculations:

- **Sales Metrics**: Total revenue, average order value, items sold
- **Customer Metrics**: Customer count, repeat customers, segments
- **Inventory Metrics**: Stock levels, turnover rates, supplier performance
- **Time Series Data**: Orders and transactions over 116 days
- **Product Performance**: Menu item popularity via order items
- **Financial Data**: Payment methods, discounts, taxes, service charges

## Field Mapping (Exact Schema Names)

### Tenant Model
- ✅ `subdomain` (unique)
- ✅ `name`, `displayName`
- ✅ `plan` (TenantPlan enum)
- ✅ `ownerName`, `ownerEmail`, `ownerPhone`
- ✅ `businessType`, `address`, `city`, `country`
- ✅ `timezone`, `locale`, `currency`

### Item Model
- ✅ `name`, `category`, `unit`
- ✅ `barcode`, `description`
- ✅ `isActive`, `minStock`, `tenantId`

### InventoryEntry Model
- ✅ `itemId`, `tenantId`, `userId`
- ✅ `quantity`, `type` (InventoryEntryType enum)
- ✅ `note`, `unitPrice`
- ✅ `createdAt` (with random dates from range)

### Order Model
- ✅ `orderNumber`, `orderType`, `status`
- ✅ `customerId`, `tableId`, `guestCount`
- ✅ `subtotal`, `discountAmount`, `taxAmount`, `serviceCharge`, `totalAmount`
- ✅ `paymentStatus`, `paymentMethod`, `paidAmount`
- ✅ `orderDate`, `startedAt`, `readyAt`, `servedAt`, `completedAt`
- ✅ `createdBy`, `servedBy`

### OrderItem Model
- ✅ `orderId`, `menuItemId`, `itemId`
- ✅ `itemName`, `itemCode`, `quantity`
- ✅ `unitPrice`, `totalPrice`
- ✅ `prepStatus`, `lineNumber`, `tenantId`

### Table Model
- ✅ `tenantId`, `tableNumber`, `tableName`
- ✅ `capacity`, `section`, `floor`, `status`

### MenuItem Model
- ✅ `tenantId`, `categoryId`, `itemId`
- ✅ `displayName`, `description`, `menuPrice`
- ✅ `displayOrder`, `isActive`, `isFeatured`
- ✅ `isVegetarian`, `isNew`, `prepTime`

### Customer Model
- ✅ `tenantId`, `phone`, `phoneNormalized`
- ✅ `name`, `email`, `status`, `segment`
- ✅ `createdBy`, `isActive`

### User Model
- ✅ `tenantId`, `name`, `email`, `password` (bcrypt hashed)
- ✅ `role`, `active`, `phoneNumber`

### Supplier Model
- ✅ `tenantId`, `name`, `contactName`
- ✅ `email`, `phoneNumber`, `address`
- ✅ `isActive`

## Decimal/BigDecimal Handling

All monetary fields use `Decimal` type and are stored as proper numbers:

```javascript
// Example order totals
subtotal: 345000,        // 345,000 TOMAN
discountAmount: 34500,   // 10% discount
taxAmount: 27945,        // 9% tax
serviceCharge: 34500,    // 10% service
totalAmount: 373245      // Total: 373,245 TOMAN
```

Prisma automatically handles Decimal conversion when reading/writing.

## Testing Checklist

After running the seed, verify:

- [ ] **Inventory**
  - [ ] View 35 items
  - [ ] Check 12 suppliers
  - [ ] See 300+ inventory transactions
  - [ ] Stock levels calculated correctly
  
- [ ] **Ordering**
  - [ ] View 10 tables with correct capacity
  - [ ] See 5 menu categories
  - [ ] Browse 35+ menu items with prices
  - [ ] View 25+ orders with complete order flow
  - [ ] Check order payments and status
  
- [ ] **Business Intelligence**
  - [ ] Calculate total revenue
  - [ ] Analyze customer segments
  - [ ] Review inventory turnover
  - [ ] Check product popularity via order items
  - [ ] Time series analysis (Sept-Dec 2024)

## Troubleshooting

### Error: `Cannot find module '../shared/generated/client'`
**Solution**: Run `npm run prisma:generate` from root directory

### Error: `ECONNREFUSED` - Database not running
**Solution**: Check DATABASE_URL in .env and ensure PostgreSQL is running

### Error: `Unique constraint failed on subdomain`
**Solution**: Tenant 'dima' already exists. Delete it first:
```javascript
await prisma.tenant.delete({ where: { subdomain: 'dima' } });
```

### Error: Decimal type issue
**Solution**: This seed uses numbers directly. Prisma handles Decimal conversion automatically.

## Performance Notes

- **Runtime**: ~5-10 seconds (depending on database connection)
- **Database Size**: ~2-3 MB data
- **Transactions**: All creates use `createMany()` for batch efficiency
- **No Circular Dependencies**: Careful relationship ordering prevents issues

## Next Steps

1. **Access the Frontend**: https://dima.localhost (or subdomain configured in Docker)
2. **Login**: Use admin@dima.ir / admin@dima123
3. **Explore**:
   - Inventory workspace: View items, suppliers, transactions
   - Ordering workspace: Manage tables, menu, orders
   - BI workspace: Generate reports and dashboards

## Script Notes

- Uses `bcrypt.hash()` for secure password storage
- All timestamps are set to 2024 for consistency
- Random data generation ensures realistic variation
- Farsi names and descriptions throughout
- Phone numbers follow Iranian format (+989xx-xxxxxxxxx)
- Menu prices in TOMAN (no decimals, as per Iranian convention)

---

**Created**: December 2024  
**Version**: 1.0  
**Compatible with**: Servaan v2.0+ (Prisma schema)
