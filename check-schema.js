const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function checkSchema() {
  console.log('\n🔍 ANALYZING DATABASE SCHEMA\n');
  
  // Check InventoryEntry columns
  console.log('📋 InventoryEntry columns in database:');
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'InventoryEntry'
    ORDER BY ordinal_position
  `;
  
  console.table(result);
  
  console.log('\n✅ Schema check complete\n');
  process.exit(0);
}

checkSchema().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
