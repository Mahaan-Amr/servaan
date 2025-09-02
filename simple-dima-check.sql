-- Simple check for dima tenant data
SELECT 'DIMA TENANT DATA SUMMARY' as info;

-- Check customers
SELECT 'CUSTOMERS' as table_name, COUNT(*) as count 
FROM customers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- Check menu items  
SELECT 'MENU ITEMS' as table_name, COUNT(*) as count 
FROM menu_items 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- Check orders
SELECT 'ORDERS' as table_name, COUNT(*) as count 
FROM orders 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- Check suppliers
SELECT 'SUPPLIERS' as table_name, COUNT(*) as count 
FROM suppliers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- Check item_suppliers
SELECT 'ITEM SUPPLIERS' as table_name, COUNT(*) as count 
FROM item_suppliers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';
