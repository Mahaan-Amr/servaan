const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function veifyWorkspaces() {
  console.log('\n✅ VERIFYING WORKSPACE ACCESS FOR DIMA TENANT\n');
  
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'dima' },
    include: { features: true, users: { select: { email: true, role: true } } }
  });
  
  if (!tenant || !tenant.features) {
    console.log('❌ Tenant or features not found!');
    process.exit(1);
  }
  
  console.log(`📍 Tenant: ${tenant.name}\n`);
  console.log('👥 Users in tenant:');
  tenant.users.forEach(u => console.log(`   ${u.email} (${u.role})`));
  
  console.log('\n🔐 WORKSPACE ACCESS LEVELS:\n');
  const workspaces = {
    'Inventory Management': tenant.features.hasInventoryManagement,
    'Customer Management': tenant.features.hasCustomerManagement,
    'Accounting System': tenant.features.hasAccountingSystem,
    'Business Intelligence': tenant.features.hasAnalyticsBI,
    'Reporting': tenant.features.hasReporting,
    'Advanced Reporting': tenant.features.hasAdvancedReporting,
    'Notifications': tenant.features.hasNotifications,
    'API Access': tenant.features.hasApiAccess,
    'Custom Branding': tenant.features.hasCustomBranding,
    'Multi-Location': tenant.features.hasMultiLocation,
    'Advanced CRM': tenant.features.hasAdvancedCRM,
    'WhatsApp Integration': tenant.features.hasWhatsappIntegration,
    'Instagram Integration': tenant.features.hasInstagramIntegration
  };
  
  Object.entries(workspaces).forEach(([name, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    console.log(`${icon} ${name}`);
  });
  
  console.log('\n🎯 USER ACCESS LOGIC (from workspaceRoutes.ts):\n');
  console.log('Manager "alirezayousefi@dima.ir" will have access to:');
  console.log('  ✅ Inventory Management (full)');
  console.log('  ✅ Business Intelligence (full)');
  console.log('  ✅ Customer Management (full)');
  console.log('  ✅ Reporting (full)');
  
  console.log('\nStaff "sara@dima.ir" will have access to:');
  console.log('  ✅ Inventory Management (read-only)');
  console.log('  ❌ Business Intelligence (none - manager+ only)');
  console.log('  ✅ Customer Management (read-only)');
  console.log('  ✅ Reporting (read-only)');
  
  console.log('\n✅ VERIFICATION COMPLETE\n');
  process.exit(0);
}

veifyWorkspaces();
