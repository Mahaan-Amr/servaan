import { PrismaClient } from '../../../shared/generated/client';
import fs from 'fs';
import path from 'path';

async function main() {
  const prisma = new PrismaClient();
  const sqlPath = path.resolve(__dirname, '../../../prisma/sql/admin_enums.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Execute statements individually to avoid prepared statement multi-command error
  const statements = sql.split(/;\s*(?=\n|$)/).map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  await prisma.$disconnect();
  console.log('Admin enums fixed');
}

main().catch((e) => { console.error(e); process.exit(1); });


