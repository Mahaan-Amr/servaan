-- Dima Tenant Menu Analysis
-- Tenant ID: cmelrmijr0000lzaoy61yy2za

-- 1. Menu Categories for Dima
SELECT 'DIMA MENU CATEGORIES' as section;
SELECT 
    id, 
    name, 
    "displayName", 
    "displayOrder", 
    "isActive", 
    "createdAt"
FROM menu_categories 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
ORDER BY "displayOrder";

-- 2. Menu Items for Dima
SELECT 'DIMA MENU ITEMS' as section;
SELECT 
    id, 
    "displayName", 
    "displayNameEn", 
    "menuPrice", 
    "isActive", 
    "isFeatured", 
    "isSpicy", 
    "isVegetarian", 
    "isNew",
    "prepTime",
    "calories"
FROM menu_items 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
ORDER BY "displayOrder";

-- 3. Menu Items with Categories
SELECT 'DIMA MENU ITEMS WITH CATEGORIES' as section;
SELECT 
    mi."displayName" as item_name,
    mi."displayNameEn" as item_name_english,
    mc.name as category_name,
    mc."displayName" as category_display_name,
    mi."menuPrice" as price,
    mi."isActive" as active,
    mi."isFeatured" as featured,
    mi."isSpicy" as spicy,
    mi."isVegetarian" as vegetarian,
    mi."isNew" as new_item
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi."categoryId" = mc.id
WHERE mi."tenantId" = 'cmelrmijr0000lzaoy61yy2za' 
ORDER BY mc."displayOrder", mi."displayOrder";

-- 4. Summary Statistics
SELECT 'DIMA MENU SUMMARY' as section;
SELECT 
    'dima' as tenant,
    COUNT(DISTINCT mc.id) as total_categories,
    COUNT(DISTINCT mi.id) as total_menu_items,
    COUNT(DISTINCT CASE WHEN mi."isActive" = true THEN mi.id END) as active_menu_items,
    COUNT(DISTINCT CASE WHEN mi."isFeatured" = true THEN mi.id END) as featured_items,
    COUNT(DISTINCT CASE WHEN mi."isSpicy" = true THEN mi.id END) as spicy_items,
    COUNT(DISTINCT CASE WHEN mi."isVegetarian" = true THEN mi.id END) as vegetarian_items,
    COUNT(DISTINCT CASE WHEN mi."isNew" = true THEN mi.id END) as new_items,
    AVG(mi."menuPrice") as average_price
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi."categoryId" AND mi."tenantId" = 'cmelrmijr0000lzaoy61yy2za'
WHERE mc."tenantId" = 'cmelrmijr0000lzaoy61yy2za';
