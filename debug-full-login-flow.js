const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test';
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLogin() {
  try {
    console.log('🔍 Debugging login flow step by step\n');
    
    // Get all users with the test email
    const allUsers = await prisma.user.findMany({
      where: { email: 'alirezayousefi@dima.ir' },
      include: { tenant: true }
    });
    
    console.log('📋 All users with email "alirezayousefi@dima.ir":');
    console.log('   Found:', allUsers.length, 'user(s)\n');
    
    allUsers.forEach((user, idx) => {
      console.log(`   User #${idx + 1}:`);
      console.log(`     - ID: ${user.id}`);
      console.log(`     - tenantId: ${user.tenantId}`);
      console.log(`     - Tenant name: ${user.tenant?.displayName || 'NO TENANT'}`);
      console.log(`     - Active: ${user.active}`);
      console.log(`     - Password hash: ${user.password.substring(0, 20)}...`);
    });
    
    console.log('\n💡 Key Issue:');
    console.log('When login is called with NO tenantId (universal mode):');
    console.log('  findFirst({ where: { email } })');
    console.log('  This should find the user across all tenants.');
    console.log('\nWhen login is called WITH tenantId:');
    console.log('  findFirst({ where: { email, tenantId } })');
    console.log('  This finds the user only in that specific tenant.');
    
    console.log('\n🧪 Simulating what happens in login:\n');
    
    // Simulate the login call WITHOUT tenantId (universal mode)
    console.log('1️⃣  Calling: prisma.user.findFirst({ where: { email } })');
    const universalUser = await prisma.user.findFirst({
      where: { email: 'alirezayousefi@dima.ir' },
      include: { tenant: true }
    });
    
    if (universalUser) {
      console.log('   ✅ Found user:', universalUser.email);
      console.log('      Tenant ID:', universalUser.tenantId);
      console.log('      Tenant Name:', universalUser.tenant?.displayName);
      
      // Now test password comparison
      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare('manager123', universalUser.password);
      console.log('\n2️⃣  Testing password comparison:');
      console.log('   Password hash match:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('   ❌ Password does NOT match - This is the issue!');
      } else {
        console.log('   ✅ Password matches correctly');
      }
    } else {
      console.log('   ❌ User NOT found in universal search');
    }
    
    console.log('\n📍 Analysis:');
    console.log('If findFirst() worked and password matched, login would succeed.');
    console.log('If findFirst() returned null, we\'d see "Email or password incorrect".');
    console.log('If password didn\'t match, we\'d see "Email or password incorrect".');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
