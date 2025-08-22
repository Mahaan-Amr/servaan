const { PrismaClient } = require('./shared/generated/client');

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('🔍 Debugging users in database...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        active: true
      }
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Tenant: ${user.tenantId}`);
      console.log(`  - Active: ${user.active}`);
      console.log('  ---');
    });
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        subdomain: true,
        name: true
      }
    });
    
    console.log(`🏢 Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - ID: ${tenant.id}`);
      console.log(`  - Subdomain: ${tenant.subdomain}`);
      console.log(`  - Name: ${tenant.name}`);
      console.log('  ---');
    });
    
    // Get tenant features
    const tenantFeatures = await prisma.tenantFeatures.findMany({
      select: {
        tenantId: true,
        hasInventoryManagement: true,
        hasCustomerManagement: true,
        hasAccountingSystem: true,
        hasAnalyticsBI: true,
        hasAdvancedCRM: true,
        hasNotifications: true
      }
    });
    
    console.log(`⚙️ Found ${tenantFeatures.length} tenant feature sets:`);
    tenantFeatures.forEach(features => {
      console.log(`  - Tenant: ${features.tenantId}`);
      console.log(`  - Inventory: ${features.hasInventoryManagement}`);
      console.log(`  - CRM: ${features.hasCustomerManagement}`);
      console.log(`  - Accounting: ${features.hasAccountingSystem}`);
      console.log(`  - BI: ${features.hasAnalyticsBI}`);
      console.log(`  - Advanced CRM: ${features.hasAdvancedCRM}`);
      console.log(`  - Notifications: ${features.hasNotifications}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('❌ Error debugging users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();
