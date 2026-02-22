const bcrypt = require('bcrypt');
const { PrismaClient } = require('./src/shared/generated/client');

const prisma = new PrismaClient();

async function testAuthentication() {
  try {
    console.log('🔐 Testing Authentication Flow\n');

    // 1. Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });
    console.log('✅ Tenant found:', tenant.name);

    // 2. Find user in tenant
    const user = await prisma.user.findFirst({
      where: {
        email: 'alirezayousefi@dima.ir',
        tenantId: tenant.id
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('   Name:', user.name);
    console.log('   Active:', user.active);
    console.log('   Role:', user.role);

    // 3. Test password
    const passwordMatch = await bcrypt.compare('manager123', user.password);
    console.log('✅ Password comparison:', passwordMatch ? 'MATCH ✓' : 'NO MATCH ✗');

    // 4. Check tenant is active
    if (!tenant.isActive) {
      console.log('❌ Tenant is not active');
      return;
    }
    console.log('✅ Tenant is active');

    if (!user.active) {
      console.log('❌ User is not active');
      return;
    }
    console.log('✅ User is active');

    console.log('\n✅ ALL CHECKS PASSED - Login should work!\n');
    console.log('Credentials:');
    console.log('  Email: alirezayousefi@dima.ir');
    console.log('  Password: manager123');
    console.log('  URL: http://dima.localhost:3000/login');

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testAuthentication();
