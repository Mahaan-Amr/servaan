const dotenv = require('dotenv');
const path = require('path');
const bcryptjs = require('bcryptjs');

// Load backend env
dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPasswordDirectly() {
  try {
    console.log('🔍 Finding admin@dima.ir in production database\n');
    
    // Get the admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@dima.ir' },
      include: { tenant: true }
    });
    
    if (!admin) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Tenant:', admin.tenant?.displayName);
    console.log('   Password hash:', admin.password.substring(0, 30) + '...');
    console.log('');
    
    // Test password comparison
    console.log('🔐 Testing password...');
    
    const testPassword = 'admin123';
    const isMatch = await bcryptjs.compare(testPassword, admin.password);
    
    console.log(`   Password "${testPassword}" matches: ${isMatch ? '✅ YES' : '❌ NO'}`);
    
    if (isMatch) {
      console.log('\n🎉 YOU CAN LOGIN WITH:');
      console.log('   URL: http://dima.localhost:3000/login');
      console.log('   Email: admin@dima.ir');
      console.log('   Password: admin123');
    } else {
      console.log('\n⚠️ Password does not match. Trying other passwords...');
      
      // Try some common passwords
      const commonPasswords = ['Admin@123', 'admin', 'password', 'admin@dima', 'dima123'];
      for (const pass of commonPasswords) {
        const match = await bcryptjs.compare(pass, admin.password);
        if (match) {
          console.log(`\n✅ FOUND IT! Password is: "${pass}"`);
          console.log('\n🎉 YOU CAN LOGIN WITH:');
          console.log('   URL: http://dima.localhost:3000/login');
          console.log('   Email: admin@dima.ir');
          console.log(`   Password: ${pass}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordDirectly();
