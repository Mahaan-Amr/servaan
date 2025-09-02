-- Show dima tenant suppliers
SELECT 'DIMA SUPPLIERS' as info;

SELECT id, name, "contactPerson", phone, email, "createdAt"
FROM suppliers 
WHERE "tenantId" = 'cmelrmijr0000lzaoy61yy2za';
