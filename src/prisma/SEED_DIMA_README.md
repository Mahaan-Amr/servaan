# Comprehensive Seed Data for DIMA Tenant

This seed script creates comprehensive, realistic data for the **DIMA** tenant covering both **Inventory Management** and **Ordering System** workspaces.

## 📋 What Gets Created

### Inventory Management Workspace
- **7 Users**: 1 Admin, 1 Manager, 5 Staff members
- **16 Suppliers**: Various suppliers with contact information
- **44 Items**: Comprehensive catalog across 15 categories:
  - Coffee (قهوه)
  - Tea (چای)
  - Dairy (لبنیات)
  - Sweets (شیرینی)
  - Packaging (بسته‌بندی)
  - Sweeteners (شیرین کننده)
  - Beverages (نوشیدنی)
  - Fruits (میوه)
  - Grains (غلات)
  - Meat (گوشت)
  - Poultry (مرغ)
  - Vegetables (سبزیجات)
  - Spices (ادویه‌جات)
  - Bread (نان)
  - Oil (روغن)
- **Inventory Entries**: 
  - Initial stock entries (6 months ago)
  - Regular IN entries (purchases) with different frequencies:
    - High-demand items: Weekly purchases
    - Medium-demand items: Bi-weekly purchases
    - Low-demand items: Monthly purchases
  - OUT entries (sales/usage) with realistic patterns:
    - High-demand items: Daily sales
    - Medium-demand items: Every 2-3 days
    - Low-demand items: Weekly sales
- **Item-Supplier Links**: Items linked to suppliers with pricing
- **Inventory Settings**: Configuration for inventory management

### Ordering System Workspace
- **150 Customers**: With realistic Persian names and contact info
- **20 Tables**: Across different sections (سالن اصلی, سالن VIP, تراس, اتاق خصوصی)
- **8 Menu Categories**: 
  - Hot Beverages (نوشیدنی‌های گرم)
  - Cold Beverages (نوشیدنی‌های سرد)
  - Breakfast (صبحانه)
  - Lunch (ناهار)
  - Dinner (شام)
  - Desserts (دسر)
  - Salads (سالاد)
  - Sandwiches (ساندویچ)
- **22 Menu Items**: Linked to inventory items where applicable
- **Recipes**: For menu items that use inventory items
- **Menu Item Modifiers**: Size options, extras, etc.
- **1,800+ Orders**: Spread over the last 90 days (10-30 orders per day)
  - Various order types: DINE_IN, TAKEAWAY, DELIVERY
  - Various statuses: DRAFT, PENDING, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
  - Realistic payment statuses and methods
  - Complete order items with quantities and pricing
- **Order Payments**: For paid and partially paid orders
- **Order Options**: Tax, service charge, discounts configured
- **50 Table Reservations**: Past and future reservations
- **400+ Table Status Logs**: Status change history
- **50 Kitchen Displays**: For active orders
- **100 Order Modifications**: Order change history
- **Ordering Settings**: Configuration for ordering system

## 📅 Date Range

All data is created with realistic dates:
- **Inventory Entries**: Last 6 months (180 days)
- **Orders**: Last 90 days
- **Customers**: Created over the last 6 months
- **Reservations**: Past and future (30 days back, 30 days forward)

## 🚀 How to Run

### Option 1: Direct Execution
```bash
cd src/prisma
node seed-dima-comprehensive.js
```

### Option 2: Using npm script (if configured)
```bash
npm run seed:dima
```

### Option 3: Using Prisma
```bash
npx prisma db seed --script seed-dima-comprehensive.js
```

## ⚠️ Important Notes

1. **Data Cleanup**: The script **deletes all existing data** for the DIMA tenant before creating new data. This ensures a clean slate.

2. **Tenant Creation**: If the DIMA tenant doesn't exist, it will be created automatically.

3. **Execution Time**: The script may take several minutes to complete due to the large amount of data being created.

4. **Database Connection**: Make sure your `.env` file has the correct `DATABASE_URL` configured.

5. **Prisma Client**: Ensure Prisma client is generated:
   ```bash
   npx prisma generate
   ```

## 📊 Data Statistics

After running the script, you should have:
- ~2,000+ inventory entries
- ~1,800+ orders
- ~3,600+ order items
- ~1,800+ order payments
- Complete relationships between all entities

## 🔍 Verification

After running the script, you can verify the data by:

1. **Check Inventory**:
   - Navigate to Inventory Management workspace
   - View items, suppliers, and inventory entries
   - Check stock levels and transaction history

2. **Check Orders**:
   - Navigate to Ordering System workspace
   - View orders, tables, menu items
   - Check order history and payments

3. **Check BI Dashboard**:
   - Navigate to Business Intelligence workspace
   - View KPIs, charts, and analytics
   - All data should be visible and working

## 🐛 Troubleshooting

If you encounter errors:

1. **Database Connection Error**: Check your `DATABASE_URL` in `.env`
2. **Prisma Client Error**: Run `npx prisma generate`
3. **Foreign Key Errors**: The script handles dependencies correctly, but if you see FK errors, check the deletion order
4. **Memory Issues**: If the script runs out of memory, you can reduce the number of orders by modifying the loop in the orders section

## 📝 Customization

You can customize the seed data by modifying:
- Number of items: Change `itemCatalog.length`
- Number of orders: Change `ordersPerDay` or `day < 90`
- Number of customers: Change the loop count in customers section
- Date ranges: Modify `sixMonthsAgo`, `now`, etc.

## ✅ Success Indicators

When the script completes successfully, you should see:
```
🎉 Comprehensive seed data creation completed!
📊 Summary:
   - Users: 7
   - Suppliers: 16
   - Items: 44
   - Inventory Entries: Created with realistic dates
   - Customers: 150
   - Tables: 20
   - Menu Categories: 8
   - Menu Items: 22
   - Recipes: [number]
   - Menu Item Modifiers: [number]
   - Orders: [number]
   - Table Reservations: 50
   - Table Status Logs: [number]
   - Kitchen Displays: [number]
   - Order Modifications: [number]

✅ All data created successfully for DIMA tenant!
📅 Data spans the last 6 months with realistic dates and relationships!
```

