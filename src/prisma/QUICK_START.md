# 🚀 Quick Start Guide - Dima Seed

## One-Line Setup

```bash
# From root directory
cd d:\servaan && node src/prisma/dima-seed-final.js
```

## What Gets Created

| Component | Count | Notes |
|-----------|-------|-------|
| **Users** | 4 | 1 Admin + 1 Manager + 2 Staff |
| **Suppliers** | 12 | Farsi names with contact info |
| **Items** | 35 | Food items across 5 categories |
| **Inventory Transactions** | 300+ | Sept 1 - Dec 24, 2024 |
| **Customers** | 50+ | Iranian names with phone numbers |
| **Restaurant Tables** | 10 | Capacity 4-8 seats, 2 floors |
| **Menu Categories** | 5 | گرمها، نوشیدنیها، سالادها، etc. |
| **Menu Items** | 35+ | Linked to suppliers & items |
| **Orders** | 25+ | Oct 1 - Dec 24, 2024 |
| **Order Items** | 72+ | Line items across all orders |
| **Order Payments** | 25+ | CASH, CARD, ONLINE methods |
| **Kitchen Display** | 15 | KDS entries for order tracking |

## Login Credentials

```
Admin:    admin@dima.ir     / admin@dima123
Manager:  manager@dima.ir   / admin@dima123
Staff 1:  staff1@dima.ir    / staff@dima123
Staff 2:  staff2@dima.ir    / staff@dima123
```

## Verify Installation

```bash
# Check seed was successful
node src/prisma/verify-dima-seed.js
```

Expected output:
- ✅ 12 Suppliers
- ✅ 35 Items
- ✅ 300+ Inventory Entries
- ✅ 50+ Customers
- ✅ 10 Tables
- ✅ 35+ Menu Items
- ✅ 25+ Orders

## Field Mapping Verification

All exact schema field names used:

### ✅ Tenant
- `subdomain` ✓
- `name`, `displayName` ✓
- `plan`, `isActive` ✓
- `ownerName`, `ownerEmail`, `ownerPhone` ✓
- `businessType`, `address`, `city`, `country` ✓
- `timezone`, `locale`, `currency` ✓

### ✅ Item
- `tenantId`, `name`, `category` ✓
- `unit`, `barcode`, `description` ✓
- `isActive`, `minStock` ✓

### ✅ InventoryEntry
- `tenantId`, `itemId`, `userId` ✓
- `quantity`, `type` (IN|OUT) ✓
- `note`, `unitPrice` ✓
- `createdAt` (with historical dates) ✓

### ✅ Order
- `orderNumber`, `orderType`, `status` ✓
- `customerId`, `tableId`, `guestCount` ✓
- `subtotal`, `discountAmount`, `taxAmount`, `serviceCharge`, `totalAmount` ✓
- `paymentStatus`, `paymentMethod`, `paidAmount` ✓
- `orderDate`, `startedAt`, `readyAt`, `servedAt`, `completedAt` ✓
- `createdBy`, `servedBy` ✓

### ✅ OrderItem
- `orderId`, `menuItemId`, `itemId` ✓
- `itemName`, `itemCode`, `quantity` ✓
- `unitPrice`, `totalPrice`, `lineNumber` ✓
- `tenantId` ✓

### ✅ Table
- `tenantId`, `tableNumber`, `tableName` ✓
- `capacity`, `section`, `floor`, `status` ✓

### ✅ MenuItem
- `tenantId`, `categoryId`, `itemId` ✓
- `displayName`, `description`, `menuPrice` ✓
- `displayOrder`, `isActive`, `isFeatured` ✓
- `isVegetarian`, `isNew`, `prepTime` ✓

### ✅ Customer
- `tenantId`, `phone`, `phoneNormalized` ✓
- `name`, `email`, `status`, `segment` ✓
- `createdBy`, `isActive` ✓

### ✅ User
- `tenantId`, `name`, `email`, `password` (bcrypt) ✓
- `role`, `active`, `phoneNumber` ✓

### ✅ Supplier
- `tenantId`, `name`, `contactName` ✓
- `email`, `phoneNumber`, `address` ✓
- `isActive` ✓

## Data Quality

### Realistic Prices (in TOMAN)

**Main Dishes**: 75,000 - 200,000
- برنج: 95,000
- کباب: 110,000-120,000
- ماهی: 140,000-180,000

**Beverages**: 8,000 - 22,000
- آب نعناع: 12,000
- قهوه سرد: 18,000
- شیر دوغ: 14,000

**Orders**: 100,000 - 600,000 TOMAN

### Realistic Quantities

**Inventory IN**: 10-50 units per transaction
**Inventory OUT**: 2-30 units per transaction
**Order Items**: 1-3 items per order

### Date Ranges

- **Inventory**: Sept 1 - Dec 24, 2024 (116 days)
- **Orders**: Oct 1 - Dec 24, 2024 (85 days)

### Payment Distribution

- CASH: ~40%
- CARD: ~35%
- ONLINE: ~25%

## Troubleshooting

### ❌ "Cannot find module" Error
```bash
# Fix: Generate Prisma client
npm run prisma:generate
```

### ❌ "ECONNREFUSED" Error
```bash
# Fix: Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# docker-compose up -d postgres
```

### ❌ "Unique constraint failed on subdomain"
```bash
# Fix: Tenant already exists, delete first
# Use pgAdmin or run:
# DELETE FROM tenants WHERE subdomain = 'dima';
```

### ❌ "User with email exists"
```bash
# This shouldn't happen, but if it does:
# DELETE FROM users WHERE email LIKE '%@dima.ir';
```

## Next Steps After Seeding

1. **Login to Frontend**
   ```
   URL: http://localhost:3000 (or your frontend URL)
   Email: admin@dima.ir
   Password: admin@dima123
   ```

2. **Test Inventory**
   - View items & suppliers
   - Check stock levels
   - Review transactions

3. **Test Ordering**
   - Create orders
   - Add items to order
   - Process payments
   - Track in Kitchen Display

4. **Test BI**
   - Generate revenue reports
   - Analyze customer segments
   - Review inventory metrics
   - Create dashboards

## Files Created

```
src/prisma/
├── dima-seed-final.js         # Main seed file (executable)
├── verify-dima-seed.js        # Verification script
├── SEED_INSTRUCTIONS.md       # Detailed documentation
└── QUICK_START.md             # This file
```

## Performance

- **Runtime**: 5-10 seconds
- **Database Size**: ~2-3 MB
- **Uses**: Batch creates for efficiency
- **No Issues**: Circular dependencies handled

## Support

For issues:
1. Check SEED_INSTRUCTIONS.md for detailed info
2. Run verify-dima-seed.js to validate data
3. Check schema.prisma for field names
4. Review error messages carefully

---

**Ready to test Inventory, Ordering, and BI systems!** ✨
