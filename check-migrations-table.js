const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function checkTable() {
  const cols = await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '_prisma_migrations'
  `;
  console.log('Columns in _prisma_migrations:');
  cols.forEach(c => console.log(`  - ${c.column_name}`));
  process.exit(0);
}

checkTable();
