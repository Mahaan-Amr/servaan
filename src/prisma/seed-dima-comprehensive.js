require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('../shared/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ log: ['error', 'warn'], errorFormat: 'colorless' });

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

// Generate realistic Persian names
const persianFirstNames = ['علی', 'محمد', 'حسن', 'حسین', 'رضا', 'احمد', 'مهدی', 'امیر', 'سعید', 'فرهاد', 'فاطمه', 'زهرا', 'مریم', 'سارا', 'نرگس', 'لیلا', 'سمیرا', 'نیلوفر'];
const persianLastNames = ['احمدی', 'محمدی', 'رضایی', 'کریمی', 'حسینی', 'موسوی', 'جعفری', 'نوری', 'صادقی', 'کاظمی', 'یوسفی', 'بیات', 'شریفی', 'قاسمی', 'رحمانی'];

function generatePersianName() {
  return `${randomFrom(persianFirstNames)} ${randomFrom(persianLastNames)}`;
}

function generatePhone() {
  return '0912' + randomInt(1000000, 9999999);
}

async function main() {
  console.log('🌱 Starting comprehensive seed for DIMA tenant...\n');

  // Find or create dima tenant
  let dimaTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'dima' }
  });

  if (!dimaTenant) {
    console.log('⚠️  Dima tenant not found. Creating...');
    dimaTenant = await prisma.tenant.create({
      data: {
        subdomain: 'dima',
        name: 'دیمه',
        displayName: 'رستوران دیمه',
        description: 'رستوران دیمه - سیستم مدیریت جامع',
        plan: 'BUSINESS',
        isActive: true,
        maxUsers: 50,
        maxItems: 20000,
        maxCustomers: 10000,
        ownerName: 'علی‌رضا یوسفی',
        ownerEmail: 'alirezayousefi@dima.ir',
        ownerPhone: '09123456789',
        businessType: 'رستوران',
        address: 'تهران، خیابان ولیعصر، پلاک 125',
        city: 'تهران',
        state: 'تهران',
        country: 'Iran'
      }
    });
    await prisma.tenantFeatures.create({
      data: {
        tenantId: dimaTenant.id,
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
  } else {
    console.log('✅ Found existing dima tenant');
  }

  const tenantId = dimaTenant.id;
  console.log(`📋 Tenant ID: ${tenantId}\n`);

  // Clean existing data for dima tenant (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data for dima tenant...');
  // Delete in proper order to respect foreign key constraints
  // Wrap in try-catch to handle tables that might not exist
  const deleteOperations = [
    () => prisma.reportExecution.deleteMany({ where: { tenantId } }),
    () => prisma.customReport.deleteMany({ where: { tenantId } }),
    () => prisma.bIReport.deleteMany({ where: { tenantId } }),
    () => prisma.bIDashboard.deleteMany({ where: { tenantId } }),
    () => prisma.bIInsight.deleteMany({ where: { tenantId } }),
    () => prisma.kitchenDisplay.deleteMany({ where: { tenantId } }),
    () => prisma.orderPayment.deleteMany({ where: { tenantId } }),
    () => prisma.orderItem.deleteMany({ where: { tenantId } }),
    () => prisma.orderModification.deleteMany({ where: { tenantId } }),
    () => prisma.orderOptions.deleteMany({ where: { tenantId } }),
    () => prisma.stockOverride.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.order.deleteMany({ where: { tenantId } }),
    () => prisma.tableReservation.deleteMany({ where: { tenantId } }),
    () => prisma.tableStatusLog.deleteMany({ where: { tenantId } }),
    () => prisma.table.deleteMany({ where: { tenantId } }),
    () => prisma.menuItemModifier.deleteMany({ where: { tenantId } }),
    () => prisma.recipeIngredient.deleteMany({ where: { tenantId } }),
    () => prisma.recipe.deleteMany({ where: { tenantId } }),
    () => prisma.menuItem.deleteMany({ where: { tenantId } }),
    () => prisma.menuCategory.deleteMany({ where: { tenantId } }),
    () => prisma.inventoryAuditEntry.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.inventoryAuditCycle.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.inventoryEntry.deleteMany({ where: { tenantId } }),
    () => prisma.itemSupplier.deleteMany({ where: { tenantId } }),
    () => prisma.scanHistory.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.item.deleteMany({ where: { tenantId } }),
    () => prisma.supplier.deleteMany({ where: { tenantId } }),
    () => prisma.customerLoyalty.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.loyaltyTransaction.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.customerVisit.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.customerFeedback.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.campaignDelivery.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.campaign.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.smsHistory.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.customer.deleteMany({ where: { tenantId } }),
    () => prisma.notification.deleteMany({ where: { tenantId } }).catch(() => {}), // Table might not exist
    () => prisma.user.deleteMany({ where: { tenantId } }) // Delete users last
  ];

  for (const op of deleteOperations) {
    try {
      await op();
    } catch (error) {
      // Ignore errors for tables that don't exist
      if (error.code !== 'P2021') {
        throw error;
      }
    }
  }
  console.log('✅ Cleaned existing data\n');

  // 1. Create Users
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      tenantId,
      name: 'علی‌رضا یوسفی',
      email: 'admin@dima.ir',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      phoneNumber: '09123456789',
      lastLogin: new Date(),
      active: true
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      tenantId,
      name: 'فاطمه احمدی',
      email: 'manager@dima.ir',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      phoneNumber: '09123456790',
      lastLogin: new Date(),
      active: true
    }
  });

  const staffUsers = [];
  for (let i = 0; i < 5; i++) {
    staffUsers.push(await prisma.user.create({
      data: {
        tenantId,
        name: generatePersianName(),
        email: `staff${i + 1}@dima.ir`,
        password: await bcrypt.hash('staff123', 10),
        role: 'STAFF',
        phoneNumber: generatePhone(),
        lastLogin: i % 2 === 0 ? new Date() : null,
        active: true
      }
    }));
  }
  console.log(`✅ Created ${2 + staffUsers.length} users\n`);

  // 2. Create Suppliers
  console.log('🏢 Creating suppliers...');
  const supplierNames = [
    'تامین قهوه ایران', 'بازرگانی چای گلستان', 'شیر و لبنیات تهران', 'نان و شیرینی بهار',
    'بسته‌بندی پارس', 'شیرین‌کننده سپید', 'کالاگستر', 'پخش مواد غذایی آریا',
    'پخش نوشیدنی خزر', 'پخش مواد اولیه البرز', 'پخش ظروف یکبارمصرف', 'پخش محصولات ارگانیک',
    'تامین گوشت و مرغ', 'پخش سبزیجات تازه', 'تامین ادویه‌جات', 'پخش نان و غلات'
  ];
  const suppliers = [];
  for (let i = 0; i < supplierNames.length; i++) {
    suppliers.push(await prisma.supplier.create({
      data: {
        tenantId,
        name: supplierNames[i],
        contactName: `مدیر ${supplierNames[i]}`,
        email: `supplier${i + 1}@example.com`,
        phoneNumber: generatePhone(),
        address: `تهران، منطقه ${i + 1}`,
        notes: 'تامین‌کننده معتبر',
        isActive: i % 5 !== 0
      }
    }));
  }
  console.log(`✅ Created ${suppliers.length} suppliers\n`);

  // 3. Create Items (Inventory)
  console.log('📦 Creating items...');
  const itemCategories = [
    'قهوه', 'چای', 'شیرینی', 'لبنیات', 'بسته‌بندی', 'شیرین کننده', 'نوشیدنی', 
    'میوه', 'غلات', 'گوشت', 'مرغ', 'سبزیجات', 'ادویه‌جات', 'نان', 'روغن'
  ];
  const units = ['کیلوگرم', 'بسته', 'لیتر', 'عدد', 'جعبه', 'پاکت', 'گرم'];
  
  const itemCatalog = [
    // Coffee items
    { name: 'قهوه اسپرسو ایتالیایی', category: 'قهوه', unit: 'کیلوگرم', minStock: 20, barcode: '890123450001' },
    { name: 'قهوه فرانسه برزیل', category: 'قهوه', unit: 'کیلوگرم', minStock: 15, barcode: '890123450002' },
    { name: 'قهوه ترک ممتاز', category: 'قهوه', unit: 'کیلوگرم', minStock: 10, barcode: '890123450003' },
    { name: 'کاپوچینو آماده', category: 'قهوه', unit: 'بسته', minStock: 30, barcode: '890123450004' },
    
    // Tea items
    { name: 'چای سیاه ممتاز', category: 'چای', unit: 'کیلوگرم', minStock: 25, barcode: '890123450005' },
    { name: 'چای سبز', category: 'چای', unit: 'کیلوگرم', minStock: 15, barcode: '890123450006' },
    { name: 'چای دارچین', category: 'چای', unit: 'کیلوگرم', minStock: 10, barcode: '890123450007' },
    { name: 'چای نعناع', category: 'چای', unit: 'کیلوگرم', minStock: 12, barcode: '890123450008' },
    
    // Dairy items
    { name: 'شیر پرچرب', category: 'لبنیات', unit: 'لیتر', minStock: 50, barcode: '890123450009' },
    { name: 'شیر کم چرب', category: 'لبنیات', unit: 'لیتر', minStock: 40, barcode: '890123450010' },
    { name: 'پنیر فتا', category: 'لبنیات', unit: 'کیلوگرم', minStock: 15, barcode: '890123450011' },
    { name: 'خامه صبحانه', category: 'لبنیات', unit: 'کیلوگرم', minStock: 10, barcode: '890123450012' },
    { name: 'کره', category: 'لبنیات', unit: 'کیلوگرم', minStock: 8, barcode: '890123450013' },
    
    // Sweets
    { name: 'کیک شکلاتی', category: 'شیرینی', unit: 'عدد', minStock: 20, barcode: '890123450014' },
    { name: 'کیک وانیلی', category: 'شیرینی', unit: 'عدد', minStock: 20, barcode: '890123450015' },
    { name: 'کیک میوه‌ای', category: 'شیرینی', unit: 'عدد', minStock: 15, barcode: '890123450016' },
    { name: 'کلوچه', category: 'شیرینی', unit: 'عدد', minStock: 30, barcode: '890123450017' },
    
    // Packaging
    { name: 'لیوان یکبار مصرف', category: 'بسته‌بندی', unit: 'بسته', minStock: 100, barcode: '890123450018' },
    { name: 'قاشق و چنگال یکبار مصرف', category: 'بسته‌بندی', unit: 'بسته', minStock: 80, barcode: '890123450019' },
    { name: 'دستمال کاغذی', category: 'بسته‌بندی', unit: 'بسته', minStock: 50, barcode: '890123450020' },
    { name: 'کیسه نایلونی', category: 'بسته‌بندی', unit: 'بسته', minStock: 60, barcode: '890123450021' },
    
    // Sweeteners
    { name: 'شکر سفید', category: 'شیرین کننده', unit: 'کیلوگرم', minStock: 50, barcode: '890123450022' },
    { name: 'عسل طبیعی', category: 'شیرین کننده', unit: 'کیلوگرم', minStock: 10, barcode: '890123450023' },
    { name: 'شکر قهوه‌ای', category: 'شیرین کننده', unit: 'کیلوگرم', minStock: 15, barcode: '890123450024' },
    
    // Beverages
    { name: 'آب معدنی', category: 'نوشیدنی', unit: 'بسته', minStock: 40, barcode: '890123450025' },
    { name: 'آبمیوه پرتقال', category: 'نوشیدنی', unit: 'بسته', minStock: 30, barcode: '890123450026' },
    { name: 'نوشابه', category: 'نوشیدنی', unit: 'بسته', minStock: 25, barcode: '890123450027' },
    
    // Fruits
    { name: 'سیب', category: 'میوه', unit: 'کیلوگرم', minStock: 20, barcode: '890123450028' },
    { name: 'موز', category: 'میوه', unit: 'کیلوگرم', minStock: 15, barcode: '890123450029' },
    { name: 'پرتقال', category: 'میوه', unit: 'کیلوگرم', minStock: 18, barcode: '890123450030' },
    
    // Grains
    { name: 'برنج ایرانی', category: 'غلات', unit: 'کیلوگرم', minStock: 30, barcode: '890123450031' },
    { name: 'جو پرک', category: 'غلات', unit: 'کیلوگرم', minStock: 15, barcode: '890123450032' },
    
    // Meat & Poultry
    { name: 'گوشت گوساله', category: 'گوشت', unit: 'کیلوگرم', minStock: 10, barcode: '890123450033' },
    { name: 'مرغ کامل', category: 'مرغ', unit: 'کیلوگرم', minStock: 12, barcode: '890123450034' },
    
    // Vegetables
    { name: 'پیاز', category: 'سبزیجات', unit: 'کیلوگرم', minStock: 20, barcode: '890123450035' },
    { name: 'گوجه فرنگی', category: 'سبزیجات', unit: 'کیلوگرم', minStock: 15, barcode: '890123450036' },
    { name: 'سیب زمینی', category: 'سبزیجات', unit: 'کیلوگرم', minStock: 25, barcode: '890123450037' },
    
    // Spices
    { name: 'زعفران', category: 'ادویه‌جات', unit: 'گرم', minStock: 5, barcode: '890123450038' },
    { name: 'زردچوبه', category: 'ادویه‌جات', unit: 'کیلوگرم', minStock: 3, barcode: '890123450039' },
    { name: 'فلفل سیاه', category: 'ادویه‌جات', unit: 'کیلوگرم', minStock: 2, barcode: '890123450040' },
    
    // Bread
    { name: 'نان بربری', category: 'نان', unit: 'عدد', minStock: 50, barcode: '890123450041' },
    { name: 'نان لواش', category: 'نان', unit: 'عدد', minStock: 40, barcode: '890123450042' },
    
    // Oil
    { name: 'روغن آفتابگردان', category: 'روغن', unit: 'لیتر', minStock: 20, barcode: '890123450043' },
    { name: 'روغن زیتون', category: 'روغن', unit: 'لیتر', minStock: 10, barcode: '890123450044' }
  ];

  const items = [];
  const itemSupplierLinks = [];
  
  for (let i = 0; i < itemCatalog.length; i++) {
    const itemData = itemCatalog[i];
    const item = await prisma.item.create({
      data: {
        tenantId,
        name: itemData.name,
        category: itemData.category,
        unit: itemData.unit,
        minStock: itemData.minStock,
        description: `${itemData.category} با کیفیت عالی`,
        barcode: itemData.barcode,
        isActive: true
      }
    });
    items.push(item);
    
    // Link items to suppliers
    const supplier = randomFrom(suppliers);
    itemSupplierLinks.push(await prisma.itemSupplier.create({
      data: {
        tenantId,
        itemId: item.id,
        supplierId: supplier.id,
        preferredSupplier: true,
        unitPrice: randomInt(10000, 500000)
      }
    }));
    
    // Some items have multiple suppliers
    if (i % 3 === 0) {
      const otherSupplier = randomFrom(suppliers.filter(s => s.id !== supplier.id));
      itemSupplierLinks.push(await prisma.itemSupplier.create({
        data: {
          tenantId,
          itemId: item.id,
          supplierId: otherSupplier.id,
          preferredSupplier: false,
          unitPrice: randomInt(10000, 500000)
        }
      }));
    }
  }
  console.log(`✅ Created ${items.length} items\n`);

  // 4. Create Inventory Entries with realistic dates (last 6 months)
  console.log('📊 Creating inventory entries...');
  const now = new Date();
  const sixMonthsAgo = addDays(now, -180);
  const itemStocks = {};
  
  // Initialize stock tracking
  items.forEach(item => {
    itemStocks[item.id] = 0;
  });

  // Create initial stock entries (6 months ago)
  for (const item of items) {
    const initialQty = randomInt(50, 200);
    const costPrice = randomInt(10000, 200000);
    
    await prisma.inventoryEntry.create({
      data: {
        tenantId,
        itemId: item.id,
        quantity: initialQty,
        type: 'IN',
        unitPrice: costPrice,
        note: 'ورود اولیه موجودی',
        userId: adminUser.id,
        createdAt: sixMonthsAgo,
        batchNumber: `BATCH-${item.id.substring(0, 8)}`
      }
    });
    itemStocks[item.id] += initialQty;
  }

  // Create regular IN entries (purchases) - weekly for high-demand items, monthly for others
  const highDemandItems = items.slice(0, 15); // First 15 items are high demand
  const mediumDemandItems = items.slice(15, 30);
  const lowDemandItems = items.slice(30);

  // High demand items: weekly purchases
  for (const item of highDemandItems) {
    for (let week = 0; week < 26; week++) { // 26 weeks = ~6 months
      const purchaseDate = addDays(sixMonthsAgo, week * 7 + randomInt(0, 6));
      const qty = randomInt(20, 50);
      const costPrice = randomInt(10000, 200000);
      
      await prisma.inventoryEntry.create({
        data: {
          tenantId,
          itemId: item.id,
          quantity: qty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'خرید هفتگی',
          userId: randomFrom([adminUser, managerUser]).id,
          createdAt: purchaseDate,
          batchNumber: `BATCH-${item.id.substring(0, 8)}-W${week}`
        }
      });
      itemStocks[item.id] += qty;
    }
  }

  // Medium demand items: bi-weekly purchases
  for (const item of mediumDemandItems) {
    for (let week = 0; week < 13; week++) { // 13 bi-weekly periods
      const purchaseDate = addDays(sixMonthsAgo, week * 14 + randomInt(0, 13));
      const qty = randomInt(15, 35);
      const costPrice = randomInt(10000, 200000);
      
      await prisma.inventoryEntry.create({
        data: {
          tenantId,
          itemId: item.id,
          quantity: qty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'خرید دو هفته‌ای',
          userId: randomFrom([adminUser, managerUser]).id,
          createdAt: purchaseDate,
          batchNumber: `BATCH-${item.id.substring(0, 8)}-W${week}`
        }
      });
      itemStocks[item.id] += qty;
    }
  }

  // Low demand items: monthly purchases
  for (const item of lowDemandItems) {
    for (let month = 0; month < 6; month++) {
      const purchaseDate = addDays(sixMonthsAgo, month * 30 + randomInt(0, 29));
      const qty = randomInt(10, 25);
      const costPrice = randomInt(10000, 200000);
      
      await prisma.inventoryEntry.create({
        data: {
          tenantId,
          itemId: item.id,
          quantity: qty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'خرید ماهانه',
          userId: randomFrom([adminUser, managerUser]).id,
          createdAt: purchaseDate,
          batchNumber: `BATCH-${item.id.substring(0, 8)}-M${month}`
        }
      });
      itemStocks[item.id] += qty;
    }
  }

  // Create OUT entries (sales/usage) - daily for high demand, less frequent for others
  // High demand: daily OUT
  for (const item of highDemandItems) {
    for (let day = 0; day < 180; day++) {
      const saleDate = addDays(sixMonthsAgo, day);
      const qty = randomInt(2, 8);
      const salePrice = randomInt(15000, 250000);
      
      if (itemStocks[item.id] >= qty) {
        await prisma.inventoryEntry.create({
          data: {
            tenantId,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش/استفاده روزانه',
            userId: randomFrom([...staffUsers, managerUser]).id,
            createdAt: saleDate
          }
        });
        itemStocks[item.id] -= qty;
      }
    }
  }

  // Medium demand: every 2-3 days
  for (const item of mediumDemandItems) {
    for (let day = 0; day < 60; day++) {
      const saleDate = addDays(sixMonthsAgo, day * 3 + randomInt(0, 2));
      const qty = randomInt(1, 4);
      const salePrice = randomInt(15000, 250000);
      
      if (itemStocks[item.id] >= qty) {
        await prisma.inventoryEntry.create({
          data: {
            tenantId,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش/استفاده',
            userId: randomFrom([...staffUsers, managerUser]).id,
            createdAt: saleDate
          }
        });
        itemStocks[item.id] -= qty;
      }
    }
  }

  // Low demand: weekly
  for (const item of lowDemandItems) {
    for (let week = 0; week < 26; week++) {
      const saleDate = addDays(sixMonthsAgo, week * 7 + randomInt(0, 6));
      const qty = randomInt(1, 3);
      const salePrice = randomInt(15000, 250000);
      
      if (itemStocks[item.id] >= qty) {
        await prisma.inventoryEntry.create({
          data: {
            tenantId,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش/استفاده هفتگی',
            userId: randomFrom([...staffUsers, managerUser]).id,
            createdAt: saleDate
          }
        });
        itemStocks[item.id] -= qty;
      }
    }
  }

  console.log(`✅ Created inventory entries\n`);

  // 5. Create Inventory Settings
  console.log('⚙️  Creating inventory settings...');
  await prisma.inventorySettings.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      allowNegativeStock: false
    }
  });
  console.log('✅ Created inventory settings\n');

  // Continue with Ordering System data in next part...
  // This is getting long, so I'll continue in the next message or create a separate continuation

  console.log('✅ Phase 1 Complete: Inventory Management data created!\n');
  console.log('📝 Next: Creating Ordering System data...\n');

  // 6. Create Customers
  console.log('👥 Creating customers...');
  const customers = [];
  for (let i = 0; i < 150; i++) {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: generatePersianName(),
        phone: generatePhone(),
        phoneNormalized: '+98' + generatePhone().substring(1),
        email: i % 3 === 0 ? `customer${i + 1}@mail.com` : null,
        address: i % 5 === 0 ? `تهران، منطقه ${i + 1}` : null,
        city: 'تهران',
        status: randomFrom(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']),
        segment: randomFrom(['NEW', 'OCCASIONAL', 'REGULAR', 'VIP']),
        isActive: true,
        createdBy: adminUser.id,
        createdAt: addDays(now, -randomInt(0, 180))
      }
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // 7. Create Tables
  console.log('🪑 Creating tables...');
  const tables = [];
  const sections = ['سالن اصلی', 'سالن VIP', 'تراس', 'اتاق خصوصی'];
  for (let i = 1; i <= 20; i++) {
    const table = await prisma.table.create({
      data: {
        tenantId,
        tableNumber: i.toString(),
        tableName: i <= 10 ? `میز ${i}` : null,
        capacity: randomInt(2, 8),
        status: randomFrom(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'OCCUPIED', 'RESERVED']),
        section: randomFrom(sections),
        floor: i <= 15 ? 1 : 2,
        isActive: true
      }
    });
    tables.push(table);
  }
  console.log(`✅ Created ${tables.length} tables\n`);

  // 8. Create Menu Categories
  console.log('📋 Creating menu categories...');
  const menuCategoriesData = [
    { name: 'نوشیدنی‌های گرم', nameEn: 'Hot Beverages', displayOrder: 1, color: '#8B4513' },
    { name: 'نوشیدنی‌های سرد', nameEn: 'Cold Beverages', displayOrder: 2, color: '#4169E1' },
    { name: 'صبحانه', nameEn: 'Breakfast', displayOrder: 3, color: '#FFD700' },
    { name: 'ناهار', nameEn: 'Lunch', displayOrder: 4, color: '#FF6347' },
    { name: 'شام', nameEn: 'Dinner', displayOrder: 5, color: '#9370DB' },
    { name: 'دسر', nameEn: 'Desserts', displayOrder: 6, color: '#FF69B4' },
    { name: 'سالاد', nameEn: 'Salads', displayOrder: 7, color: '#32CD32' },
    { name: 'ساندویچ', nameEn: 'Sandwiches', displayOrder: 8, color: '#FFA500' }
  ];

  const menuCategories = [];
  for (const catData of menuCategoriesData) {
    const category = await prisma.menuCategory.create({
      data: {
        tenantId,
        name: catData.name,
        nameEn: catData.nameEn,
        displayOrder: catData.displayOrder,
        color: catData.color,
        isActive: true
      }
    });
    menuCategories.push(category);
  }
  console.log(`✅ Created ${menuCategories.length} menu categories\n`);

  // 9. Create Menu Items (linked to Items where applicable)
  console.log('🍽️  Creating menu items...');
  // Track used items to avoid duplicate itemId
  const usedItemIds = new Set();
  
  const menuItemsData = [
    // Hot Beverages
    { name: 'اسپرسو', nameEn: 'Espresso', category: 0, price: 25000, itemId: items.find(i => i.name.includes('اسپرسو ایتالیایی'))?.id },
    { name: 'کاپوچینو', nameEn: 'Cappuccino', category: 0, price: 35000, itemId: items.find(i => i.name.includes('کاپوچینو آماده'))?.id },
    { name: 'لاته', nameEn: 'Latte', category: 0, price: 40000, itemId: items.find(i => i.name.includes('اسپرسو ایتالیایی'))?.id || null },
    { name: 'چای سیاه', nameEn: 'Black Tea', category: 0, price: 15000, itemId: items.find(i => i.name.includes('چای سیاه ممتاز'))?.id },
    { name: 'چای سبز', nameEn: 'Green Tea', category: 0, price: 20000, itemId: items.find(i => i.name.includes('چای سبز'))?.id },
    
    // Cold Beverages
    { name: 'آبمیوه پرتقال', nameEn: 'Orange Juice', category: 1, price: 30000, itemId: items.find(i => i.name.includes('آبمیوه پرتقال'))?.id },
    { name: 'نوشابه', nameEn: 'Soft Drink', category: 1, price: 20000, itemId: items.find(i => i.name.includes('نوشابه'))?.id },
    { name: 'آب معدنی', nameEn: 'Mineral Water', category: 1, price: 10000, itemId: items.find(i => i.name.includes('آب معدنی'))?.id },
    
    // Breakfast
    { name: 'صبحانه کامل', nameEn: 'Full Breakfast', category: 2, price: 120000, itemId: null },
    { name: 'املت', nameEn: 'Omelette', category: 2, price: 80000, itemId: null },
    { name: 'نان و پنیر', nameEn: 'Bread & Cheese', category: 2, price: 50000, itemId: items.find(i => i.name.includes('پنیر فتا'))?.id },
    
    // Lunch
    { name: 'کباب کوبیده', nameEn: 'Koobideh Kebab', category: 3, price: 180000, itemId: items.find(i => i.name.includes('گوشت گوساله'))?.id },
    { name: 'جوجه کباب', nameEn: 'Chicken Kebab', category: 3, price: 150000, itemId: items.find(i => i.name.includes('مرغ کامل'))?.id },
    { name: 'قورمه سبزی', nameEn: 'Ghormeh Sabzi', category: 3, price: 140000, itemId: null },
    
    // Dinner
    { name: 'استیک', nameEn: 'Steak', category: 4, price: 250000, itemId: items.find(i => i.name.includes('گوشت گوساله'))?.id || null },
    { name: 'ماهی قزل آلا', nameEn: 'Salmon', category: 4, price: 220000, itemId: null },
    
    // Desserts
    { name: 'کیک شکلاتی', nameEn: 'Chocolate Cake', category: 5, price: 60000, itemId: items.find(i => i.name.includes('کیک شکلاتی'))?.id },
    { name: 'بستنی', nameEn: 'Ice Cream', category: 5, price: 40000, itemId: null },
    
    // Salads
    { name: 'سالاد فصل', nameEn: 'Seasonal Salad', category: 6, price: 70000, itemId: null },
    { name: 'سالاد سزار', nameEn: 'Caesar Salad', category: 6, price: 90000, itemId: null },
    
    // Sandwiches
    { name: 'ساندویچ مرغ', nameEn: 'Chicken Sandwich', category: 7, price: 100000, itemId: items.find(i => i.name.includes('مرغ کامل'))?.id || null },
    { name: 'ساندویچ گوشت', nameEn: 'Beef Sandwich', category: 7, price: 120000, itemId: items.find(i => i.name.includes('گوشت گوساله'))?.id || null }
  ];

  const menuItems = [];
  for (let i = 0; i < menuItemsData.length; i++) {
    const menuItemData = menuItemsData[i];
    // Check if itemId is already used, if so set to null
    let itemId = menuItemData.itemId;
    if (itemId && usedItemIds.has(itemId)) {
      itemId = null; // Don't use duplicate itemId
    }
    if (itemId) {
      usedItemIds.add(itemId);
    }
    
    const menuItem = await prisma.menuItem.create({
      data: {
        tenantId,
        categoryId: menuCategories[menuItemData.category].id,
        itemId: itemId, // Use null if duplicate
        displayName: menuItemData.name,
        displayNameEn: menuItemData.nameEn,
        menuPrice: menuItemData.price,
        originalPrice: menuItemData.price * 1.1,
        displayOrder: i + 1,
        isActive: true,
        isFeatured: i < 5,
        prepTime: randomInt(5, 30),
        isAvailable: true
      }
    });
    menuItems.push(menuItem);
  }
  console.log(`✅ Created ${menuItems.length} menu items\n`);

  // 10. Create Orders with realistic dates and statuses
  console.log('📝 Creating orders...');
  const orderStatuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
  const orderTypes = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];
  const paymentMethods = ['CASH', 'CARD', 'ONLINE'];
  const paymentStatuses = ['PENDING', 'PARTIAL', 'PAID'];

  const orders = [];
  let orderNumber = 1;

  // Create orders for the last 90 days
  for (let day = 0; day < 90; day++) {
    const orderDate = addDays(now, -day);
    const ordersPerDay = randomInt(10, 30); // 10-30 orders per day

    for (let o = 0; o < ordersPerDay; o++) {
      const orderType = randomFrom(orderTypes);
      const customer = day % 3 === 0 ? randomFrom(customers) : null;
      const table = orderType === 'DINE_IN' ? randomFrom(tables) : null;
      
      // Create order items
      const numItems = randomInt(1, 5);
      const selectedMenuItems = [];
      for (let i = 0; i < numItems; i++) {
        selectedMenuItems.push(randomFrom(menuItems));
      }

      let subtotal = 0;
      const orderItemsData = selectedMenuItems.map((menuItem, idx) => {
        const quantity = randomInt(1, 3);
        const unitPrice = Number(menuItem.menuPrice);
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;
        return {
          menuItemId: menuItem.id,
          itemId: menuItem.itemId,
          itemName: menuItem.displayName,
          quantity,
          unitPrice,
          totalPrice,
          lineNumber: idx + 1
        };
      });

      const discountAmount = day % 5 === 0 ? subtotal * 0.1 : 0;
      const taxAmount = (subtotal - discountAmount) * 0.09;
      const serviceCharge = (subtotal - discountAmount) * 0.1;
      const totalAmount = subtotal - discountAmount + taxAmount + serviceCharge;

      const orderStatus = randomFrom(orderStatuses);
      const paymentStatus = orderStatus === 'COMPLETED' ? 'PAID' : randomFrom(paymentStatuses);
      const paymentMethod = paymentStatus === 'PAID' ? randomFrom(paymentMethods) : null;

      const order = await prisma.order.create({
        data: {
          tenantId,
          orderNumber: `ORD-${orderNumber.toString().padStart(6, '0')}`,
          orderType,
          status: orderStatus,
          customerId: customer?.id,
          customerName: customer?.name,
          customerPhone: customer?.phone,
          tableId: table?.id,
          guestCount: orderType === 'DINE_IN' ? randomInt(1, 6) : null,
          subtotal,
          discountAmount,
          taxAmount,
          serviceCharge,
          totalAmount,
          paymentStatus,
          paymentMethod,
          paidAmount: paymentStatus === 'PAID' ? totalAmount : (paymentStatus === 'PARTIAL' ? totalAmount * 0.5 : 0),
          orderDate,
          createdAt: orderDate,
          createdBy: randomFrom([...staffUsers, managerUser]).id,
          servedBy: orderStatus === 'SERVED' || orderStatus === 'COMPLETED' ? randomFrom(staffUsers).id : null,
          startedAt: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(orderStatus) ? addMinutes(orderDate, randomInt(5, 15)) : null,
          readyAt: ['READY', 'SERVED', 'COMPLETED'].includes(orderStatus) ? addMinutes(orderDate, randomInt(20, 45)) : null,
          servedAt: ['SERVED', 'COMPLETED'].includes(orderStatus) ? addMinutes(orderDate, randomInt(30, 60)) : null,
          completedAt: orderStatus === 'COMPLETED' ? addMinutes(orderDate, randomInt(45, 90)) : null,
          lastPaymentAt: paymentStatus === 'PAID' ? addMinutes(orderDate, randomInt(30, 90)) : null
        }
      });
      orders.push(order);
      orderNumber++;

      // Create order items
      for (const itemData of orderItemsData) {
        await prisma.orderItem.create({
          data: {
            tenant: {
              connect: { id: tenantId }
            },
            order: {
              connect: { id: order.id }
            },
            menuItem: itemData.menuItemId ? {
              connect: { id: itemData.menuItemId }
            } : undefined,
            item: itemData.itemId ? {
              connect: { id: itemData.itemId }
            } : undefined,
            itemName: itemData.itemName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.totalPrice,
            lineNumber: itemData.lineNumber,
            prepStatus: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(orderStatus) ? 'PREPARING' : 'DRAFT',
            prepStartedAt: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(orderStatus) ? addMinutes(orderDate, randomInt(5, 15)) : null,
            prepCompletedAt: ['READY', 'SERVED', 'COMPLETED'].includes(orderStatus) ? addMinutes(orderDate, randomInt(20, 40)) : null
          }
        });
      }

      // Create order options
      await prisma.orderOptions.create({
        data: {
          tenant: {
            connect: { id: tenantId }
          },
          order: {
            connect: { id: order.id }
          },
          discountEnabled: discountAmount > 0,
          discountType: discountAmount > 0 ? 'PERCENTAGE' : 'PERCENTAGE', // Cannot be null
          discountValue: discountAmount,
          taxEnabled: true,
          taxPercentage: 9.00,
          serviceEnabled: true,
          servicePercentage: 10.00
        }
      });

      // Create payments for paid orders
      if (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') {
        const processor = randomFrom([...staffUsers, managerUser]);
        await prisma.orderPayment.create({
          data: {
            tenant: {
              connect: { id: tenantId }
            },
            paymentNumber: `PAY-${order.id.substring(0, 8).toUpperCase()}`,
            order: {
              connect: { id: order.id }
            },
            amount: paymentStatus === 'PAID' ? totalAmount : totalAmount * 0.5,
            paymentMethod: paymentMethod || 'CASH', // Ensure paymentMethod is not null
            paymentStatus: paymentStatus === 'PAID' ? 'PAID' : 'PARTIAL',
            paymentDate: order.lastPaymentAt || orderDate,
            processedAt: order.lastPaymentAt || orderDate,
            processedByUser: {
              connect: { id: processor.id }
            }
          }
        });
      }
    }
  }

  console.log(`✅ Created ${orders.length} orders\n`);

  // 11. Create Ordering Settings
  console.log('⚙️  Creating ordering settings...');
  await prisma.orderingSettings.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      orderCreationEnabled: true,
      lockItemsWithoutStock: false,
      requireManagerConfirmationForNoStock: false
    }
  });
  console.log('✅ Created ordering settings\n');

  // 12. Create Recipes for menu items that have items
  console.log('👨‍🍳 Creating recipes...');
  const recipes = [];
  for (const menuItem of menuItems) {
    if (menuItem.itemId) {
      // Find related items for recipe
      const relatedItems = items.filter(item => 
        item.category === items.find(i => i.id === menuItem.itemId)?.category ||
        ['شیر', 'شکر', 'روغن'].some(ing => item.name.includes(ing))
      ).slice(0, 3);

      if (relatedItems.length > 0) {
        const recipe = await prisma.recipe.create({
          data: {
            tenantId,
            menuItemId: menuItem.id,
            name: `دستور پخت ${menuItem.displayName}`,
            description: `دستور پخت کامل برای ${menuItem.displayName}`,
            instructions: '1. آماده‌سازی مواد اولیه\n2. پخت و آماده‌سازی\n3. سرو',
            yield: randomInt(1, 5),
            prepTime: menuItem.prepTime || randomInt(10, 30),
            totalCost: randomInt(50000, 200000),
            costPerServing: randomInt(10000, 50000),
            isActive: true
          }
        });
        recipes.push(recipe);

        // Create recipe ingredients
        for (const ingredient of relatedItems) {
          await prisma.recipeIngredient.create({
            data: {
              tenantId,
              recipeId: recipe.id,
              itemId: ingredient.id,
              quantity: randomFloat(0.1, 2),
              unit: ingredient.unit,
              unitCost: randomInt(10000, 100000),
              totalCost: randomInt(10000, 200000),
              isOptional: Math.random() > 0.7
            }
          });
        }
      }
    }
  }
  console.log(`✅ Created ${recipes.length} recipes\n`);

  // 13. Create Menu Item Modifiers
  console.log('🔧 Creating menu item modifiers...');
  const modifierTemplates = [
    { name: 'اندازه بزرگ', nameEn: 'Large Size', price: 10000 },
    { name: 'اندازه کوچک', nameEn: 'Small Size', price: -5000 },
    { name: 'شیر اضافه', nameEn: 'Extra Milk', price: 5000 },
    { name: 'شکر اضافه', nameEn: 'Extra Sugar', price: 2000 },
    { name: 'بدون شکر', nameEn: 'No Sugar', price: 0 },
    { name: 'یخ اضافه', nameEn: 'Extra Ice', price: 0 },
    { name: 'بدون یخ', nameEn: 'No Ice', price: 0 }
  ];

  let modifierCount = 0;
  for (const menuItem of menuItems.slice(0, 15)) { // Add modifiers to first 15 items
    const numModifiers = randomInt(2, 4);
    const selectedModifiers = modifierTemplates.slice(0, numModifiers);
    
    for (const modTemplate of selectedModifiers) {
      await prisma.menuItemModifier.create({
        data: {
          tenantId,
          menuItemId: menuItem.id,
          name: modTemplate.name,
          nameEn: modTemplate.nameEn,
          additionalPrice: modTemplate.price,
          isRequired: false,
          maxQuantity: 1,
          displayOrder: modifierCount % numModifiers,
          isActive: true
        }
      });
      modifierCount++;
    }
  }
  console.log(`✅ Created ${modifierCount} menu item modifiers\n`);

  // 14. Create Table Reservations
  console.log('📅 Creating table reservations...');
  const reservations = [];
  for (let i = 0; i < 50; i++) {
    const reservationDate = addDays(now, randomInt(-30, 30)); // Past and future reservations
    const table = randomFrom(tables);
    const customer = randomFrom(customers);
    
    const reservation = await prisma.tableReservation.create({
      data: {
        tenantId,
        tableId: table.id,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        guestCount: randomInt(2, 6),
        reservationDate,
        duration: randomInt(60, 180),
        status: reservationDate < now ? randomFrom(['CONFIRMED', 'COMPLETED', 'CANCELLED']) : 'CONFIRMED',
        notes: i % 5 === 0 ? 'مهمان ویژه' : null,
        createdBy: randomFrom([...staffUsers, managerUser]).id,
        createdAt: addDays(reservationDate, -randomInt(1, 7))
      }
    });
    reservations.push(reservation);
  }
  console.log(`✅ Created ${reservations.length} table reservations\n`);

  // 15. Create Table Status Logs
  console.log('📝 Creating table status logs...');
  let logCount = 0;
  for (const table of tables) {
    const statuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'AVAILABLE'];
    let currentStatus = 'AVAILABLE';
    
    for (let i = 0; i < 20; i++) {
      const newStatus = statuses[i % statuses.length];
      if (newStatus !== currentStatus) {
        await prisma.tableStatusLog.create({
          data: {
            tenantId,
            tableId: table.id,
            oldStatus: currentStatus,
            newStatus,
            reason: `تغییر وضعیت میز ${table.tableNumber}`,
            changedBy: randomFrom([...staffUsers, managerUser]).id,
            changedAt: addDays(now, -randomInt(0, 30))
          }
        });
        currentStatus = newStatus;
        logCount++;
      }
    }
  }
  console.log(`✅ Created ${logCount} table status logs\n`);

  // 16. Create Kitchen Displays for recent orders
  console.log('🍳 Creating kitchen displays...');
  const recentOrders = orders.filter(o => 
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
  ).slice(0, 50);

  let displayCount = 0;
  for (const order of recentOrders) {
    const stations = ['گریل', 'سرد', 'دسر', 'نوشیدنی'];
    const station = randomFrom(stations);
    
    await prisma.kitchenDisplay.create({
      data: {
        tenantId,
        orderId: order.id,
        displayName: `نمایش ${order.orderNumber}`,
        station,
        status: order.status === 'PREPARING' ? 'PREPARING' : 'PENDING',
        priority: randomInt(0, 5),
        displayedAt: order.createdAt,
        startedAt: order.startedAt,
        completedAt: order.readyAt,
        estimatedTime: randomInt(15, 45)
      }
    });
    displayCount++;
  }
  console.log(`✅ Created ${displayCount} kitchen displays\n`);

  // 17. Create Order Modifications
  console.log('✏️  Creating order modifications...');
  const modifiedOrders = orders.filter(() => Math.random() > 0.8).slice(0, 100);
  let modificationCount = 0;

  for (const order of modifiedOrders) {
    const modificationTypes = ['ITEM_ADDED', 'ITEM_REMOVED', 'QUANTITY_CHANGED', 'DISCOUNT_APPLIED', 'NOTE_ADDED'];
    const modType = randomFrom(modificationTypes);
    
    await prisma.orderModification.create({
      data: {
        tenantId,
        orderId: order.id,
        modificationType: modType,
        description: `تغییر در سفارش: ${modType}`,
        previousData: { total: order.totalAmount },
        newData: { total: order.totalAmount * 0.9 },
        amountChange: order.totalAmount * -0.1,
        previousTotal: order.totalAmount,
        newTotal: order.totalAmount * 0.9,
        modifiedBy: randomFrom([...staffUsers, managerUser]).id,
        createdAt: addMinutes(order.createdAt, randomInt(5, 30))
      }
    });
    modificationCount++;
  }
  console.log(`✅ Created ${modificationCount} order modifications\n`);

  console.log('🎉 Comprehensive seed data creation completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${2 + staffUsers.length}`);
  console.log(`   - Suppliers: ${suppliers.length}`);
  console.log(`   - Items: ${items.length}`);
  console.log(`   - Inventory Entries: Created with realistic dates`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Tables: ${tables.length}`);
  console.log(`   - Menu Categories: ${menuCategories.length}`);
  console.log(`   - Menu Items: ${menuItems.length}`);
  console.log(`   - Recipes: ${recipes.length}`);
  console.log(`   - Menu Item Modifiers: ${modifierCount}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Table Reservations: ${reservations.length}`);
  console.log(`   - Table Status Logs: ${logCount}`);
  console.log(`   - Kitchen Displays: ${displayCount}`);
  console.log(`   - Order Modifications: ${modificationCount}`);
  console.log('\n✅ All data created successfully for DIMA tenant!');
  console.log('📅 Data spans the last 6 months with realistic dates and relationships!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

