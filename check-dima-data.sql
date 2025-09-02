-- Check Dima Tenant Data
-- Tenant ID: cmelrmijr0000lzaoy61yy2za

-- 1. Basic tenant info
SELECT 'TENANT INFO' as section;
SELECT id, subdomain, name, "displayName", "businessType", "createdAt" 
FROM tenants 
WHERE subdomain = 'dima';

-- 2. Customer count
SELECT 'CUSTOMER COUNT' as section;
SELECT COUNT(*) as total_customers 
FROM customers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- 3. Menu items count
SELECT 'MENU ITEMS COUNT' as section;
SELECT COUNT(*) as total_menu_items 
FROM menu_items 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- 4. Orders count
SELECT 'ORDERS COUNT' as section;
SELECT COUNT(*) as total_orders 
FROM orders 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';

-- 5. Sample customers (first 5)
SELECT 'SAMPLE CUSTOMERS' as section;
SELECT id, name, phone, email, "createdAt" 
FROM customers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
LIMIT 5;

-- 6. Sample menu items (first 5)
SELECT 'SAMPLE MENU ITEMS' as section;
SELECT id, "displayName", "displayNameEn", "menuPrice", "isActive" 
FROM menu_items 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
LIMIT 5;

-- 7. Sample orders (first 5)
SELECT 'SAMPLE ORDERS' as section;
SELECT id, "orderNumber", "orderDate", status, "totalAmount" 
FROM orders 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
LIMIT 5;

-- 8. Total data summary
SELECT 'DATA SUMMARY' as section;
SELECT 
    'dima' as tenant,
    (SELECT COUNT(*) FROM customers WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za') as customers,
    (SELECT COUNT(*) FROM menu_items WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za') as menu_items,
    (SELECT COUNT(*) FROM orders WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za') as orders,
    (SELECT COUNT(*) FROM items WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za') as inventory_items;
