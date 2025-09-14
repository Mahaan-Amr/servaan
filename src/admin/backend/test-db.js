const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count tenants
    const tenantCount = await prisma.tenant.count();
    console.log(`📊 Total tenants in database: ${tenantCount}`);
    
    // Get first few tenants
    const tenants = await prisma.tenant.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true,
        plan: true
      }
    });
    
    console.log('📋 Sample tenants:');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.subdomain}) - ${tenant.isActive ? 'Active' : 'Inactive'} - ${tenant.plan}`);
    });
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    // Count orders
    const orderCount = await prisma.order.count();
    console.log(`🛒 Total orders in database: ${orderCount}`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
