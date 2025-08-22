const { PrismaClient } = require('./shared/generated/client');
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
        name: 'Admin User',
        email: ownerEmail,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        tenantId: tenant.id,
        phoneNumber: '+989123456789',
      },
    });

    console.log(`✅ Admin user created with ID: ${user.id}`);

    // Create default business preset
    const businessPreset = await prisma.businessPreset.create({
      data: {
        name: 'Default Cafe Setup',
        description: 'Default configuration for cafe business',
        tenantId: tenant.id,
        isDefault: true,
        discountEnabled: false,
        taxEnabled: true,
        taxPercentage: 9,
        serviceEnabled: true,
        servicePercentage: 10,
        courierEnabled: false,
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
          displayOrder: categories.indexOf(category) + 1,
        },
      });
    }

    console.log(`✅ Created ${categories.length} menu categories`);

    // Create default tables
    const tables = [
      { tableNumber: '1', tableName: 'میز 1', capacity: 4, status: 'AVAILABLE' },
      { tableNumber: '2', tableName: 'میز 2', capacity: 4, status: 'AVAILABLE' },
      { tableNumber: '3', tableName: 'میز 3', capacity: 6, status: 'AVAILABLE' },
      { tableNumber: '4', tableName: 'میز 4', capacity: 2, status: 'AVAILABLE' },
      { tableNumber: '5', tableName: 'میز 5', capacity: 8, status: 'AVAILABLE' },
    ];

    for (const table of tables) {
      await prisma.table.create({
        data: {
          tableNumber: table.tableNumber,
          tableName: table.tableName,
          capacity: table.capacity,
          status: table.status,
          isActive: true,
          tenantId: tenant.id,
          floor: 1,
        },
      });
    }

    console.log(`✅ Created ${tables.length} tables`);

    // Create default chart of accounts
    const accounts = [
      { accountCode: `${subdomain}-1000`, accountName: 'دارایی‌های جاری', accountNameEn: 'Current Assets', accountType: 'ASSET', normalBalance: 'DEBIT' },
      { accountCode: `${subdomain}-2000`, accountName: 'بدهی‌های جاری', accountNameEn: 'Current Liabilities', accountType: 'LIABILITY', normalBalance: 'CREDIT' },
      { accountCode: `${subdomain}-3000`, accountName: 'سرمایه', accountNameEn: 'Equity', accountType: 'EQUITY', normalBalance: 'CREDIT' },
      { accountCode: `${subdomain}-4000`, accountName: 'درآمد', accountNameEn: 'Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT' },
      { accountCode: `${subdomain}-5000`, accountName: 'هزینه‌ها', accountNameEn: 'Expenses', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
    ];

    for (const account of accounts) {
      await prisma.chartOfAccount.create({
        data: {
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountNameEn: account.accountNameEn,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          isActive: true,
          tenantId: tenant.id,
          level: 1,
        },
      });
    }

    console.log(`✅ Created ${accounts.length} chart of accounts`);

    // Create tenant features to enable all workspaces
    const tenantFeatures = await prisma.tenantFeatures.create({
      data: {
        tenantId: tenant.id,
        hasInventoryManagement: true,
        hasCustomerManagement: true,
        hasAccountingSystem: true,
        hasReporting: true,
        hasNotifications: true,
        hasAdvancedReporting: true,
        hasApiAccess: true,
        hasCustomBranding: true,
        hasMultiLocation: true,
        hasAdvancedCRM: true,
        hasWhatsappIntegration: true,
        hasInstagramIntegration: true,
        hasAnalyticsBI: true,
      },
    });

    console.log(`✅ Tenant features created with ID: ${tenantFeatures.id}`);

    // Create sample suppliers
    const suppliers = [
      { name: 'تأمین‌کننده قهوه', contactName: 'Coffee Supplier', phoneNumber: '+989123456789', email: 'coffee@supplier.com' },
      { name: 'تأمین‌کننده چای', contactName: 'Tea Supplier', phoneNumber: '+989123456790', email: 'tea@supplier.com' },
      { name: 'تأمین‌کننده شیرینی', contactName: 'Pastry Supplier', phoneNumber: '+989123456791', email: 'pastry@supplier.com' },
    ];

    for (const supplier of suppliers) {
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          contactName: supplier.contactName,
          phoneNumber: supplier.phoneNumber,
          email: supplier.email,
          isActive: true,
          tenantId: tenant.id,
        },
      });
    }

    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create sample items
    const items = [
      { name: 'قهوه ترک', category: 'قهوه', description: 'توضیحات قهوه ترک', minStock: 10 },
      { name: 'چای سیاه', category: 'چای', description: 'توضیحات چای سیاه', minStock: 15 },
      { name: 'کیک شکلاتی', category: 'دسر', description: 'توضیحات کیک شکلاتی', minStock: 5 },
      { name: 'ساندویچ مرغ', category: 'ساندویچ', description: 'توضیحات ساندویچ مرغ', minStock: 8 },
    ];

    for (const item of items) {
      await prisma.item.create({
        data: {
          name: item.name,
          category: item.category,
          description: item.description,
          minStock: item.minStock,
          isActive: true,
          tenantId: tenant.id,
          unit: 'عدد',
        },
      });
    }

    console.log(`✅ Created ${items.length} sample items`);

    console.log(`🎉 Tenant ${subdomain}.servaan.com setup completed successfully!`);
    console.log(`📧 Admin Email: ${ownerEmail}`);
    console.log(`🔑 Admin Password: ${ownerPassword}`);
    console.log(`🌐 Access URL: http://${subdomain}.servaan.com`);

    return tenant;
  } catch (error) {
    console.error(`❌ Error creating tenant ${subdomain}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting tenant creation process...');
    
    // Create main domain tenant: Servaan
    await createTenant('servaan', 'سِروان', 'admin@servaan.com', 'servaan123456');
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Create first tenant: Dima
    await createTenant('dima', 'دیما', 'admin@dima.servaan.com', 'dima123456');
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Create second tenant: Macheen
    await createTenant('macheen', 'مچین', 'admin@macheen.servaan.com', 'macheen123456');
    
    console.log('\n🎉 All tenants created successfully!');
    console.log('\n📋 Summary:');
    console.log('🏢 Servaan (سِروان): admin@servaan.com / servaan123456');
    console.log('🏢 Dima (دیما): admin@dima.servaan.com / dima123456');
    console.log('🏢 Macheen (مچین): admin@macheen.servaan.com / macheen123456');
    
  } catch (error) {
    console.error('❌ Fatal error during tenant creation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
