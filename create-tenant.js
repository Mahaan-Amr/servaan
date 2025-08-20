const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTenant(subdomain, name, ownerEmail, ownerPassword) {
  try {
    console.log(`🔄 Creating tenant: ${subdomain}.servaan.com`);
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        subdomain: subdomain,
        name: name,
        displayName: name,
        description: `Test tenant for ${name}`,
        ownerName: 'Admin User',
        ownerEmail: ownerEmail,
        ownerPhone: '+989123456789',
        businessType: 'Cafe',
        address: 'Test Address',
        city: 'Tehran',
        state: 'Tehran',
        country: 'Iran',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        currency: 'IRR',
        isActive: true,
        maxUsers: 10,
        maxItems: 2000,
        maxCustomers: 1000,
        plan: 'STARTER',
        planStartedAt: new Date(),
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    console.log(`✅ Tenant created with ID: ${tenant.id}`);

    // Create admin user
    const hashedPassword = await bcrypt.hash(ownerPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        tenantId: tenant.id,
        phone: '+989123456789',
        permissions: ['ALL'],
      },
    });

    console.log(`✅ Admin user created with ID: ${user.id}`);

    // Create default business preset
    const businessPreset = await prisma.businessPreset.create({
      data: {
        name: 'Default Cafe Setup',
        description: 'Default configuration for cafe business',
        tenantId: tenant.id,
        settings: {
          currency: 'IRR',
          timezone: 'Asia/Tehran',
          language: 'fa-IR',
          dateFormat: 'YYYY/MM/DD',
          timeFormat: 'HH:mm',
          taxRate: 9,
          serviceCharge: 10,
        },
      },
    });

    console.log(`✅ Business preset created with ID: ${businessPreset.id}`);

    // Create default menu categories
    const categories = [
      { name: 'قهوه', nameEn: 'Coffee', description: 'انواع قهوه' },
      { name: 'چای', nameEn: 'Tea', description: 'انواع چای' },
      { name: 'نوشیدنی', nameEn: 'Beverages', description: 'نوشیدنی‌های سرد' },
      { name: 'دسر', nameEn: 'Desserts', description: 'انواع دسر' },
      { name: 'ساندویچ', nameEn: 'Sandwiches', description: 'ساندویچ‌های مختلف' },
    ];

    for (const category of categories) {
      await prisma.menuCategory.create({
        data: {
          name: category.name,
          nameEn: category.nameEn,
          description: category.description,
          isActive: true,
          tenantId: tenant.id,
          sortOrder: categories.indexOf(category) + 1,
        },
      });
    }

    console.log(`✅ Created ${categories.length} menu categories`);

    // Create default tables
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        name: `میز ${i}`,
        nameEn: `Table ${i}`,
        capacity: i <= 4 ? 4 : 6,
        isActive: true,
        tenantId: tenant.id,
        status: 'AVAILABLE',
      });
    }

    for (const table of tables) {
      await prisma.table.create({
        data: table,
      });
    }

    console.log(`✅ Created ${tables.length} tables`);

    // Create default chart of accounts
    const accounts = [
      { code: '1000', name: 'دارایی‌های جاری', type: 'ASSET', category: 'CURRENT_ASSETS' },
      { code: '1100', name: 'موجودی نقد', type: 'ASSET', category: 'CASH' },
      { code: '1200', name: 'حساب‌های دریافتنی', type: 'ASSET', category: 'RECEIVABLES' },
      { code: '2000', name: 'بدهی‌های جاری', type: 'LIABILITY', category: 'CURRENT_LIABILITIES' },
      { code: '3000', name: 'سرمایه', type: 'EQUITY', category: 'OWNERS_EQUITY' },
      { code: '4000', name: 'درآمد', type: 'REVENUE', category: 'SALES_REVENUE' },
      { code: '5000', name: 'هزینه‌ها', type: 'EXPENSE', category: 'OPERATING_EXPENSES' },
    ];

    for (const account of accounts) {
      await prisma.chartOfAccount.create({
        data: {
          code: account.code,
          name: account.name,
          type: account.type,
          category: account.category,
          isActive: true,
          tenantId: tenant.id,
        },
      });
    }

    console.log(`✅ Created ${accounts.length} chart of accounts`);

    console.log(`🎉 Tenant ${subdomain}.servaan.com setup completed successfully!`);
    console.log(`📧 Admin Email: ${ownerEmail}`);
    console.log(`🔑 Admin Password: ${ownerPassword}`);
    console.log(`🌐 Access URL: https://${subdomain}.servaan.com`);
    
    return { tenant, user };
  } catch (error) {
    console.error(`❌ Error creating tenant ${subdomain}:`, error);
    throw error;
  }
}

// Create your two specific cafes
async function main() {
  try {
    console.log('🚀 Starting tenant creation process...');
    
    await createTenant('dima', 'دیما', 'admin@dima.com', 'DimaPass2024!');
    await createTenant('macheen', 'مچین', 'admin@macheen.com', 'MacheenPass2024!');
    
    console.log('🎉 All tenants created successfully!');
    
    // Show summary
    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();
    
    console.log('\n📊 Summary:');
    console.log(`   Tenants: ${tenantCount}`);
    console.log(`   Users: ${userCount}`);
    
    console.log('\n🌐 Access URLs:');
    console.log('   دیما: https://dima.servaan.com');
    console.log('   مچین: https://macheen.servaan.com');
    
    console.log('\n📧 Admin Credentials:');
    console.log('   دیما: admin@dima.com / DimaPass2024!');
    console.log('   مچین: admin@macheen.com / MacheenPass2024!');
    
  } catch (error) {
    console.error('❌ Fatal error during tenant creation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createTenant };
