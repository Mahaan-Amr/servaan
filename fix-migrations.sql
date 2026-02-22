DELETE FROM "_prisma_migrations" 
WHERE migration LIKE '%20250127000000%' 
   OR migration LIKE '%20250910124830%';

SELECT COUNT(*) as remaining_migrations FROM "_prisma_migrations";
