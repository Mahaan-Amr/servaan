#!/usr/bin/env node

const { PrismaClient, InventoryEntryType, OrderStatus, OrderType, PaymentStatus, TableStatus, CustomerSegment, UserRole, MenuItemModifier } = require('../shared/generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Complete seed file for 'dima' tenant
 * Includes:
 * 1. Inventory Management: Suppliers, Items, ItemSuppliers, InventoryEntries
 * 2. Ordering System: Tables, MenuCategories, MenuItems, Orders, OrderItems, OrderPayments
 * 3. Business Intelligence: Sufficient data for BI calculations
 */

// Farsi names and data
const farsiSupplierNames = [
  'سپاهان تجارت',
  'الماس آذر',
  'خط سیمرغ',
  'پارسیان اردیبهشت',
  'کیمیا ترجمان',
  'نوید رستاخیز',
  'پیام سردار',
  'رنجبر حمایت',
  'طلوع بخشایش',
  'شاهرخ رشادت',
  'میثم اباذر',
  'رشیدان پهلوی'
];

const farsiItemNames = {
  خوراک: [
    'بریانی مرغ',
    'کباب کوبیده',
    'فیله میگو',
    'خوراک غلات',
    'تاس کباب',
    'جوجه کباب',
    'کباب شامی',
    'اسفند دیس',
    'کتلت گوشت'
  ],
  انواع_نوشیدنی: [
    'آب نعناع',
    'شربت خربزه',
    'آب مرجان',
    'درست نعناع',
    'نوشابه کادو'
  ],
  سالادها: [
    'سالاد شیرازی',
    'سالاد زعفرانی',
    'کرفس و لیمو',
    'سالاد ملون',
    'سالاد جا شده'
  ],
  حبوبات: [
    'برنج ایرانی',
    'لپه سفید',
    'مرغوبه',
    'ماش سفید'
  ],
  دریایی: [
    'ماهی کاسپی',
    'میگوی خلیج',
    'ماهی شامی',
    'خیار آب'
  ]
};

const menuCategoryNames = [
  { fa: 'گرمها', en: 'Main Dishes' },
  { fa: 'نوشیدنیها', en: 'Beverages' },
  { fa: 'سالادها', en: 'Salads' },
  { fa: 'پیش غذاها', en: 'Appetizers' },
  { fa: 'دسرها', en: 'Desserts' }
];

const customerNames = [
  'احمد محمدی',
  'فاطمه علی زاده',
  'حسن کاظمی',
  'مریم رحمتی',
  'علی اصغر',
  'نجمه خاقانی',
  'محمد رضا امین',
  'زهره موسوی',
  'رضا قنبری',
  'سارا شریفی',
  'سیروان حسینی',
  'نسرین خدایی',
  'بابک نیکبخت',
  'شهلا قادری',
  'اسماعیل اسدی',
  'اعظم مختاری',
  'جواد صفری',
  'دنیا فروزش',
  'محمود شجاعی',
  'لیلا طاهری',
  'علیرضا کریمی',
  'هانیه صفری',
  'امیرحسین ملک',
  'مهتاب زاهدی',
  'کامران فریدی',
  'پریا افضلی',
  'نیما یونسی',
  'نادیا ابراهیمی',
  'آرش مختاری',
  'سائیه بختیاری',
  'تاجدار قاسمی',
  'نادیا حجتی',
  'سید علی نقوی',
  'الناز قربانی',
  'شاهین نیاور',
  'هما موسوی',
  'جمشید شریفی',
  'آلوس غلامی',
  'بهرام رزاق',
  'نرگس عظیمی',
  'هاشم قره خانی',
  'رنگین فرهادی',
  'میلاد بهمن',
  'رویا شمس',
  'سامان فلاحی',
  'فاتن مسرور',
  'علیمرد خاقانی',
  'گل بابایی',
  'آرمان رضائی',
  'لقا قنادی'
];

function generatePhoneNumber() {
  const prefix = '+98';
  const areaCode = Math.floor(Math.random() * 30) + 910; // 910-939
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return `${prefix}${areaCode}${number}`;
}

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function createTenant() {
  console.log('Creating Tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      subdomain: 'dima',
      name: 'رستوران دیما',
      displayName: 'دیما',
      plan: 'STARTER',
      isActive: true,
      maxUsers: 50,
      maxItems: 5000,
      maxCustomers: 5000,
      ownerName: 'محمد علی سپهری',
      ownerEmail: 'owner@dima.ir',
      ownerPhone: '+989121234567',
      businessType: 'رستوران',
      address: 'تهران، خیابان والفجر',
      city: 'تهران',
      country: 'Iran',
      timezone: 'Asia/Tehran',
      locale: 'fa-IR',
      currency: 'TOMAN'
    }
  });

  console.log(`✓ Tenant created: ${tenant.subdomain}`);
  return tenant.id;
}

async function createTenantFeatures(tenantId) {
  console.log('Creating Tenant Features...');
  const features = await prisma.tenantFeatures.create({
    data: {
      tenantId,
      hasInventoryManagement: true,
      hasCustomerManagement: true,
      hasAccountingSystem: false,
      hasReporting: true,
      hasNotifications: true,
      hasAdvancedReporting: true,
      hasApiAccess: false,
      hasCustomBranding: true,
      hasMultiLocation: false,
      hasAdvancedCRM: false,
      hasWhatsappIntegration: false,
      hasInstagramIntegration: false,
      hasAnalyticsBI: true
    }
  });
  console.log('✓ Tenant Features created');
  return features;
}

async function createInventorySettings(tenantId) {
  console.log('Creating Inventory Settings...');
  const settings = await prisma.inventorySettings.create({
    data: {
      tenantId,
      allowNegativeStock: true
    }
  });
  console.log('✓ Inventory Settings created');
  return settings;
}

async function createOrderingSettings(tenantId) {
  console.log('Creating Ordering Settings...');
  const settings = await prisma.orderingSettings.create({
    data: {
      tenantId,
      orderCreationEnabled: true,
      lockItemsWithoutStock: false,
      requireManagerConfirmationForNoStock: false
    }
  });
  console.log('✓ Ordering Settings created');
  return settings;
}

async function createUsers(tenantId) {
  console.log('Creating Users...');
  const adminPassword = await bcrypt.hash('admin@dima123', 10);
  const staffPassword = await bcrypt.hash('staff@dima123', 10);

  const users = await prisma.user.createMany({
    data: [
      {
        tenantId,
        name: 'مدیر سیستم',
        email: 'admin@dima.ir',
        password: adminPassword,
        role: 'ADMIN',
        active: true,
        phoneNumber: '+989121234567'
      },
      {
        tenantId,
        name: 'مدیر رستوران',
        email: 'manager@dima.ir',
        password: adminPassword,
        role: 'MANAGER',
        active: true,
        phoneNumber: '+989129876543'
      },
      {
        tenantId,
        name: 'سرویس دهنده 1',
        email: 'staff1@dima.ir',
        password: staffPassword,
        role: 'STAFF',
        active: true,
        phoneNumber: '+989121111111'
      },
      {
        tenantId,
        name: 'سرویس دهنده 2',
        email: 'staff2@dima.ir',
        password: staffPassword,
        role: 'STAFF',
        active: true,
        phoneNumber: '+989122222222'
      }
    ]
  });

  console.log(`✓ ${users.count} Users created`);

  // Get first admin user for future references
  const adminUser = await prisma.user.findFirst({
    where: { tenantId, role: 'ADMIN' }
  });

  return adminUser;
}

async function createSuppliers(tenantId) {
  console.log('Creating Suppliers...');
  const suppliers = await prisma.supplier.createMany({
    data: farsiSupplierNames.map((name, index) => ({
      tenantId,
      name,
      contactName: `تماس گیر ${index + 1}`,
      email: `supplier${index + 1}@example.com`,
      phoneNumber: `+989${Math.floor(Math.random() * 900000000)
        .toString()
        .padStart(9, '0')}`,
      address: `تهران، خیابان ${index + 1}`,
      isActive: true
    }))
  });

  console.log(`✓ ${suppliers.count} Suppliers created`);

  const supplierList = await prisma.supplier.findMany({
    where: { tenantId }
  });

  return supplierList;
}

async function createItems(tenantId) {
  console.log('Creating Items...');
  const itemsData = [];

  // Create items from categories
  let itemCount = 0;
  for (const [category, names] of Object.entries(farsiItemNames)) {
    for (const name of names) {
      itemsData.push({
        tenantId,
        name,
        category,
        unit: 'کیلوگرم',
        description: `${name} با کیفیت عالی`,
        isActive: true,
        minStock: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : null,
        barcode: `8674${String(itemCount).padStart(10, '0')}`
      });
      itemCount++;
    }
  }

  // Add more items to reach 35
  while (itemsData.length < 35) {
    const randomCat = getRandomElement(Object.keys(farsiItemNames));
    itemsData.push({
      tenantId,
      name: `${randomCat} شماره ${itemsData.length}`,
      category: randomCat,
      unit: 'کیلوگرم',
      description: `آیتم بضاعت ${itemsData.length}`,
      isActive: true,
      minStock: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : null,
      barcode: `8674${String(itemsData.length).padStart(10, '0')}`
    });
  }

  // Take only 35 items
  const itemsToCreate = itemsData.slice(0, 35);

  const createdItems = await prisma.item.createMany({
    data: itemsToCreate
  });

  console.log(`✓ ${createdItems.count} Items created`);

  const items = await prisma.item.findMany({
    where: { tenantId },
    take: 35
  });

  return items;
}

async function createItemSuppliers(tenantId, items, suppliers) {
  console.log('Creating Item-Supplier relationships...');
  const itemSuppliers = [];

  for (const item of items) {
    const numSuppliers = Math.floor(Math.random() * 2) + 1; // 1-2 suppliers per item
    const selectedSuppliers = shuffleArray(suppliers).slice(0, numSuppliers);

    for (const supplier of selectedSuppliers) {
      itemSuppliers.push({
        tenantId,
        itemId: item.id,
        supplierId: supplier.id,
        preferredSupplier: Math.random() > 0.7,
        unitPrice: Math.floor(Math.random() * 500000) + 10000
      });
    }
  }

  const created = await prisma.itemSupplier.createMany({
    data: itemSuppliers,
    skipDuplicates: true
  });

  console.log(`✓ ${created.count} Item-Supplier relationships created`);
  return created;
}

async function createInventoryEntries(tenantId, items, adminUser) {
  console.log('Creating Inventory Entries (300+)...');
  const startDate = new Date('2024-09-01');
  const endDate = new Date('2024-12-24');
  const inventoryEntries = [];

  // Create 300+ transactions
  for (let i = 0; i < 300; i++) {
    const randomItem = getRandomElement(items);
    const entryType = Math.random() > 0.4 ? 'IN' : 'OUT';
    const quantity =
      entryType === 'IN'
        ? Math.floor(Math.random() * 50) + 10
        : Math.floor(Math.random() * 30) + 2;

    inventoryEntries.push({
      tenantId,
      itemId: randomItem.id,
      quantity,
      type: entryType,
      userId: adminUser.id,
      note:
        entryType === 'IN'
          ? `تامین از تهران - ${new Date().toLocaleDateString('fa-IR')}`
          : `فروش - ${new Date().toLocaleDateString('fa-IR')}`,
      createdAt: getRandomDate(startDate, endDate),
      unitPrice:
        entryType === 'IN'
          ? Math.floor(Math.random() * 100000) + 10000
          : undefined
    });
  }

  const created = await prisma.inventoryEntry.createMany({
    data: inventoryEntries
  });

  console.log(`✓ ${created.count} Inventory Entries created`);
  return created;
}

async function createTables(tenantId) {
  console.log('Creating Tables...');
  const tables = await prisma.table.createMany({
    data: [
      {
        tenantId,
        tableNumber: '1',
        tableName: 'میز ۱',
        capacity: 4,
        section: 'داخل',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '2',
        tableName: 'میز ۲',
        capacity: 4,
        section: 'داخل',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '3',
        tableName: 'میز ۳',
        capacity: 6,
        section: 'داخل',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '4',
        tableName: 'میز ۴',
        capacity: 4,
        section: 'بیرونی',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '5',
        tableName: 'میز ۵',
        capacity: 6,
        section: 'بیرونی',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '6',
        tableName: 'میز ۶',
        capacity: 4,
        section: 'داخل',
        floor: 2,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '7',
        tableName: 'میز ۷',
        capacity: 8,
        section: 'داخل',
        floor: 2,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '8',
        tableName: 'میز ۸',
        capacity: 4,
        section: 'سالن',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '9',
        tableName: 'میز ۹',
        capacity: 4,
        section: 'سالن',
        floor: 1,
        status: 'AVAILABLE'
      },
      {
        tenantId,
        tableNumber: '10',
        tableName: 'میز ۱۰',
        capacity: 6,
        section: 'سالن',
        floor: 1,
        status: 'AVAILABLE'
      }
    ]
  });

  console.log(`✓ ${tables.count} Tables created`);

  const tableList = await prisma.table.findMany({
    where: { tenantId }
  });

  return tableList;
}

async function createMenuCategories(tenantId) {
  console.log('Creating Menu Categories...');
  const categories = await prisma.menuCategory.createMany({
    data: menuCategoryNames.map((cat, index) => ({
      tenantId,
      name: cat.fa,
      nameEn: cat.en,
      description: `دسته بندی ${cat.fa}`,
      displayOrder: index,
      isActive: true,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][index]
    }))
  });

  console.log(`✓ ${categories.count} Menu Categories created`);

  const categories_list = await prisma.menuCategory.findMany({
    where: { tenantId },
    orderBy: { displayOrder: 'asc' }
  });

  return categories_list;
}

async function createMenuItems(tenantId, items, categories) {
  console.log('Creating Menu Items (10+ per category)...');
  const menuItems = [];
  const menuItemData = [
    // فرست course
    {
      categoryIdx: 0,
      displayName: 'بریانی مرغ طهری',
      description: 'برنج طهری با مرغ تازه و ادویه خاص',
      menuPrice: 95000
    },
    {
      categoryIdx: 0,
      displayName: 'کباب کوبیده',
      description: 'کباب کوبیده گوساله با سرخ کردگی عالی',
      menuPrice: 120000
    },
    {
      categoryIdx: 0,
      displayName: 'جوجه کباب',
      description: 'جوجه کباب مرغ با سالاد و برنج',
      menuPrice: 110000
    },
    {
      categoryIdx: 0,
      displayName: 'کباب شامی',
      description: 'کباب شامی گوشت و لپه',
      menuPrice: 85000
    },
    {
      categoryIdx: 0,
      displayName: 'فیله میگو',
      description: 'فیله میگو طازه با سس خاص',
      menuPrice: 180000
    },
    {
      categoryIdx: 0,
      displayName: 'تاس کباب',
      description: 'تاس کباب گوساله با زعفران',
      menuPrice: 130000
    },
    {
      categoryIdx: 0,
      displayName: 'ماهی قزل آلا',
      description: 'ماهی قزل آلا شام پخته',
      menuPrice: 140000
    },
    {
      categoryIdx: 0,
      displayName: 'خورش هویج',
      description: 'خورش هویج و گوشت گاو',
      menuPrice: 75000
    },
    {
      categoryIdx: 0,
      displayName: 'کتلت مرغ',
      description: 'کتلت مرغ خانگی',
      menuPrice: 65000
    },
    {
      categoryIdx: 0,
      displayName: 'استیک گاو',
      description: 'استیک گاو وارداتی',
      menuPrice: 200000
    },
    {
      categoryIdx: 0,
      displayName: 'خورش غلات',
      description: 'خورش غلات سنتی',
      menuPrice: 70000
    },
    // نوشیدنیها
    {
      categoryIdx: 1,
      displayName: 'آب نعناع تازه',
      description: 'آب نعناع خنک و تازه',
      menuPrice: 12000
    },
    {
      categoryIdx: 1,
      displayName: 'شربت خربزه',
      description: 'شربت خربزه خانگی',
      menuPrice: 15000
    },
    {
      categoryIdx: 1,
      displayName: 'آب لیمو',
      description: 'آب لیمو ترش و خنک',
      menuPrice: 10000
    },
    {
      categoryIdx: 1,
      displayName: 'چای سرد',
      description: 'چای سرد با یخ',
      menuPrice: 8000
    },
    {
      categoryIdx: 1,
      displayName: 'قهوه سرد',
      description: 'قهوه سرد اسپرسو',
      menuPrice: 18000
    },
    {
      categoryIdx: 1,
      displayName: 'آب میوه',
      description: 'آب میوه تازه',
      menuPrice: 20000
    },
    {
      categoryIdx: 1,
      displayName: 'کاکائو گرم',
      description: 'کاکائو گرم با شیر',
      menuPrice: 22000
    },
    {
      categoryIdx: 1,
      displayName: 'آب سوغات',
      description: 'نوشابه سوغات',
      menuPrice: 12000
    },
    {
      categoryIdx: 1,
      displayName: 'شیر دوغ',
      description: 'شیر دوغ محلی',
      menuPrice: 14000
    },
    {
      categoryIdx: 1,
      displayName: 'کمپوت میوه',
      description: 'کمپوت میوه خشک',
      menuPrice: 18000
    },
    // سالادها
    {
      categoryIdx: 2,
      displayName: 'سالاد شیرازی',
      description: 'سالاد شیرازی تازه',
      menuPrice: 35000
    },
    {
      categoryIdx: 2,
      displayName: 'سالاد زعفرانی',
      description: 'سالاد زعفرانی با مرغ',
      menuPrice: 45000
    },
    {
      categoryIdx: 2,
      displayName: 'سالاد میکس',
      description: 'سالاد سبزی میکس',
      menuPrice: 40000
    },
    {
      categoryIdx: 2,
      displayName: 'سالاد الویه',
      description: 'سالاد الویه سنتی',
      menuPrice: 38000
    },
    {
      categoryIdx: 2,
      displayName: 'سالاد کاهو',
      description: 'سالاد کاهو و گوجه',
      menuPrice: 32000
    },
    // پیش غذاها
    {
      categoryIdx: 3,
      displayName: 'تیکka پنیر',
      description: 'تیکه پنیر سفید',
      menuPrice: 25000
    },
    {
      categoryIdx: 3,
      displayName: 'شامی',
      description: 'شامی خوشمزه',
      menuPrice: 28000
    },
    {
      categoryIdx: 3,
      displayName: 'کوفته',
      description: 'کوفته گوشت',
      menuPrice: 32000
    },
    {
      categoryIdx: 3,
      displayName: 'خور هامور',
      description: 'خور ماهی هامور',
      menuPrice: 45000
    },
    {
      categoryIdx: 3,
      displayName: 'زیتون پرشده',
      description: 'زیتون پرشده گوشت',
      menuPrice: 38000
    },
    // دسرها
    {
      categoryIdx: 4,
      displayName: 'فالوده شیرازی',
      description: 'فالوده شیرازی سنتی',
      menuPrice: 28000
    },
    {
      categoryIdx: 4,
      displayName: 'کیک شکلاتی',
      description: 'کیک شکلاتی خانگی',
      menuPrice: 32000
    },
    {
      categoryIdx: 4,
      displayName: 'بستنی وانیلی',
      description: 'بستنی خانگی',
      menuPrice: 25000
    },
    {
      categoryIdx: 4,
      displayName: 'شیرینی خشک',
      description: 'شیرینی خشک متنوع',
      menuPrice: 35000
    },
    {
      categoryIdx: 4,
      displayName: 'حلوای ارده',
      description: 'حلوای ارده سنتی',
      menuPrice: 22000
    }
  ];

  for (const data of menuItemData) {
    menuItems.push({
      tenantId,
      itemId: getRandomElement(items).id,
      categoryId: categories[data.categoryIdx].id,
      displayName: data.displayName,
      displayNameEn: data.displayName,
      description: data.description,
      menuPrice: data.menuPrice,
      originalPrice: data.menuPrice,
      displayOrder: menuItemData.indexOf(data),
      isActive: true,
      isFeatured: Math.random() > 0.7,
      isVegetarian: Math.random() > 0.8,
      isNew: Math.random() > 0.9,
      prepTime: Math.floor(Math.random() * 30) + 10,
      cookingNotes: 'پخت حرفه ای'
    });
  }

  const created = await prisma.menuItem.createMany({
    data: menuItems
  });

  console.log(`✓ ${created.count} Menu Items created`);

  const menuItemsList = await prisma.menuItem.findMany({
    where: { tenantId },
    include: { category: true }
  });

  return menuItemsList;
}

async function createCustomers(tenantId) {
  console.log('Creating Customers (50+)...');
  const customers = await prisma.customer.createMany({
    data: customerNames.map((name, index) => ({
      tenantId,
      name,
      phone: generatePhoneNumber(),
      phoneNormalized: generatePhoneNumber(),
      email: `customer${index + 1}@example.com`,
      status: 'ACTIVE',
      segment: getRandomElement(['NEW', 'OCCASIONAL', 'REGULAR', 'VIP']),
      notes: `مشتری ${index + 1}`,
      createdBy: null, // Will be set after getting admin user
      isActive: true
    }))
  });

  console.log(`✓ ${customers.count} Customers created`);

  const customersList = await prisma.customer.findMany({
    where: { tenantId }
  });

  return customersList;
}

async function createOrders(tenantId, tables, menuItems, customers, adminUser) {
  console.log('Creating Orders (20+)...');
  const orders = [];
  const startDate = new Date('2024-10-01');
  const endDate = new Date('2024-12-24');

  for (let i = 1; i <= 25; i++) {
    const orderDate = getRandomDate(startDate, endDate);
    const subtotal = Math.floor(Math.random() * 500000) + 100000;
    const discountAmount = Math.floor(subtotal * (Math.random() > 0.7 ? Math.random() * 0.1 : 0));
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.09);
    const serviceCharge = Math.floor((subtotal - discountAmount) * 0.1);
    const totalAmount = subtotal - discountAmount + taxAmount + serviceCharge;

    orders.push({
      tenantId,
      orderNumber: `ORD-${String(i).padStart(5, '0')}`,
      orderType: getRandomElement(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
      status: getRandomElement(['COMPLETED', 'SERVED', 'CONFIRMED', 'PREPARING']),
      priority: Math.random() > 0.8 ? 1 : 0,
      customerId: Math.random() > 0.3 ? getRandomElement(customers).id : null,
      customerName: Math.random() > 0.5 ? getRandomElement(customerNames) : null,
      customerPhone: Math.random() > 0.5 ? generatePhoneNumber() : null,
      tableId: Math.random() > 0.4 ? getRandomElement(tables).id : null,
      guestCount: Math.floor(Math.random() * 6) + 1,
      subtotal,
      discountAmount,
      taxAmount,
      serviceCharge,
      totalAmount,
      paymentStatus: 'PAID',
      paymentMethod: getRandomElement(['CASH', 'CARD', 'ONLINE']),
      paidAmount: totalAmount,
      changeAmount: Math.random() > 0.8 ? Math.floor(Math.random() * 50000) : 0,
      orderDate,
      estimatedTime: Math.floor(Math.random() * 60) + 20,
      startedAt: new Date(orderDate.getTime() + Math.random() * 300000),
      readyAt: new Date(orderDate.getTime() + Math.random() * 1200000),
      servedAt: new Date(orderDate.getTime() + Math.random() * 1800000),
      completedAt: new Date(orderDate.getTime() + Math.random() * 3600000),
      createdBy: adminUser.id,
      servedBy: adminUser.id,
      notes: 'سفارش کامل',
      kitchenNotes: 'پخت عادی',
      allergyInfo: 'بدون حساسیت'
    });
  }

  const createdOrders = await prisma.order.createMany({
    data: orders
  });

  console.log(`✓ ${createdOrders.count} Orders created`);

  const ordersList = await prisma.order.findMany({
    where: { tenantId }
  });

  return ordersList;
}

async function createOrderItems(tenantId, orders, menuItems, adminUser) {
  console.log('Creating Order Items...');
  const orderItems = [];

  for (const order of orders) {
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per order
    const selectedItems = shuffleArray(menuItems).slice(0, numItems);

    for (let i = 0; i < selectedItems.length; i++) {
      const menuItem = selectedItems[i];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = menuItem.menuPrice;
      const totalPrice = unitPrice * quantity;

      orderItems.push({
        orderId: order.id,
        menuItemId: menuItem.id,
        itemId: menuItem.itemId,
        itemName: menuItem.displayName,
        itemCode: menuItem.id.substring(0, 8),
        quantity,
        unitPrice,
        totalPrice,
        prepStatus: 'COMPLETED',
        lineNumber: i + 1,
        tenantId
      });
    }
  }

  const created = await prisma.orderItem.createMany({
    data: orderItems
  });

  console.log(`✓ ${created.count} Order Items created`);
  return created;
}

async function createOrderPayments(tenantId, orders, adminUser) {
  console.log('Creating Order Payments...');
  const payments = [];

  for (const order of orders) {
    payments.push({
      tenantId,
      paymentNumber: `PAY-${order.orderNumber}`,
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'CASH',
      paymentStatus: 'PAID',
      transactionId: `TXN-${Math.random().toString(36).substring(2, 15)}`,
      referenceNumber: `REF-${Math.random().toString(36).substring(2, 15)}`,
      paymentDate: order.completedAt || new Date(),
      processedAt: order.completedAt || new Date(),
      processedBy: adminUser.id,
      retryCount: 0
    });
  }

  const created = await prisma.orderPayment.createMany({
    data: payments
  });

  console.log(`✓ ${created.count} Order Payments created`);
  return created;
}

async function createKitchenDisplays(tenantId, orders, adminUser) {
  console.log('Creating Kitchen Display entries...');
  const kdsEntries = [];

  for (const order of orders.slice(0, 15)) {
    kdsEntries.push({
      tenantId,
      orderId: order.id,
      displayName: 'شامل کد',
      station: 'آشپزخانه اصلی',
      status: 'COMPLETED',
      priority: Math.random() > 0.7 ? 1 : 0,
      displayedAt: order.startedAt || new Date(),
      startedAt: order.startedAt || new Date(),
      completedAt: order.readyAt || new Date(),
      estimatedTime: 30
    });
  }

  const created = await prisma.kitchenDisplay.createMany({
    data: kdsEntries
  });

  console.log(`✓ ${created.count} Kitchen Display entries created`);
  return created;
}

async function seed() {
  try {
    console.log('🌱 Starting seed for dima tenant...\n');

    // 1. Create tenant
    const tenantId = await createTenant();

    // 2. Create tenant features and settings
    await createTenantFeatures(tenantId);
    await createInventorySettings(tenantId);
    await createOrderingSettings(tenantId);

    // 3. Create users
    const adminUser = await createUsers(tenantId);

    // 4. Update customers with createdBy
    const customers = await createCustomers(tenantId);
    for (const customer of customers) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { createdBy: adminUser.id }
      });
    }

    // 5. Create inventory system
    const suppliers = await createSuppliers(tenantId);
    const items = await createItems(tenantId);
    await createItemSuppliers(tenantId, items, suppliers);
    await createInventoryEntries(tenantId, items, adminUser);

    // 6. Create ordering system
    const tables = await createTables(tenantId);
    const categories = await createMenuCategories(tenantId);
    const menuItems = await createMenuItems(tenantId, items, categories);
    const orders = await createOrders(tenantId, tables, menuItems, customers, adminUser);
    await createOrderItems(tenantId, orders, menuItems, adminUser);
    await createOrderPayments(tenantId, orders, adminUser);
    await createKitchenDisplays(tenantId, orders, adminUser);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  • Tenant: dima (رستوران دیما)');
    console.log('  • Users: 4 (1 Admin, 1 Manager, 2 Staff)');
    console.log('  • Suppliers: 12');
    console.log('  • Inventory Items: 35');
    console.log('  • Inventory Transactions: 300+');
    console.log('  • Customers: 50+');
    console.log('  • Tables: 10');
    console.log('  • Menu Categories: 5');
    console.log('  • Menu Items: 35+');
    console.log('  • Orders: 25+');
    console.log('  • Order Payments: 25+');
    console.log('  • Kitchen Display Entries: 15');
    console.log('\n✨ Ready for Inventory, Ordering, and BI testing!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
