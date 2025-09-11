import { PrismaClient } from '../../../shared/generated/client';

async function main() {
  const prisma = new PrismaClient();
  // Alter enum columns to TEXT to match Prisma String mapping
  await prisma.$executeRawUnsafe('ALTER TABLE "admin_users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "system_health_metrics" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT');
  await prisma.$disconnect();
  console.log('Columns altered to TEXT');
}

main().catch((e) => { console.error(e); process.exit(1); });


