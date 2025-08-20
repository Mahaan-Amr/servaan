const { PrismaClient } = require('../shared/generated/client');

async function checkTenant() {
  const prisma = new PrismaClient();
  
  try {
    // Check tenant
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'cafe-golestan' }
    });
    
    console.log('🏪 Tenant:', tenant?.name);
    console.log('📋 Tenant ID:', tenant?.id);
    
    // Check tenant features separately
    const features = await prisma.tenantFeatures.findFirst({
      where: { tenantId: tenant?.id }
    });
    
    console.log('\n📋 Tenant Features:');
    if (features) {
      console.log('- hasInventoryManagement:', features.hasInventoryManagement);
      console.log('- hasCustomerManagement:', features.hasCustomerManagement);
      console.log('- hasAccountingSystem:', features.hasAccountingSystem);
      console.log('- hasAnalyticsBI:', features.hasAnalyticsBI);
      console.log('- hasAdvancedCRM:', features.hasAdvancedCRM);
    } else {
      console.log('❌ No tenant features found!');
    }
    
    // Check if ordering data exists
    const orderCount = await prisma.order.count();
    const tableCount = await prisma.table.count();
    const menuCount = await prisma.menuItem.count();
    
    console.log('\n📊 Ordering System Data:');
    console.log('- Orders:', orderCount);
    console.log('- Tables:', tableCount);
    console.log('- Menu Items:', menuCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant(); 