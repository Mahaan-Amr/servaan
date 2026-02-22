const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenant() {
  try {
    console.log('🔍 Checking existing dima tenant\n');
    
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });
    
    if (tenant) {
      console.log('✅ Found existing dima tenant:');
      console.log(JSON.stringify(tenant, null, 2));
    } else {
      console.log('❌ No dima tenant exists');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();
