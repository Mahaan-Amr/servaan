const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function cleanupMigrations() {
  console.log('\n🔍 CHECKING MIGRATION STATUS\n');
  
  // List all migrations in the database
  const migrations = await prisma.$queryRaw`
    SELECT id, migration_name, finished_at, rolled_back_at, started_at, logs
    FROM "_prisma_migrations"
    ORDER BY started_at DESC
  `;
  
  console.log(`📋 Total migrations in database: ${migrations.length}\n`);
  
  // Find ghost migrations
  const ghostMigrations = migrations.filter(m => 
    m.migration_name.includes('20250127000000') || 
    m.migration_name.includes('20250910124830')
  );
  
  console.log(`👻 Ghost migrations found: ${ghostMigrations.length}`);
  ghostMigrations.forEach(m => {
    console.log(`  - ${m.migration_name}`);
  });
  
  if (ghostMigrations.length > 0) {
    console.log('\n🔧 Attempting to delete ghost migrations...');
    const deleteCount = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name LIKE '%20250127000000%' 
         OR migration_name LIKE '%20250910124830%'
    `;
    console.log(`✅ Deleted ${deleteCount} ghost migration entries\n`);
  }
  
  process.exit(0);
}

cleanupMigrations().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
