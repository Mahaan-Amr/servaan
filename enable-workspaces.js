const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function enableWorkspaces() {
  console.log('\n🔧 ENABLING WORKSPACES FOR DIMA TENANT\n');
  
  try {
    // Get dima tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' },
      include: { features: true }
    });
    
    if (!tenant) {
      console.log('❌ Dima tenant not found!');
      process.exit(1);
    }
    
    console.log(`📍 Found tenant: ${tenant.name} (${tenant.id})\n`);
    
    // Check if features exist, if not create them
    let features;
    if (!tenant.features) {
      console.log('📋 Creating tenant features...\n');
      features = await prisma.tenantFeatures.create({
        data: {
          tenantId: tenant.id,
          hasInventoryManagement: true,
          hasCustomerManagement: true,
          hasAccountingSystem: false,
          hasReporting: true,
          hasNotifications: true,
          hasAdvancedReporting: true,
          hasApiAccess: true,
          hasCustomBranding: false,
          hasMultiLocation: false,
          hasAdvancedCRM: false,
          hasWhatsappIntegration: false,
          hasInstagramIntegration: false,
          hasAnalyticsBI: true
        }
      });
    } else {
      console.log('📋 Updating existing tenant features...\n');
      features = await prisma.tenantFeatures.update({
        where: { tenantId: tenant.id },
        data: {
          hasInventoryManagement: true,
          hasCustomerManagement: true,
          hasAccountingSystem: false,
          hasReporting: true,
          hasNotifications: true,
          hasAdvancedReporting: true,
          hasApiAccess: true,
          hasCustomBranding: false,
          hasMultiLocation: false,
          hasAdvancedCRM: false,
          hasWhatsappIntegration: false,
          hasInstagramIntegration: false,
          hasAnalyticsBI: true
        }
      });
    }
    
    console.log('✅ WORKSPACE FEATURES ENABLED:\n');
    console.log('✅ Inventory Management');
    console.log('✅ Customer Management');
    console.log('✅ Business Intelligence');
    console.log('✅ Reporting');
    console.log('✅ Advanced Reporting');
    console.log('✅ Notifications');
    console.log('✅ API Access');
    
    console.log('\n❌ DISABLED (Not seeded):');
    console.log('❌ Accounting System');
    console.log('❌ Custom Branding');
    console.log('❌ Multi-Location');
    console.log('❌ Advanced CRM');
    console.log('❌ WhatsApp Integration');
    console.log('❌ Instagram Integration');
    
    console.log('\n🎉 WORKSPACE CONFIGURATION UPDATED\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

enableWorkspaces();
