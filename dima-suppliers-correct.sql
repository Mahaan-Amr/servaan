-- Show dima tenant suppliers with correct column names
SELECT 'DIMA SUPPLIERS' as info;

SELECT id, name, "contactName", "phoneNumber", email, address, "createdAt"
FROM suppliers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';
