const { PrismaClient } = require('../shared/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ log: ['error', 'warn'], errorFormat: 'colorless' });

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

async function main() {
  console.log('🌱 Mega seeding: clearing all data...');
  // Delete all dependent/child records first (order matters for FK constraints)
  await prisma.notification.deleteMany({});
  await prisma.reportExecution.deleteMany({});
  await prisma.customReport.deleteMany({});
  await prisma.customerVisit.deleteMany({});
  await prisma.loyaltyTransaction.deleteMany({});
  await prisma.customerFeedback.deleteMany({});
  await prisma.crmCustomerSegment.deleteMany({});
  await prisma.campaignTemplate.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.smsHistory.deleteMany({});
  
  // Delete ordering system data (maintain proper FK order)
  await prisma.kitchenDisplay.deleteMany({});
  await prisma.orderPayment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.tableReservation.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItemModifier.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  
  await prisma.itemSupplier.deleteMany({});
  await prisma.inventoryEntry.deleteMany({});
  await prisma.journalEntry.deleteMany({}); // <-- Move this up before user deletion
  await prisma.chartOfAccount.deleteMany({}); // <-- Add this before creating accounts
  await prisma.item.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenantFeatures.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      subdomain: 'cafe-golestan',
      name: 'کافه گلستان',
      displayName: 'کافه گلستان',
      description: 'کافه‌ای دنج در قلب تهران',
      plan: 'BUSINESS',
      isActive: true,
      maxUsers: 20,
      maxItems: 10000,
      maxCustomers: 5000,
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

  // 1.1. Additional Tenants: dima and macheen
  const dimaTenant = await prisma.tenant.create({
    data: {
      subdomain: 'dima',
      name: 'دیمه',
      displayName: 'دیمه',
      description: 'سیستم مدیریت دیمه',
      plan: 'BUSINESS',
      isActive: true,
      maxUsers: 20,
      maxItems: 10000,
      maxCustomers: 5000,
      ownerName: 'علی‌رضا یوسفی',
      ownerEmail: 'alirezayousefi@dima.ir',
      ownerPhone: '09123456789',
      businessType: 'رستوران',
      address: 'تهران',
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

  const macheenTenant = await prisma.tenant.create({
    data: {
      subdomain: 'macheen',
      name: 'مچین',
      displayName: 'مچین',
      description: 'سیستم مدیریت مچین',
      plan: 'BUSINESS',
      isActive: true,
      maxUsers: 20,
      maxItems: 10000,
      maxCustomers: 5000,
      ownerName: 'سعید بیات',
      ownerEmail: 'saeedbayat@macheen.ir',
      ownerPhone: '09123456789',
      businessType: 'کافه',
      address: 'تهران',
      city: 'تهران',
      state: 'تهران',
      country: 'Iran'
    }
  });
  await prisma.tenantFeatures.create({
    data: {
      tenantId: macheenTenant.id,
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

  // 2. Users
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
  const staffUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'رضا کریمی',
      email: 'staff@cafe-golestan.ir',
      password: await bcrypt.hash('staff123', 10),
      role: 'STAFF',
      phoneNumber: '09125678901',
      lastLogin: new Date(),
      active: true
    }
  });

  // 2.1. Additional Users for dima and macheen tenants
  const dimaManagerUser = await prisma.user.create({
    data: {
      tenantId: dimaTenant.id,
      name: 'علی‌رضا یوسفی',
      email: 'alirezayousefi@dima.ir',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      phoneNumber: '09123456789',
      lastLogin: new Date(),
      active: true
    }
  });

  const macheenManagerUser = await prisma.user.create({
    data: {
      tenantId: macheenTenant.id,
      name: 'سعید بیات',
      email: 'saeedbayat@macheen.ir',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      phoneNumber: '09123456789',
      lastLogin: new Date(),
      active: true
    }
  });

  // 3. Suppliers
  const supplierNames = [
    'تامین قهوه ایران', 'بازرگانی چای گلستان', 'شیر و لبنیات تهران', 'نان و شیرینی بهار',
    'بسته‌بندی پارس', 'شیرین‌کننده سپید', 'کالاگستر', 'پخش مواد غذایی آریا',
    'پخش نوشیدنی خزر', 'پخش مواد اولیه البرز', 'پخش ظروف یکبارمصرف', 'پخش محصولات ارگانیک'
  ];
  const suppliers = [];
  for (let i = 0; i < supplierNames.length; i++) {
    suppliers.push(await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: supplierNames[i],
        contactName: `مدیر ${supplierNames[i]}`,
        email: `supplier${i + 1}@example.com`,
        phoneNumber: '0912' + randomInt(1000000, 9999999),
        address: 'تهران',
        notes: 'تامین‌کننده معتبر',
        isActive: i % 5 !== 0 // every 5th supplier inactive
      }
    }));
  }

  // 4. Comprehensive Item Catalog for Full Coverage
  const categories = [
    'قهوه', 'چای', 'شیرینی', 'لبنیات', 'بسته‌بندی', 'شیرین کننده', 'نوشیدنی', 'میوه', 'غلات'
  ];
  const units = ['کیلوگرم', 'بسته', 'لیتر', 'عدد', 'جعبه', 'پاکت'];
  const itemCatalog = [
    { name: 'قهوه اسپرسو', category: 'قهوه', unit: 'کیلوگرم', minStock: 10, isActive: true },
    { name: 'قهوه فرانسه', category: 'قهوه', unit: 'کیلوگرم', minStock: 8, isActive: true },
    { name: 'چای سیاه ممتاز', category: 'چای', unit: 'کیلوگرم', minStock: 12, isActive: true },
    { name: 'چای سبز', category: 'چای', unit: 'کیلوگرم', minStock: 7, isActive: true },
    { name: 'شیر پرچرب', category: 'لبنیات', unit: 'لیتر', minStock: 20, isActive: true },
    { name: 'شیر کم چرب', category: 'لبنیات', unit: 'لیتر', minStock: 15, isActive: true },
    { name: 'پنیر فتا', category: 'لبنیات', unit: 'کیلوگرم', minStock: 5, isActive: true },
    { name: 'کیک شکلاتی', category: 'شیرینی', unit: 'عدد', minStock: 10, isActive: true },
    { name: 'کیک وانیلی', category: 'شیرینی', unit: 'عدد', minStock: 10, isActive: false }, // inactive
    { name: 'بسته‌بندی لیوان', category: 'بسته‌بندی', unit: 'بسته', minStock: 30, isActive: true },
    { name: 'شکر', category: 'شیرین کننده', unit: 'کیلوگرم', minStock: 25, isActive: true },
    { name: 'عسل طبیعی', category: 'شیرین کننده', unit: 'کیلوگرم', minStock: 5, isActive: true },
    { name: 'آب معدنی', category: 'نوشیدنی', unit: 'بسته', minStock: 20, isActive: true },
    { name: 'آبمیوه پرتقال', category: 'نوشیدنی', unit: 'بسته', minStock: 10, isActive: true },
    { name: 'سیب', category: 'میوه', unit: 'کیلوگرم', minStock: 10, isActive: true },
    { name: 'موز', category: 'میوه', unit: 'کیلوگرم', minStock: 10, isActive: true },
    { name: 'جو پرک', category: 'غلات', unit: 'کیلوگرم', minStock: 8, isActive: true },
    { name: 'برنج ایرانی', category: 'غلات', unit: 'کیلوگرم', minStock: 15, isActive: true },
    // Add more for a total of 35, mixing in some inactive, some with no transactions, some with multiple suppliers, etc.
  ];
  while (itemCatalog.length < 35) {
    itemCatalog.push({
      name: `کالا نمونه ${itemCatalog.length + 1}`,
      category: randomFrom(categories),
      unit: randomFrom(units),
      minStock: randomInt(5, 20),
      isActive: itemCatalog.length % 10 !== 0 // every 10th item inactive
    });
  }
  const items = [];
  const itemSupplierLinks = [];
  for (let i = 0; i < itemCatalog.length; i++) {
    const cat = itemCatalog[i].category;
    const sup = randomFrom(suppliers);
    const item = await prisma.item.create({
      data: {
        tenantId: tenant.id,
        name: itemCatalog[i].name,
        category: cat,
        unit: itemCatalog[i].unit,
        minStock: itemCatalog[i].minStock,
        description: `${cat} با کیفیت عالی`,
        barcode: '89012345' + (10000 + i), // unique barcode
        isActive: itemCatalog[i].isActive
      }
    });
    items.push(item);
    // Some items have no suppliers, some have multiple
    if (i % 7 !== 0) {
      itemSupplierLinks.push(await prisma.itemSupplier.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          supplierId: sup.id,
          preferredSupplier: true,
          unitPrice: randomInt(10000, 500000)
        }
      }));
      if (i % 5 === 0) {
        // Add a second supplier
        const otherSup = randomFrom(suppliers.filter(s => s.id !== sup.id));
        itemSupplierLinks.push(await prisma.itemSupplier.create({
          data: {
            tenantId: tenant.id,
            itemId: item.id,
            supplierId: otherSup.id,
            preferredSupplier: false,
            unitPrice: randomInt(10000, 500000)
          }
        }));
      }
    }
  }

  // 5. Customers (100+)
  const customers = [];
  for (let i = 0; i < 120; i++) {
    customers.push(await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: `مشتری ${i + 1}`,
        email: `customer${i + 1}@mail.com`,
        phone: '0912' + randomInt(1000000, 9999999),
        address: 'تهران',
        phoneNormalized: '+98912' + randomInt(1000000, 9999999),
        isActive: true,
        createdBy: adminUser.id
      }
    }));
  }

  // 6. Inventory Entries (comprehensive)
  const fixedNow = new Date('2025-07-16T12:00:00Z');
  let entryCount = 0;
  const itemStocks = {};
  // BI-optimized seller groups
  const highSellers = items.slice(0, 5); // top 5 as high sellers
  const mediumSellers = items.slice(5, 15); // next 10 as medium
  const lowSellers = items.slice(15); // rest as low sellers

  // For each item, clear previous inventory logic and use BI-optimized logic
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    itemStocks[item.id] = 0;
    // Some items have no transactions (edge case)
    if (i % 13 === 0) continue;
    // High sellers: many OUTs, high price
    if (highSellers.includes(item)) {
      // Initial IN (cost)
      const initialQty = 1000;
      const costPrice = randomInt(10000, 20000);
      await prisma.inventoryEntry.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          quantity: initialQty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'ورود اولیه (پرفروش)',
          userId: adminUser.id,
          createdAt: new Date(fixedNow.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      itemStocks[item.id] += initialQty;
      entryCount++;
      // Many OUTs (sales) with higher sale price
      for (let d = 0; d < 90; d++) {
        const qty = randomInt(5, 15);
        const salePrice = costPrice + randomInt(5000, 15000);
        await prisma.inventoryEntry.create({
          data: {
            tenantId: tenant.id,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش روزانه (پرفروش)',
            userId: randomFrom([adminUser, managerUser, staffUser]).id,
            createdAt: new Date(fixedNow.getTime() - d * 24 * 60 * 60 * 1000)
          }
        });
        itemStocks[item.id] -= qty;
        entryCount++;
      }
      continue;
    }
    // Medium sellers: moderate OUTs, moderate price
    if (mediumSellers.includes(item)) {
      const initialQty = 400;
      const costPrice = randomInt(8000, 15000);
      await prisma.inventoryEntry.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          quantity: initialQty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'ورود اولیه (متوسط)',
          userId: adminUser.id,
          createdAt: new Date(fixedNow.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      itemStocks[item.id] += initialQty;
      entryCount++;
      for (let d = 0; d < 45; d++) {
        const qty = randomInt(2, 6);
        const salePrice = costPrice + randomInt(2000, 7000);
        await prisma.inventoryEntry.create({
          data: {
            tenantId: tenant.id,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش متوسط',
            userId: randomFrom([adminUser, managerUser, staffUser]).id,
            createdAt: new Date(fixedNow.getTime() - d * 2 * 24 * 60 * 60 * 1000)
          }
        });
        itemStocks[item.id] -= qty;
        entryCount++;
      }
      continue;
    }
    // Low sellers: few OUTs, low price
    if (lowSellers.includes(item)) {
      const initialQty = 100;
      const costPrice = randomInt(5000, 10000);
      await prisma.inventoryEntry.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          quantity: initialQty,
          type: 'IN',
          unitPrice: costPrice,
          note: 'ورود اولیه (کم فروش)',
          userId: adminUser.id,
          createdAt: new Date(fixedNow.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      itemStocks[item.id] += initialQty;
      entryCount++;
      for (let d = 0; d < 10; d++) {
        const qty = randomInt(1, 2);
        const salePrice = costPrice + randomInt(500, 2000);
        await prisma.inventoryEntry.create({
          data: {
            tenantId: tenant.id,
            itemId: item.id,
            quantity: qty,
            type: 'OUT',
            unitPrice: salePrice,
            note: 'فروش کم فروش',
            userId: randomFrom([adminUser, managerUser, staffUser]).id,
            createdAt: new Date(fixedNow.getTime() - d * 7 * 24 * 60 * 60 * 1000)
          }
        });
        itemStocks[item.id] -= qty;
        entryCount++;
      }
      continue;
    }
  }

  // 7. Guaranteed daily sales for BI charts (last 30 days)
  for (const item of items) {
    for (let d = 0; d < 30; d++) {
      const qty = randomInt(1, 5); // More for high sellers if desired
      await prisma.inventoryEntry.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          quantity: qty,
          type: 'OUT',
          note: 'فروش روزانه (شبیه‌سازی BI)',
          userId: randomFrom([adminUser, managerUser, staffUser]).id,
          createdAt: new Date(fixedNow.getTime() - d * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 8. SMS history
  for (let i = 0; i < 10; i++) {
    await prisma.smsHistory.create({
      data: {
        tenantId: tenant.id,
        sentBy: adminUser.id,
        phoneNumber: '0912' + randomInt(1000000, 9999999),
        message: `پیام تستی شماره ${i + 1}`,
        messageType: 'PROMOTIONAL',
        status: 'SENT',
        sentAt: new Date(fixedNow.getTime() - randomInt(1, 30) * 60 * 60 * 1000),
        creditUsed: 1,
        costAmount: randomInt(5, 20),
        metadata: { test: true }
      }
    });
  }

  // 4.1. Chart of Accounts (Iranian standard, hierarchical)
  const accountsData = [
    // Assets
    { code: '1000', name: 'دارایی‌ها', type: 'ASSET', parent: null },
    { code: '1100', name: 'موجودی نقد', type: 'ASSET', parent: '1000' },
    { code: '1200', name: 'موجودی کالا', type: 'ASSET', parent: '1000' },
    { code: '1300', name: 'حساب‌های دریافتنی', type: 'ASSET', parent: '1000' },
    { code: '1400', name: 'تجهیزات اداری', type: 'ASSET', parent: '1000' },
    // Liabilities
    { code: '2000', name: 'بدهی‌ها', type: 'LIABILITY', parent: null },
    { code: '2100', name: 'حساب‌های پرداختنی', type: 'LIABILITY', parent: '2000' },
    { code: '2200', name: 'اسناد پرداختنی', type: 'LIABILITY', parent: '2000' },
    { code: '2300', name: 'وام بانکی', type: 'LIABILITY', parent: '2000' },
    // Equity
    { code: '3000', name: 'حقوق صاحبان سهام', type: 'EQUITY', parent: null },
    { code: '3100', name: 'سرمایه', type: 'EQUITY', parent: '3000' },
    { code: '3200', name: 'سود انباشته', type: 'EQUITY', parent: '3000' },
    // Revenue
    { code: '4000', name: 'درآمدها', type: 'REVENUE', parent: null },
    { code: '4100', name: 'درآمد فروش', type: 'REVENUE', parent: '4000' },
    // Expenses
    { code: '5000', name: 'هزینه‌ها', type: 'EXPENSE', parent: null },
    { code: '5100', name: 'هزینه‌های اداری', type: 'EXPENSE', parent: '5000' },
    { code: '5200', name: 'هزینه‌های فروش', type: 'EXPENSE', parent: '5000' },
    { code: '5300', name: 'هزینه‌های مالی', type: 'EXPENSE', parent: '5000' },
  ];
  const accountMap = {};
  for (const acc of accountsData) {
    const created = await prisma.chartOfAccount.create({
      data: {
        tenantId: tenant.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        parentAccountId: acc.parent ? accountMap[acc.parent].id : null,
        level: acc.parent ? 2 : 1,
        normalBalance: acc.type === 'ASSET' || acc.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
        isActive: true,
        isSystemAccount: false
      }
    });
    accountMap[acc.code] = created;
  }

  // 4.2. Journal Entries (30+ entries, POSTED and DRAFT)
  const statuses = ['POSTED', 'DRAFT'];
  const entryTemplates = [
    // Sales
    { desc: 'فروش کالا', lines: [
      { acc: '1100', debit: 2000000, credit: 0 }, // Cash
      { acc: '4100', debit: 0, credit: 2000000 }  // Revenue
    ]},
    // Purchase
    { desc: 'خرید کالا', lines: [
      { acc: '1200', debit: 1500000, credit: 0 }, // Inventory
      { acc: '2100', debit: 0, credit: 1500000 }  // Payable
    ]},
    // Expense
    { desc: 'پرداخت هزینه اداری', lines: [
      { acc: '5100', debit: 500000, credit: 0 }, // Admin Expense
      { acc: '1100', debit: 0, credit: 500000 }  // Cash
    ]},
    // Loan
    { desc: 'دریافت وام بانکی', lines: [
      { acc: '1100', debit: 3000000, credit: 0 }, // Cash
      { acc: '2300', debit: 0, credit: 3000000 }  // Loan
    ]},
    // Payroll
    { desc: 'پرداخت حقوق', lines: [
      { acc: '5100', debit: 800000, credit: 0 }, // Admin Expense
      { acc: '1100', debit: 0, credit: 800000 }  // Cash
    ]},
    // Interest
    { desc: 'پرداخت بهره وام', lines: [
      { acc: '5300', debit: 120000, credit: 0 }, // Financial Expense
      { acc: '1100', debit: 0, credit: 120000 }  // Cash
    ]},
  ];
  const journalEntries = [];
  for (let i = 0; i < 36; i++) {
    const template = randomFrom(entryTemplates);
    const status = i % 4 === 0 ? 'DRAFT' : 'POSTED';
    const entryDate = new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000);
    const lines = template.lines.map((l, idx) => ({
      accountId: accountMap[l.acc].id,
      description: template.desc,
      debitAmount: l.debit,
      creditAmount: l.credit,
      lineNumber: idx + 1
    }));
    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: tenant.id,
        entryNumber: `JE-${2025}${String(i + 1).padStart(3, '0')}`,
        entryDate,
        description: template.desc,
        totalDebit,
        totalCredit,
        status,
        createdBy: randomFrom([adminUser, managerUser, staffUser]).id,
        lines: {
          create: lines.map(line => ({
            ...line,
            tenantId: tenant.id
          }))
        }
      },
      include: { lines: true }
    });
    journalEntries.push(entry);
  }

  // Ensure at least 3 POSTED journal entries for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const template = randomFrom(entryTemplates);
    const lines = template.lines.map((l, idx) => ({
      accountId: accountMap[l.acc].id,
      description: template.desc,
      debitAmount: l.debit,
      creditAmount: l.credit,
      lineNumber: idx + 1
    }));
    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: tenant.id,
        entryNumber: `JE-TODAY-${2025}${String(i + 1).padStart(3, '0')}`,
        entryDate: new Date(),
        description: template.desc + ' (امروز)',
        totalDebit,
        totalCredit,
        status: 'POSTED',
        createdBy: randomFrom([adminUser, managerUser, staffUser]).id,
        lines: {
          create: lines.map(line => ({
            ...line,
            tenantId: tenant.id
          }))
        }
      },
      include: { lines: true }
    });
    journalEntries.push(entry);
  }
  // Ensure at least 5 POSTED journal entries for current month (if not already present)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let monthEntries = await prisma.journalEntry.count({
    where: {
      entryDate: { gte: monthStart },
      status: 'POSTED'
    }
  });
  for (let i = monthEntries; i < 5; i++) {
    const template = randomFrom(entryTemplates);
    const lines = template.lines.map((l, idx) => ({
      accountId: accountMap[l.acc].id,
      description: template.desc,
      debitAmount: l.debit,
      creditAmount: l.credit,
      lineNumber: idx + 1
    }));
    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    const entryDate = new Date(monthStart.getTime() + randomInt(0, now.getDate() - 1) * 24 * 60 * 60 * 1000);
    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: tenant.id,
        entryNumber: `JE-MONTH-${2025}${String(i + 1).padStart(3, '0')}`,
        entryDate,
        description: template.desc + ' (ماه جاری)',
        totalDebit,
        totalCredit,
        status: 'POSTED',
        createdBy: randomFrom([adminUser, managerUser, staffUser]).id,
        lines: {
          create: lines.map(line => ({
            ...line,
            tenantId: tenant.id
          }))
        }
      },
      include: { lines: true }
    });
    journalEntries.push(entry);
  }
  console.log(`📒 Created ${Object.keys(accountMap).length} accounts, ${journalEntries.length} journal entries for accounting system.`);

  // 9. ORDERING SYSTEM: Complete café ordering and POS system
  console.log('🍽️ Creating ordering system data...');
  
  // 9.1 Tables for Café Golestan
  const tables = [];
  const tableConfigs = [
    // Main floor tables
    { number: '1', name: 'میز پنجره', capacity: 2, section: 'اصلی', floor: 1, x: 100, y: 50 },
    { number: '2', name: 'میز دو نفره', capacity: 2, section: 'اصلی', floor: 1, x: 200, y: 50 },
    { number: '3', name: 'میز خانوادگی', capacity: 4, section: 'اصلی', floor: 1, x: 300, y: 50 },
    { number: '4', name: 'میز مرکزی', capacity: 4, section: 'اصلی', floor: 1, x: 150, y: 150 },
    { number: '5', name: 'میز VIP', capacity: 6, section: 'اصلی', floor: 1, x: 250, y: 150 },
    { number: '6', name: 'میز کناری', capacity: 2, section: 'اصلی', floor: 1, x: 350, y: 150 },
    // Terrace tables
    { number: '7', name: 'تراس ۱', capacity: 4, section: 'تراس', floor: 1, x: 100, y: 250 },
    { number: '8', name: 'تراس ۲', capacity: 4, section: 'تراس', floor: 1, x: 200, y: 250 },
    { number: '9', name: 'تراس ۳', capacity: 2, section: 'تراس', floor: 1, x: 300, y: 250 },
    // Private room
    { number: '10', name: 'اتاق خصوصی', capacity: 8, section: 'خصوصی', floor: 2, x: 150, y: 100 },
  ];

  for (const config of tableConfigs) {
    const table = await prisma.table.create({
      data: {
        tenantId: tenant.id,
        tableNumber: config.number,
        tableName: config.name,
        capacity: config.capacity,
        section: config.section,
        floor: config.floor,
        positionX: config.x,
        positionY: config.y,
        status: 'AVAILABLE',
        isActive: true,
      }
    });
    tables.push(table);
  }

  // 9.2 Menu Categories with Persian café categories
  const menuCategories = [];
  const categoryConfigs = [
    { name: 'قهوه‌های گرم', nameEn: 'Hot Coffee', desc: 'انواع قهوه‌های تازه و معطر', order: 1, color: '#8B4513', icon: '☕' },
    { name: 'قهوه‌های سرد', nameEn: 'Cold Coffee', desc: 'قهوه‌های سرد و خنک', order: 2, color: '#4682B4', icon: '🧊' },
    { name: 'چای و دمنوش', nameEn: 'Tea & Herbal', desc: 'چای‌های معطر و دمنوش‌های گیاهی', order: 3, color: '#228B22', icon: '🍵' },
    { name: 'نوشیدنی‌های سرد', nameEn: 'Cold Drinks', desc: 'آبمیوه‌ها و نوشیدنی‌های خنک', order: 4, color: '#FF6347', icon: '🥤' },
    { name: 'کیک و شیرینی', nameEn: 'Cakes & Sweets', desc: 'کیک‌های تازه و شیرینی‌های خانگی', order: 5, color: '#DDA0DD', icon: '🍰' },
    { name: 'صبحانه', nameEn: 'Breakfast', desc: 'صبحانه‌های متنوع و مقوی', order: 6, color: '#FFD700', icon: '🍳' },
    { name: 'اسنک و میان‌وعده', nameEn: 'Snacks', desc: 'اسنک‌ها و تنقلات', order: 7, color: '#FF8C00', icon: '🥨' },
  ];

  for (const config of categoryConfigs) {
    const category = await prisma.menuCategory.create({
      data: {
        tenantId: tenant.id,
        name: config.name,
        nameEn: config.nameEn,
        description: config.desc,
        displayOrder: config.order,
        color: config.color,
        icon: config.icon,
        isActive: true,
        availableFrom: '07:00',
        availableTo: '23:00',
        availableDays: JSON.stringify([1, 2, 3, 4, 5, 6, 7]) // All days
      }
    });
    menuCategories.push(category);
  }

  // 9.3 Menu Items linked to inventory items with café pricing
  const menuItems = [];
  const menuItemConfigs = [
    // Hot Coffee Category
    { item: 'قهوه اسپرسو', category: 'قهوه‌های گرم', displayName: 'اسپرسو کلاسیک', displayNameEn: 'Classic Espresso', desc: 'اسپرسو تک‌شات با عطر بی‌نظیر', price: 45000, originalPrice: 50000, prepTime: 3, featured: true, spicy: false, vegetarian: true, new: false },
    { item: 'قهوه فرانسه', category: 'قهوه‌های گرم', displayName: 'قهوه فرانسوی', displayNameEn: 'French Coffee', desc: 'قهوه فرانسوی با طعم غنی', price: 55000, originalPrice: 60000, prepTime: 5, featured: true, spicy: false, vegetarian: true, new: true },
    
    // Tea Category
    { item: 'چای سیاه ممتاز', category: 'چای و دمنوش', displayName: 'چای سیاه اصیل', displayNameEn: 'Authentic Black Tea', desc: 'چای سیاه معطر ایرانی', price: 35000, originalPrice: null, prepTime: 3, featured: false, spicy: false, vegetarian: true, new: false },
    { item: 'چای سبز', category: 'چای و دمنوش', displayName: 'چای سبز', displayNameEn: 'Green Tea', desc: 'چای سبز طبیعی و خوشمزه', price: 40000, originalPrice: null, prepTime: 3, featured: false, spicy: false, vegetarian: true, new: false },
    
    // Cold Drinks
    { item: 'آبمیوه پرتقال', category: 'نوشیدنی‌های سرد', displayName: 'آبمیوه پرتقال تازه', displayNameEn: 'Fresh Orange Juice', desc: 'آبمیوه طبیعی پرتقال', price: 50000, originalPrice: null, prepTime: 2, featured: false, spicy: false, vegetarian: true, new: false },
    { item: 'آب معدنی', category: 'نوشیدنی‌های سرد', displayName: 'آب معدنی', displayNameEn: 'Mineral Water', desc: 'آب معدنی طبیعی', price: 15000, originalPrice: null, prepTime: 1, featured: false, spicy: false, vegetarian: true, new: false },
    
    // Cakes & Sweets
    { item: 'کیک شکلاتی', category: 'کیک و شیرینی', displayName: 'کیک شکلاتی خانگی', displayNameEn: 'Homemade Chocolate Cake', desc: 'کیک شکلاتی تازه پخت', price: 85000, originalPrice: null, prepTime: 2, featured: true, spicy: false, vegetarian: true, new: false },
    
    // Breakfast
    { item: 'پنیر فتا', category: 'صبحانه', displayName: 'صبحانه ایرانی', displayNameEn: 'Persian Breakfast', desc: 'صبحانه کامل با پنیر، نان و سبزی', price: 120000, originalPrice: null, prepTime: 8, featured: true, spicy: false, vegetarian: true, new: false },
    
    // Snacks
    { item: 'سیب', category: 'اسنک و میان‌وعده', displayName: 'میوه تازه', displayNameEn: 'Fresh Fruit', desc: 'میوه‌های تازه و فصلی', price: 30000, originalPrice: null, prepTime: 1, featured: false, spicy: false, vegetarian: true, new: false },
  ];

  for (const config of menuItemConfigs) {
    // Find the inventory item and category
    const inventoryItem = items.find(item => item.name === config.item);
    const category = menuCategories.find(cat => cat.name === config.category);
    
    if (inventoryItem && category) {
      const menuItem = await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          itemId: inventoryItem.id,
          categoryId: category.id,
          displayName: config.displayName,
          displayNameEn: config.displayNameEn,
          description: config.desc,
          menuPrice: config.price,
          originalPrice: config.originalPrice,
          prepTime: config.prepTime,
          isFeatured: config.featured,
          isSpicy: config.spicy,
          isVegetarian: config.vegetarian,
          isNew: config.new,
          isActive: true,
          isAvailable: true,
          maxOrderQty: 10,
          displayOrder: menuItems.length + 1
        }
      });
      menuItems.push(menuItem);
    }
  }

  // 9.4 Menu Item Modifiers
  const modifiers = [];
  const modifierConfigs = [
    // Coffee modifiers
    { menuItem: 'اسپرسو کلاسیک', name: 'شات اضافی', nameEn: 'Extra Shot', price: 15000, category: 'EXTRA' },
    { menuItem: 'اسپرسو کلاسیک', name: 'بدون کافئین', nameEn: 'Decaf', price: 0, category: 'OPTION' },
    { menuItem: 'قهوه فرانسوی', name: 'شیر اضافی', nameEn: 'Extra Milk', price: 10000, category: 'EXTRA' },
    { menuItem: 'قهوه فرانسوی', name: 'شکر قهوه‌ای', nameEn: 'Brown Sugar', price: 5000, category: 'OPTION' },
  ];

  for (const config of modifierConfigs) {
    const menuItem = menuItems.find(item => item.displayName === config.menuItem);
    if (menuItem) {
      const modifier = await prisma.menuItemModifier.create({
        data: {
          tenantId: tenant.id,
          menuItemId: menuItem.id,
          name: config.name,
          nameEn: config.nameEn,
          additionalPrice: config.price,
          isRequired: false,
          isActive: true,
          displayOrder: modifiers.length + 1
        }
      });
      modifiers.push(modifier);
    }
  }

  // 9.5 Sample Orders with various statuses
  const orders = [];
  const orderConfigs = [
    // Today's orders with different statuses
    { customer: 0, table: 0, status: 'COMPLETED', type: 'DINE_IN', items: [{ menu: 'اسپرسو کلاسیک', qty: 2 }, { menu: 'کیک شکلاتی خانگی', qty: 1 }], payment: 'PAID', method: 'CASH', priority: 0, hoursAgo: 8 },
    { customer: 1, table: 1, status: 'COMPLETED', type: 'DINE_IN', items: [{ menu: 'قهوه فرانسوی', qty: 1 }, { menu: 'صبحانه ایرانی', qty: 1 }], payment: 'PAID', method: 'CARD', priority: 0, hoursAgo: 6 },
    { customer: 2, table: 2, status: 'SERVED', type: 'DINE_IN', items: [{ menu: 'چای سبز', qty: 1 }, { menu: 'میوه تازه', qty: 1 }], payment: 'PAID', method: 'ONLINE', priority: 1, hoursAgo: 2 },
    { customer: 3, table: 3, status: 'READY', type: 'DINE_IN', items: [{ menu: 'چای سیاه اصیل', qty: 2 }], payment: 'PAID', method: 'CASH', priority: 2, hoursAgo: 1 },
    { customer: 4, table: 4, status: 'PREPARING', type: 'DINE_IN', items: [{ menu: 'قهوه فرانسوی', qty: 1 }, { menu: 'چای سیاه اصیل', qty: 1 }], payment: 'PAID', method: 'CARD', priority: 1, hoursAgo: 0.5 },
    { customer: 5, table: null, status: 'CONFIRMED', type: 'TAKEAWAY', items: [{ menu: 'آبمیوه پرتقال تازه', qty: 1 }], payment: 'PENDING', method: 'CASH', priority: 0, hoursAgo: 0.2 },
    { customer: 6, table: 5, status: 'PENDING', type: 'DINE_IN', items: [{ menu: 'اسپرسو کلاسیک', qty: 3 }, { menu: 'کیک شکلاتی خانگی', qty: 2 }], payment: 'PENDING', method: 'CARD', priority: 0, hoursAgo: 0.1 },
    { customer: null, table: null, status: 'DRAFT', type: 'TAKEAWAY', items: [{ menu: 'آب معدنی', qty: 1 }], payment: 'PENDING', method: 'CASH', priority: 0, hoursAgo: 0 },
  ];

  for (let i = 0; i < orderConfigs.length; i++) {
    const config = orderConfigs[i];
    const orderDate = new Date(Date.now() - config.hoursAgo * 60 * 60 * 1000);
    
    // Generate order number
    const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateStr}-${String(i + 1).padStart(4, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of config.items) {
      const menuItem = menuItems.find(m => m.displayName === item.menu);
      if (menuItem) {
        const itemTotal = Number(menuItem.menuPrice) * item.qty;
        subtotal += itemTotal;
        orderItems.push({
          itemId: menuItem.itemId,
          itemName: menuItem.displayName,
          quantity: item.qty,
          unitPrice: Number(menuItem.menuPrice),
          totalPrice: itemTotal,
          modifiers: '[]',
          lineNumber: orderItems.length + 1
        });
      }
    }
    
    // Iranian tax calculation (9% VAT + 10% service charge)
    const taxAmount = subtotal * 0.09;
    const serviceCharge = subtotal * 0.10;
    const totalAmount = subtotal + taxAmount + serviceCharge;
    
    const orderData = {
      tenantId: tenant.id,
      orderNumber,
      orderType: config.type,
      status: config.status,
      priority: config.priority,
      customerId: config.customer !== null ? customers[config.customer]?.id : null,
      customerName: config.customer !== null ? customers[config.customer]?.name : 'مشتری نقدی',
      customerPhone: config.customer !== null ? customers[config.customer]?.phone : null,
      tableId: config.table !== null ? tables[config.table]?.id : null,
      guestCount: config.table !== null ? randomInt(1, 4) : 1,
      subtotal,
      taxAmount,
      serviceCharge,
      totalAmount,
      paymentStatus: config.payment,
      paymentMethod: config.method,
      paidAmount: config.payment === 'PAID' ? totalAmount : 0,
      orderDate,
      estimatedTime: orderItems.reduce((sum, item) => sum + 5, 0), // 5 minutes per item default
      createdBy: randomFrom([adminUser, managerUser, staffUser]).id,
      servedBy: config.status === 'COMPLETED' || config.status === 'SERVED' ? randomFrom([managerUser, staffUser]).id : null,
      startedAt: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 5 * 60 * 1000) : null,
      readyAt: ['READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 15 * 60 * 1000) : null,
      servedAt: ['SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 20 * 60 * 1000) : null,
      completedAt: config.status === 'COMPLETED' ? new Date(orderDate.getTime() + 25 * 60 * 1000) : null,
      notes: `سفارش ${config.type === 'DINE_IN' ? 'حضوری' : 'بیرون‌بر'}`,
      kitchenNotes: config.priority > 0 ? 'سفارش فوری' : null
    };

    const order = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: orderItems.map(item => ({
            ...item,
            tenantId: tenant.id
          }))
        }
      }
    });
    orders.push(order);

    // Create payment records for paid orders
    if (config.payment === 'PAID') {
      const paymentNumber = `PAY-${dateStr}-${String(i + 1).padStart(4, '0')}`;
      await prisma.orderPayment.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          paymentNumber,
          amount: totalAmount,
          paymentMethod: config.method,
          paymentStatus: 'PAID',
          paymentDate: orderDate,
          processedBy: orderData.createdBy,
          transactionId: config.method === 'ONLINE' ? `TXN-${Date.now()}` : null
        }
      });
    }

    // Create kitchen display entries for active orders
    if (['CONFIRMED', 'PREPARING', 'READY'].includes(config.status)) {
      await prisma.kitchenDisplay.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          displayName: config.type === 'DINE_IN' ? `میز ${config.table + 1}` : 'بیرون‌بر',
          station: 'اصلی',
          status: config.status,
          priority: config.priority,
          estimatedTime: orderData.estimatedTime,
          displayedAt: orderDate,
          startedAt: orderData.startedAt,
          completedAt: orderData.readyAt
        }
      });
    }
  }

  // 9.6 Table Reservations
  const reservations = [];
  const futureDate1 = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
  const futureDate2 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // Tomorrow
  
  const reservationConfigs = [
    { customer: 10, table: 4, date: futureDate1, guests: 4, status: 'CONFIRMED', duration: 120 },
    { customer: 15, table: 9, date: futureDate2, guests: 2, status: 'CONFIRMED', duration: 90 },
    { customer: 20, table: 2, date: new Date(futureDate2.getTime() + 3 * 60 * 60 * 1000), guests: 2, status: 'PENDING', duration: 60 },
  ];

  for (let i = 0; i < reservationConfigs.length; i++) {
    const config = reservationConfigs[i];
    await prisma.tableReservation.create({
      data: {
        tenantId: tenant.id,
        tableId: tables[config.table].id,
        customerId: customers[config.customer].id,
        customerName: customers[config.customer].name,
        customerPhone: customers[config.customer].phone,
        reservationDate: config.date,
        guestCount: config.guests,
        duration: config.duration,
        status: config.status,
        notes: 'رزرو از طریق تلفن',
        createdBy: managerUser.id
      }
    });
  }

  console.log(`🍽️ Created ${tables.length} tables, ${menuCategories.length} menu categories`);
  console.log(`📋 Created ${menuItems.length} menu items with ${modifiers.length} modifiers`);
  console.log(`🛒 Created ${orders.length} sample orders with various statuses`);
  console.log(`📅 Created ${reservationConfigs.length} table reservations`);

  // 10. BI: Seed custom reports and report executions for today and this month
  // Custom Reports
  const customReports = [];
  for (let i = 0; i < 3; i++) {
    const report = await prisma.customReport.create({
      data: {
        tenantId: tenant.id,
        name: `گزارش سفارشی ${i + 1}`,
        description: `این یک گزارش تستی برای داشبورد است (${i + 1})`,
        isActive: true,
        isPublic: true,
        createdBy: adminUser.id,
        sharedWith: [],
        dataSources: [],
        columnsConfig: []
      }
    });
    customReports.push(report);
  }
  // Report Executions (today)
  for (let i = 0; i < 3; i++) {
    await prisma.reportExecution.create({
      data: {
        tenantId: tenant.id,
        reportId: customReports[i].id,
        executedBy: adminUser.id,
        executedAt: new Date(),
        status: 'SUCCESS',
        executionTime: 1000,
        exportFormat: 'VIEW'
      }
    });
  }
  // Report Executions (earlier this month)
  for (let i = 0; i < 2; i++) {
    await prisma.reportExecution.create({
      data: {
        tenantId: tenant.id,
        reportId: customReports[randomInt(0, 2)].id,
        executedBy: managerUser.id,
        executedAt: new Date(monthStart.getTime() + randomInt(0, now.getDate() - 1) * 24 * 60 * 60 * 1000),
        status: 'SUCCESS',
        executionTime: 1000,
        exportFormat: 'VIEW'
      }
    });
  }

  console.log('✅ Mega seeding completed!');
  console.log('🏪 Tenant: کافه گلستان (cafe-golestan.servaan.ir)');
  console.log('🔐 Admin Login: ahmad@cafe-golestan.ir / admin123');
  console.log('🔐 Manager Login: fateme@cafe-golestan.ir / manager123');
  console.log('🔐 Staff Login: staff@cafe-golestan.ir / staff123');
  console.log('');
  console.log('🏪 Tenant: دیمه (dima.servaan.ir)');
  console.log('🔐 Manager Login: alirezayousefi@dima.ir / manager123');
  console.log('');
  console.log('🏪 Tenant: مچین (macheen.servaan.ir)');
  console.log('🔐 Manager Login: saeedbayat@macheen.ir / manager123');
  console.log('');
  console.log(`📦 Created ${items.length} items in ${categories.length} categories`);
  console.log(`👥 Created 5 users (3 for cafe-golestan, 2 managers for dima/macheen), ${suppliers.length} suppliers`);
  console.log(`📋 Created ${entryCount} inventory transactions (IN/OUT, daily, edge cases)`);
  console.log('💡 All workspace features and edge cases are now covered!');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });