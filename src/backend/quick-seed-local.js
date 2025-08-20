const { PrismaClient } = require('../shared/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Quick tenant seeding...');
  
  // Clear existing data
  await prisma.user.deleteMany({});
  await prisma.tenantFeatures.deleteMany({});
  await prisma.tenant.deleteMany({});
  
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      subdomain: 'cafe-golestan',
      name: 'کافه گلستان',
      displayName: 'کافه گلستان',
      description: 'کافه‌ای دنج در قلب تهران',
      plan: 'BUSINESS',
      isActive: true,
      maxUsers: 15,
      maxItems: 5000,
      maxCustomers: 2000,
      ownerName: 'احمد رضایی',
      ownerEmail: 'ahmad@cafe-golestan.ir',
      ownerPhone: '09123456789',
      businessType: 'کافه',
      address: 'تهران، خیابان ولیعصر، پلاک 125',
      city: 'تهران',
      state: 'تهران',
      country: 'Iran'
    }
  });
  
  // Create tenant features
  await prisma.tenantFeatures.create({
    data: {
      tenantId: tenant.id,
      hasInventoryManagement: true,
      hasCustomerManagement: true,
      hasAccountingSystem: true,
      hasReporting: true,
      hasNotifications: true,
      hasAdvancedReporting: true,
      hasApiAccess: false,
      hasCustomBranding: true,
      hasMultiLocation: false,
      hasAdvancedCRM: true,
      hasWhatsappIntegration: false,
      hasInstagramIntegration: false,
      hasAnalyticsBI: true
    }
  });
  
  // Create admin user
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'احمد رضایی',
      email: 'ahmad@cafe-golestan.ir',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      phoneNumber: '09123456789',
      lastLogin: new Date(),
      active: true
    }
  });
  
  console.log('✅ Tenant created successfully!');
  console.log('🏪 Tenant: کافه گلستان (cafe-golestan.servaan.ir)');
  console.log('🔐 Login: ahmad@cafe-golestan.ir / admin123');
  console.log('💡 You can now test the multi-tenant system!');
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 