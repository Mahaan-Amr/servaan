const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleTenants() {
  try {
    console.log('Creating sample tenants...');
    
    // Check if tenants already exist
    const existingTenants = await prisma.tenant.count();
    console.log(`Existing tenants: ${existingTenants}`);
    
    if (existingTenants > 0) {
      console.log('Tenants already exist, skipping creation');
      return;
    }
    
    // Create sample tenants
    const sampleTenants = [
      {
        subdomain: 'shayan',
        name: 'رستوران شایان',
        displayName: 'رستوران شایان',
        description: 'رستوران سنتی ایرانی',
        plan: 'PREMIUM',
        isActive: true,
        maxUsers: 20,
        maxItems: 5000,
        maxCustomers: 1000,
        ownerName: 'احمد شایان',
        ownerEmail: 'ahmad@shayan.com',
        ownerPhone: '09123456789',
        businessType: 'رستوران',
        city: 'تهران',
        country: 'ایران'
      },
      {
        subdomain: 'tehran-cafe',
        name: 'کافه تهران',
        displayName: 'کافه تهران',
        description: 'کافه مدرن در قلب تهران',
        plan: 'STARTER',
        isActive: true,
        maxUsers: 10,
        maxItems: 2000,
        maxCustomers: 500,
        ownerName: 'مریم احمدی',
        ownerEmail: 'maryam@tehran-cafe.com',
        ownerPhone: '09123456788',
        businessType: 'کافه',
        city: 'تهران',
        country: 'ایران'
      },
      {
        subdomain: 'fastfood-chain',
        name: 'فست فود زنجیره‌ای',
        displayName: 'فست فود زنجیره‌ای',
        description: 'زنجیره فست فود در سراسر کشور',
        plan: 'ENTERPRISE',
        isActive: true,
        maxUsers: 50,
        maxItems: 10000,
        maxCustomers: 5000,
        ownerName: 'علی رضایی',
        ownerEmail: 'ali@fastfood-chain.com',
        ownerPhone: '09123456787',
        businessType: 'فست فود',
        city: 'تهران',
        country: 'ایران'
      }
    ];
    
    for (const tenantData of sampleTenants) {
      const tenant = await prisma.tenant.create({
        data: tenantData
      });
      console.log(`Created tenant: ${tenant.name} (${tenant.subdomain})`);
    }
    
    console.log('✅ Sample tenants created successfully');
    
  } catch (error) {
    console.error('❌ Error creating sample tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTenants();
