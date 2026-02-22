const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test';
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function exactLoginFlow() {
  try {
    console.log('🔄 Simulating EXACT login flow from authService.ts\n');
    
    const email = 'alirezayousefi@dima.ir';
    const password = 'manager123';
    const tenantId = undefined; // No tenant specified = universal login
    
    console.log('📝 Login attempt:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   tenantId: ${tenantId} (undefined = universal login)`);
    console.log('');
    
    // This is the EXACT code from authService.ts loginUser()
    let user;
    
    if (tenantId) {
      console.log('ℹ️  tenantId specified, searching in specific tenant...');
      user = await prisma.user.findFirst({
        where: { 
          email,
          tenantId 
        },
        include: { tenant: true }
      });
    } else {
      console.log('ℹ️  No tenantId, universal search...');
      user = await prisma.user.findFirst({
        where: { email },
        include: { 
          tenant: {
            select: {
              id: true,
              subdomain: true,
              name: true,
              displayName: true,
              isActive: true
            }
          }
        }
      });
    }
    
    console.log(`\n🔎 Database lookup result: ${user ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (user) {
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Active: ${user.active}`);
      console.log(`   Password hash (first 20 chars): ${user.password.substring(0, 20)}...`);
      console.log(`   Tenant: ${user.tenant?.displayName}`);
      console.log(`   Tenant Active: ${user.tenant?.isActive}`);
    }
    
    // Now test the exact password comparison
    console.log('\n🔐 Password comparison:');
    console.log(`   Comparing bcryptjs.compare("${password}", hash)`);
    
    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;
    console.log(`   Result: ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    // Now check the exact condition from authService
    console.log('\n⚙️  Exact condition from authService:');
    console.log(`   if (!user || !(await bcrypt.compare(password, user.password)))`);
    console.log(`   !user = ${!user}`);
    console.log(`   !passwordMatch = ${!passwordMatch}`);
    console.log(`   Full condition = ${!user || !passwordMatch}`);
    
    if (!user || !passwordMatch) {
      console.log('\n   ❌ Would throw: "ایمیل یا رمز عبور اشتباه است" (401)');
    } else {
      console.log('\n   ✅ Would proceed with token generation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exactLoginFlow();
