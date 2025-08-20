const { PrismaClient } = require('../shared/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'colorless'
});

async function main() {
  console.log('🌱 Quick tenant seeding with inventory data...');
  
  // Clear existing data in order
  await prisma.inventoryEntry.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.customer.deleteMany({});
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
  const adminUser = await prisma.user.create({
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

  // Create a manager user
  const managerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'فاطمه احمدی',
      email: 'fateme@cafe-golestan.ir',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      phoneNumber: '09123456790',
      lastLogin: new Date(),
      active: true
    }
  });

  console.log('🏪 Creating inventory items...');

  // Coffee & Beverages
  const espressoBean = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'دانه قهوه اسپرسو',
      category: 'قهوه',
      unit: 'کیلوگرم',
      minStock: 10,
      description: 'دانه قهوه اسپرسو درجه یک ایتالیایی',
      barcode: '8901234567890',
      isActive: true
    }
  });

  const arabicaCoffee = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'دانه قهوه عربیکا',
      category: 'قهوه',
      unit: 'کیلوگرم',
      minStock: 8,
      description: 'دانه قهوه عربیکا کلمبیایی',
      barcode: '8901234567891',
      isActive: true
    }
  });

  const teaBags = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'تی بگ چای سیاه',
      category: 'چای',
      unit: 'بسته',
      minStock: 20,
      description: 'تی بگ چای سیاه سیلان',
      barcode: '8901234567892',
      isActive: true
    }
  });

  const greenTea = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'چای سبز',
      category: 'چای',
      unit: 'بسته',
      minStock: 15,
      description: 'چای سبز ژاپنی',
      barcode: '8901234567893',
      isActive: true
    }
  });

  // Dairy Products
  const milk = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'شیر تازه',
      category: 'لبنیات',
      unit: 'لیتر',
      minStock: 50,
      description: 'شیر تازه پاستوریزه',
      barcode: '8901234567894',
      isActive: true
    }
  });

  const cream = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'خامه',
      category: 'لبنیات',
      unit: 'لیتر',
      minStock: 10,
      description: 'خامه طبخ',
      barcode: '8901234567895',
      isActive: true
    }
  });

  // Pastries & Food
  const croissant = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'کروسان',
      category: 'شیرینی',
      unit: 'عدد',
      minStock: 30,
      description: 'کروسان کره‌ای تازه',
      barcode: '8901234567896',
      isActive: true
    }
  });

  const muffin = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'مافین بلوبری',
      category: 'شیرینی',
      unit: 'عدد',
      minStock: 25,
      description: 'مافین بلوبری خانگی',
      barcode: '8901234567897',
      isActive: true
    }
  });

  const sandwich = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'ساندویچ کلاب',
      category: 'غذا',
      unit: 'عدد',
      minStock: 20,
      description: 'ساندویچ کلاب با مرغ و سبزیجات',
      barcode: '8901234567898',
      isActive: true
    }
  });

  // Disposables
  const paperCups = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'لیوان کاغذی',
      category: 'یکبار مصرف',
      unit: 'بسته',
      minStock: 5,
      description: 'لیوان کاغذی 16 اونسی',
      barcode: '8901234567899',
      isActive: true
    }
  });

  const napkins = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'دستمال کاغذی',
      category: 'یکبار مصرف',
      unit: 'بسته',
      minStock: 10,
      description: 'دستمال کاغذی سفید',
      barcode: '8901234567900',
      isActive: true
    }
  });

  // Syrups & Flavors
  const vanillaSyrup = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'شربت وانیل',
      category: 'شربت',
      unit: 'بطری',
      minStock: 8,
      description: 'شربت وانیل طبیعی',
      barcode: '8901234567901',
      isActive: true
    }
  });

  const caramelSyrup = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'شربت کارامل',
      category: 'شربت',
      unit: 'بطری',
      minStock: 8,
      description: 'شربت کارامل خانگی',
      barcode: '8901234567902',
      isActive: true
    }
  });

  // Sugar & Sweeteners
  const sugar = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'شکر سفید',
      category: 'شیرین کننده',
      unit: 'کیلوگرم',
      minStock: 20,
      description: 'شکر سفید خالص',
      barcode: '8901234567903',
      isActive: true
    }
  });

  const brownSugar = await prisma.item.create({
    data: {
      tenantId: tenant.id,
      name: 'شکر قهوه‌ای',
      category: 'شیرین کننده',
      unit: 'کیلوگرم',
      minStock: 15,
      description: 'شکر قهوه‌ای طبیعی',
      barcode: '8901234567904',
      isActive: true
    }
  });

  console.log('📦 Creating inventory entries...');

  // Create initial stock entries (IN)
  const stockEntries = [
    { item: espressoBean, quantity: 25, unitPrice: 450000 },
    { item: arabicaCoffee, quantity: 20, unitPrice: 380000 },
    { item: teaBags, quantity: 50, unitPrice: 25000 },
    { item: greenTea, quantity: 30, unitPrice: 35000 },
    { item: milk, quantity: 100, unitPrice: 15000 },
    { item: cream, quantity: 25, unitPrice: 28000 },
    { item: croissant, quantity: 80, unitPrice: 8000 },
    { item: muffin, quantity: 60, unitPrice: 12000 },
    { item: sandwich, quantity: 40, unitPrice: 25000 },
    { item: paperCups, quantity: 20, unitPrice: 45000 },
    { item: napkins, quantity: 25, unitPrice: 18000 },
    { item: vanillaSyrup, quantity: 15, unitPrice: 65000 },
    { item: caramelSyrup, quantity: 15, unitPrice: 65000 },
    { item: sugar, quantity: 50, unitPrice: 22000 },
    { item: brownSugar, quantity: 30, unitPrice: 28000 }
  ];

  for (const entry of stockEntries) {
    await prisma.inventoryEntry.create({
      data: {
        itemId: entry.item.id,
        quantity: entry.quantity,
        type: 'IN',
        unitPrice: entry.unitPrice,
        note: 'موجودی اولیه',
        userId: adminUser.id
      }
    });
  }

  // Create some consumption entries (OUT) to simulate usage
  const consumptionEntries = [
    { item: espressoBean, quantity: 3, days: 1 },
    { item: milk, quantity: 25, days: 1 },
    { item: croissant, quantity: 15, days: 1 },
    { item: muffin, quantity: 8, days: 1 },
    { item: paperCups, quantity: 2, days: 1 },
    { item: teaBags, quantity: 5, days: 2 },
    { item: arabicaCoffee, quantity: 2, days: 2 },
    { item: cream, quantity: 3, days: 2 },
    { item: sandwich, quantity: 6, days: 2 },
    { item: napkins, quantity: 1, days: 3 },
    { item: sugar, quantity: 5, days: 3 },
    { item: vanillaSyrup, quantity: 1, days: 3 }
  ];

  for (const entry of consumptionEntries) {
    const date = new Date();
    date.setDate(date.getDate() - entry.days);
    
    await prisma.inventoryEntry.create({
      data: {
        itemId: entry.item.id,
        quantity: entry.quantity,
        type: 'OUT',
        note: 'مصرف روزانه',
        userId: managerUser.id,
        createdAt: date
      }
    });
  }

  // Create some recent restock entries
  const restockEntries = [
    { item: milk, quantity: 50, unitPrice: 15200, days: 1 },
    { item: croissant, quantity: 40, unitPrice: 8500, days: 2 },
    { item: muffin, quantity: 30, unitPrice: 12500, days: 2 }
  ];

  for (const entry of restockEntries) {
    const date = new Date();
    date.setDate(date.getDate() - entry.days);
    
    await prisma.inventoryEntry.create({
      data: {
        itemId: entry.item.id,
        quantity: entry.quantity,
        type: 'IN',
        unitPrice: entry.unitPrice,
        note: 'تامین مجدد',
        userId: adminUser.id,
        createdAt: date
      }
    });
  }

  console.log('👥 Creating customers...');

  // Create some customers
  const customers = [
    {
      name: 'علی احمدی',
      email: 'ali.ahmadi@email.com',
      phone: '09121234567',
      address: 'تهران، میدان تجریش'
    },
    {
      name: 'سارا محمدی',
      email: 'sara.mohammadi@email.com',
      phone: '09122345678',
      address: 'تهران، خیابان کریمخان'
    },
    {
      name: 'حسن رضایی',
      email: 'hasan.rezaei@email.com',
      phone: '09123456789',
      address: 'تهران، خیابان آزادی'
    },
    {
      name: 'مریم جعفری',
      email: 'maryam.jafari@email.com',
      phone: '09124567890',
      address: 'تهران، میدان ونک'
    },
    {
      name: 'رضا کریمی',
      email: 'reza.karimi@email.com',
      phone: '09125678901',
      address: 'تهران، خیابان شریعتی'
    }
  ];

  // Create customers (commented out for now)
  /*
  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        ...customer,
        phoneNormalized: customer.phone.replace(/\D/g, ''), // Remove non-digits for normalized phone
        isActive: true
      }
    });
  }
  */

  console.log('📱 Creating SMS test data...');

  // Create test SMS history records
  const smsRecords = [
    // Today's messages
    {
      phoneNumber: '09051305165',
      message: 'خوش آمدید به کافه گلستان. لطفا برای تکمیل ثبت نام روی لینک زیر کلیک کنید.',
      messageType: 'INVITATION',
      status: 'SENT',
      sentAt: new Date(),
      creditUsed: 1,
      costAmount: 10,
      metadata: { campaign: 'welcome' }
    },
    {
      phoneNumber: '09121234567',
      message: 'سلام علی عزیز! موجودی شما در کافه گلستان: 50 امتیاز. از خرید بعدی 10% تخفیف دریافت کنید.',
      messageType: 'PROMOTIONAL',
      status: 'SENT',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      creditUsed: 1,
      costAmount: 10,
      metadata: { promotion: 'loyalty_discount' }
    },
    {
      phoneNumber: '09122345678',
      message: 'کد تایید شما: 1234',
      messageType: 'VERIFICATION',
      status: 'SENT',
      sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      creditUsed: 1,
      costAmount: 10,
      metadata: { code: '1234' }
    },
    // Yesterday's messages
    {
      phoneNumber: '09123456789',
      message: 'هشدار: موجودی دان قهوه عربیکا کم شده است.',
      messageType: 'LOW_STOCK_ALERT',
      status: 'SENT',
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      creditUsed: 1,
      costAmount: 10,
      metadata: { item: 'arabica_coffee' }
    },
    {
      phoneNumber: '09124567890',
      message: 'سلام مریم! امروز تخفیف ویژه 20% روی تمام نوشیدنی‌های گرم داریم.',
      messageType: 'PROMOTIONAL',
      status: 'SENT',
      sentAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 1 day ago
      creditUsed: 1,
      costAmount: 10,
      metadata: { promotion: 'hot_drinks_discount' }
    },
    // Failed message example
    {
      phoneNumber: '09999999999',
      message: 'این پیام ارسال نشد',
      messageType: 'PROMOTIONAL',
      status: 'FAILED',
      failedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      creditUsed: 0,
      costAmount: 0,
      errorMessage: 'شماره نامعتبر',
      metadata: { error: 'invalid_number' }
    }
  ];

  // Insert SMS records
  for (const sms of smsRecords) {
    await prisma.smsHistory.create({
      data: {
        tenantId: tenant.id,
        sentBy: adminUser.id,
        ...sms
      }
    });
  }

  console.log('✅ Enhanced seeding completed successfully!');
  console.log('🏪 Tenant: کافه گلستان (cafe-golestan.servaan.ir)');
  console.log('🔐 Admin Login: ahmad@cafe-golestan.ir / admin123');
  console.log('🔐 Manager Login: fateme@cafe-golestan.ir / manager123');
  console.log('📦 Created 15 inventory items with realistic stock levels');
  console.log('📋 Created inventory transactions (IN/OUT entries)');
  console.log('📱 Created 6 SMS history records for testing');
  console.log('👥// Skipped customer creation');
  console.log('💡 Dashboard now has realistic data to work with!');
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
