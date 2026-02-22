const { PrismaClient } = require('../shared/generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting dima tenant seed (SIMPLIFIED - 3 workspaces only)...\n');

  try {
    // ============================================
    // CREATE TENANT
    // ============================================
    console.log('📋 Step 1: Setting up dima tenant...');

    // Delete existing dima tenant and all related data
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });

    if (existingTenant) {
      // Comprehensive cleanup
      await prisma.kitchenDisplay.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.orderPayment.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.orderItem.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.order.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.tableReservation.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.tableStatusLog.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.table.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.menuItem.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.menuCategory.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.inventoryEntry.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.itemSupplier.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.item.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.supplier.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.customer.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.user.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.tenantFeatures.deleteMany({ where: { tenantId: existingTenant.id } });
      await prisma.tenant.delete({ where: { id: existingTenant.id } });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        subdomain: 'dima',
        name: 'دیما کافه',
        displayName: 'دیما',
        ownerName: 'علیرضا یوسفی',
        ownerEmail: 'alirezayousefi@dima.ir',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        currency: 'TOMAN',
        plan: 'BUSINESS',
        maxUsers: 20,
        isActive: true
      }
    });

    console.log(`✅ Tenant created: ${tenant.name}\n`);

    // Create features
    await prisma.tenantFeatures.create({
      data: {
        tenantId: tenant.id,
        hasInventoryManagement: true,
        hasAnalyticsBI: true,
        hasReporting: true,
        hasCustomerManagement: false,
        hasAccountingSystem: false
      }
    });

    // ============================================
    // CREATE USERS
    // ============================================
    console.log('📋 Step 2: Creating users...');

    const hashedPasswordManager = await bcrypt.hash('manager123', 10);
    const hashedPasswordStaff = await bcrypt.hash('staff123', 10);

    const manager = await prisma.user.create({
      data: {
        email: 'alirezayousefi@dima.ir',
        name: 'علیرضا یوسفی',
        password: hashedPasswordManager,
        role: 'MANAGER',
        tenantId: tenant.id,
        active: true,
        lastLogin: new Date()
      }
    });

    const staff = await prisma.user.create({
      data: {
        email: 'sara@dima.ir',
        name: 'سارا محمدی',
        password: hashedPasswordStaff,
        role: 'STAFF',
        tenantId: tenant.id,
        active: true
      }
    });

    console.log(`✅ Manager: ${manager.email}`);
    console.log(`✅ Staff: ${staff.email}\n`);

    // ============================================
    // CREATE SUPPLIERS
    // ============================================
    console.log('📋 Step 3: Creating 12 suppliers...');

    const suppliers = await Promise.all([
      { name: 'قهوه های معطر', contact: 'حسن رحمانی', phone: '+989123456789', active: true },
      { name: 'چای هندی شاه', contact: 'فاطمه احمدی', phone: '+989134567890', active: true },
      { name: 'لبنیات ایرانی پاک', contact: 'محمد ملک', phone: '+989145678901', active: true },
      { name: 'شیرینی های سنتی', contact: 'علی اسلام', phone: '+989156789012', active: true },
      { name: 'بسته بندی آرام', contact: 'ناهید خدابخش', phone: '+989167890123', active: false },
      { name: 'شکر و قند ملی', contact: 'سعید مهدوی', phone: '+989178901234', active: true },
      { name: 'نوشابه های گیاهی', contact: 'مریم شریف', phone: '+989189012345', active: true },
      { name: 'میوه های تازه ایران', contact: 'رضا کریمی', phone: '+989190123456', active: true },
      { name: 'دانه های گیاهی', contact: 'اکبر رستمی', phone: '+989101234567', active: false },
      { name: 'یخ و نیتروژن مایع', contact: 'پیمان احمدی', phone: '+989112345678', active: true },
      { name: 'عسل و مربا', contact: 'عائشه محمودی', phone: '+989123457890', active: true },
      { name: 'ادویه و چاشنی پاک', contact: 'حسین افشار', phone: '+989134568901', active: false }
    ].map(s => prisma.supplier.create({
      data: {
        name: s.name,
        contactName: s.contact,
        phoneNumber: s.phone,
        isActive: s.active,
        tenantId: tenant.id
      }
    })));

    console.log(`✅ ${suppliers.length} suppliers created\n`);

    // ============================================
    // CREATE INVENTORY ITEMS
    // ============================================
    console.log('📋 Step 4: Creating 35 inventory items...');

    const itemNames = [
      // High sellers
      { sku: 'COFFEE-ESPRESSO', name: 'قهوه اسپرسو', cat: 'قهوه', unit: 'گرم', stock: 1000 },
      { sku: 'COFFEE-AMERICANO', name: 'قهوه آمریکانو', cat: 'قهوه', unit: 'گرم', stock: 1000 },
      { sku: 'TEA-BLACK', name: 'چای سیاه', cat: 'چای', unit: 'گرم', stock: 1000 },
      { sku: 'MILK-FRESH', name: 'شیر تازه', cat: 'لبنیات', unit: 'لیتر', stock: 1000 },
      { sku: 'SUGAR-WHITE', name: 'قند سفید', cat: 'شیرینی‌کننده‌ها', unit: 'کیلوگرم', stock: 1000 },
      // Medium sellers
      { sku: 'COFFEE-LATTE', name: 'قهوه لاته', cat: 'قهوه', unit: 'گرم', stock: 400 },
      { sku: 'COFFEE-CAPPUCCINO', name: 'قهوه کاپوچینو', cat: 'قهوه', unit: 'گرم', stock: 400 },
      { sku: 'TEA-GREEN', name: 'چای سبز', cat: 'چای', unit: 'گرم', stock: 400 },
      { sku: 'TEA-HERBAL', name: 'چای گیاهی', cat: 'چای', unit: 'گرم', stock: 400 },
      { sku: 'YOGURT-PLAIN', name: 'ماست سادہ', cat: 'لبنیات', unit: 'کیلوگرم', stock: 400 },
      { sku: 'CREAM-FRESH', name: 'خامه تازه', cat: 'لبنیات', unit: 'کیلوگرم', stock: 400 },
      { sku: 'HONEY-NATURAL', name: 'عسل طبیعی', cat: 'شیرینی‌کننده‌ها', unit: 'کیلوگرم', stock: 400 },
      { sku: 'SYRUP-VANILLA', name: 'شربت وانیل', cat: 'شیرینی‌کننده‌ها', unit: 'لیتر', stock: 400 },
      { sku: 'JUICE-ORANGE', name: 'آب پرتقال', cat: 'نوشیدنی‌های میوه‌ای', unit: 'لیتر', stock: 400 },
      { sku: 'WATER-MINERAL', name: 'آب معدنی', cat: 'نوشیدنی‌های میوه‌ای', unit: 'لیتر', stock: 400 },
      // Low sellers (20 items)
      { sku: 'PASTRY-CROISSANT', name: 'کروسان', cat: 'نان و شیرینی', unit: 'عدد', stock: 100 },
      { sku: 'PASTRY-DONUT', name: 'دونات', cat: 'نان و شیرینی', unit: 'عدد', stock: 100 },
      { sku: 'CAKE-CARROT', name: 'کیک هویج', cat: 'کیک‌ها', unit: 'کیلوگرم', stock: 100 },
      { sku: 'CAKE-CHOCOLATE', name: 'کیک شکلات', cat: 'کیک‌ها', unit: 'کیلوگرم', stock: 100 },
      { sku: 'COOKIE-BUTTER', name: 'بیسکویت کره', cat: 'بیسکویت', unit: 'کیلوگرم', stock: 100 },
      { sku: 'COOKIE-ALMOND', name: 'بیسکویت بادام', cat: 'بیسکویت', unit: 'کیلوگرم', stock: 100 },
      { sku: 'CHOCOLATE-DARK', name: 'شکلات تیره', cat: 'شکلات و آب‌نبات', unit: 'کیلوگرم', stock: 100 },
      { sku: 'CHOCOLATE-MILK', name: 'شکلات شیری', cat: 'شکلات و آب‌نبات', unit: 'کیلوگرم', stock: 100 },
      { sku: 'NUT-ALMOND', name: 'بادام', cat: 'آجیل و دانه‌ها', unit: 'کیلوگرم', stock: 100 },
      { sku: 'NUT-WALNUT', name: 'گردو', cat: 'آجیل و دانه‌ها', unit: 'کیلوگرم', stock: 100 },
      { sku: 'FRUIT-APPLE', name: 'سیب', cat: 'میوه‌های تازه', unit: 'کیلوگرم', stock: 100 },
      { sku: 'FRUIT-BANANA', name: 'موز', cat: 'میوه‌های تازه', unit: 'کیلوگرم', stock: 100 },
      { sku: 'FRUIT-BERRIES', name: 'انواع بری', cat: 'میوه‌های تازه', unit: 'کیلوگرم', stock: 100 },
      { sku: 'CUP-PAPER-8OZ', name: 'لیوان مقوایی ۸ اونس', cat: 'بسته‌بندی', unit: 'عدد', stock: 100 },
      { sku: 'CUP-PAPER-12OZ', name: 'لیوان مقوایی ۱۲ اونس', cat: 'بسته‌بندی', unit: 'عدد', stock: 100 },
      { sku: 'SPOON-PLASTIC', name: 'قاشق پلاستیکی', cat: 'بسته‌بندی', unit: 'عدد', stock: 100 },
      { sku: 'NAPKIN-PAPER', name: 'دستمال کاغذی', cat: 'بسته‌بندی', unit: 'عدد', stock: 100 },
      { sku: 'DECAF-COFFEE', name: 'قهوه بدون کافئین', cat: 'قهوه', unit: 'گرم', stock: 100 }
    ];

    const items = await Promise.all(
      itemNames.map(item => prisma.item.create({
        data: {
          name: item.name,
          category: item.cat,
          unit: item.unit,
          tenantId: tenant.id,
          isActive: true,
          minStock: 10
        }
      }))
    );

    console.log(`✅ ${items.length} items created\n`);

    // ============================================
    // CREATE ITEM-SUPPLIER LINKS
    // ============================================
    console.log('📋 Step 5: Linking items to suppliers...');

    let linkCount = 0;
    for (const item of items) {
      const randSuppliers = suppliers.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const supplier of randSuppliers) {
        await prisma.itemSupplier.create({
          data: {
            itemId: item.id,
            supplierId: supplier.id,
            unitPrice: Math.floor(Math.random() * 100000) + 10000,
            tenantId: tenant.id
          }
        });
        linkCount++;
      }
    }
    console.log(`✅ ${linkCount} item-supplier links created\n`);

    // ============================================
    // CREATE INVENTORY ENTRIES (simplified - 300 transactions)
    // ============================================
    console.log('📋 Step 6: Creating 300+ inventory transactions...');

    let txnCount = 0;
    const startDate = new Date('2024-09-01');
    for (let d = 0; d < 116; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);

      // 2-4 transactions per day across all items
      const txnPerDay = Math.floor(Math.random() * 3) + 2;
      for (let t = 0; t < txnPerDay; t++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        await prisma.inventoryEntry.create({
          data: {
            itemId: randomItem.id,
            tenantId: tenant.id,
            type: 'OUT',
            quantity: Math.floor(Math.random() * 15) + 1,
            unitPrice: 45000,
            note: 'فروش',
            userId: manager.id,
            createdAt: currentDate
          }
        });
        txnCount++;
      }
    }
    console.log(`✅ ${txnCount} inventory transactions created\n`);

    // ============================================
    // CREATE CUSTOMERS
    // ============================================
    console.log('📋 Step 7: Creating 50+ customers...');

    const customers = [];
    for (let i = 1; i <= 50; i++) {
      const phone = `+9891234${String(i).padStart(5, '0')}`;
      const customer = await prisma.customer.create({
        data: {
          name: `مشتری ${i}`,
          phone: phone,
          phoneNormalized: phone,
          segment: i % 10 === 0 ? 'VIP' : 'REGULAR',
          status: 'ACTIVE',
          tenantId: tenant.id,
          createdBy: manager.id
        }
      });
      customers.push(customer);
    }
    console.log(`✅ ${customers.length} customers created\n`);

    // ============================================
    // CREATE RESTAURANT TABLES
    // ============================================
    console.log('📋 Step 8: Creating 10 restaurant tables...');

    const tables = await Promise.all([
      { tableNumber: '1', name: 'Main-1', capacity: 4, x: 10, y: 10, floor: 1 },
      { tableNumber: '2', name: 'Main-2', capacity: 4, x: 20, y: 10, floor: 1 },
      { tableNumber: '3', name: 'Main-3', capacity: 6, x: 30, y: 10, floor: 1 },
      { tableNumber: '4', name: 'Main-4', capacity: 6, x: 40, y: 10, floor: 1 },
      { tableNumber: '5', name: 'Main-5', capacity: 2, x: 50, y: 10, floor: 1 },
      { tableNumber: '6', name: 'Main-6', capacity: 2, x: 60, y: 10, floor: 1 },
      { tableNumber: '7', name: 'Terrace-1', capacity: 4, x: 10, y: 30, floor: 2 },
      { tableNumber: '8', name: 'Terrace-2', capacity: 4, x: 20, y: 30, floor: 2 },
      { tableNumber: '9', name: 'Terrace-3', capacity: 6, x: 30, y: 30, floor: 2 },
      { tableNumber: '10', name: 'Private-1', capacity: 12, x: 50, y: 30, floor: 3 }
    ].map(t => prisma.table.create({
      data: {
        tableNumber: t.tableNumber,
        tableName: t.name,
        capacity: t.capacity,
        positionX: t.x,
        positionY: t.y,
        floor: t.floor,
        status: 'AVAILABLE',
        tenantId: tenant.id
      }
    })));

    console.log(`✅ ${tables.length} tables created\n`);

    // ============================================
    // CREATE MENU CATEGORIES & ITEMS
    // ============================================
    console.log('📋 Step 9: Creating menu structure...');

    const categories = await Promise.all([
      { name: 'قهوه', seq: 1 },
      { name: 'چای', seq: 2 },
      { name: 'نوشیدنی‌های سرد', seq: 3 },
      { name: 'شیرینی', seq: 4 },
      { name: 'آجیل', seq: 5 }
    ].map(c => prisma.menuCategory.create({
      data: {
        name: c.name,
        displayOrder: c.seq,
        isActive: true,
        tenantId: tenant.id
      }
    })));

    const menuItems = [];
    
    // Coffee items
    for (const cat of categories) {
      if (cat.name === 'قهوه') {
        const coffeeItems = [
          { name: 'اسپرسو', price: 45000, itemId: items.find(i => i.sku === 'COFFEE-ESPRESSO')?.id },
          { name: 'آمریکانو', price: 50000, itemId: items.find(i => i.sku === 'COFFEE-AMERICANO')?.id },
          { name: 'لاته', price: 55000, itemId: items.find(i => i.sku === 'COFFEE-LATTE')?.id }
        ];
        for (const item of coffeeItems) {
          const mi = await prisma.menuItem.create({
            data: {
              displayName: item.name,
              menuPrice: item.price,
              itemId: item.itemId,
              categoryId: cat.id,
              displayOrder: menuItems.length + 1,
              isActive: true,
              tenantId: tenant.id
            }
          });
          menuItems.push(mi);
        }
      } else if (cat.name === 'چای') {
        const teaItems = [
          { name: 'چای سیاه', price: 35000, itemId: items.find(i => i.sku === 'TEA-BLACK')?.id },
          { name: 'چای سبز', price: 40000, itemId: items.find(i => i.sku === 'TEA-GREEN')?.id }
        ];
        for (const item of teaItems) {
          const mi = await prisma.menuItem.create({
            data: {
              displayName: item.name,
              menuPrice: item.price,
              itemId: item.itemId,
              categoryId: cat.id,
              displayOrder: menuItems.length + 1,
              isActive: true,
              tenantId: tenant.id
            }
          });
          menuItems.push(mi);
        }
      } else if (cat.name === 'شیرینی') {
        const pastryItems = [
          { name: 'کروسان', price: 65000, itemId: items.find(i => i.sku === 'PASTRY-CROISSANT')?.id },
          { name: 'دونات', price: 55000, itemId: items.find(i => i.sku === 'PASTRY-DONUT')?.id }
        ];
        for (const item of pastryItems) {
          const mi = await prisma.menuItem.create({
            data: {
              displayName: item.name,
              menuPrice: item.price,
              itemId: item.itemId,
              categoryId: cat.id,
              displayOrder: menuItems.length + 1,
              isActive: true,
              tenantId: tenant.id
            }
          });
          menuItems.push(mi);
        }
      }
    }

    console.log(`✅ ${categories.length} categories, ${menuItems.length} items created\n`);

    // ============================================
    // CREATE ORDERS (20 orders)
    // ============================================
    console.log('📋 Step 10: Creating 20+ orders...');

    let orderCount = 0;
    for (let d = 0; d < 116; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);

      const ordersToday = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
      for (let o = 0; o < ordersToday; o++) {
        // Pick 1-3 menu items
        const orderItemsCount = Math.floor(Math.random() * 3) + 1;
        const selectedItems = menuItems.sort(() => Math.random() - 0.5).slice(0, orderItemsCount);

        let subtotal = 0;
        for (const item of selectedItems) {
          subtotal += item.menuPrice;
        }

        const vat = Math.floor(subtotal * 0.09);
        const serviceCharge = Math.floor(subtotal * 0.1);
        const total = subtotal + vat + serviceCharge;

        const statuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const order = await prisma.order.create({
          data: {
            tableId: tables[Math.floor(Math.random() * tables.length)].id,
            customerId: customers[Math.floor(Math.random() * customers.length)]?.id,
            orderNumber: `ORD-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(orderCount + 1).padStart(4, '0')}`,
            orderDate: currentDate,
            status: status,
            subtotal: subtotal,
            vat: vat,
            serviceCharge: serviceCharge,
            totalAmount: total,
            paidAmount: status === 'COMPLETED' ? total : 0,
            paymentMethod: status === 'COMPLETED' ? ['CASH', 'CARD', 'ONLINE'][Math.floor(Math.random() * 3)] : null,
            tenantId: tenant.id,
            createdBy: manager.id
          }
        });

        for (const item of selectedItems) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              menuItemId: item.id,
              quantity: 1,
              unitPrice: item.menuPrice,
              totalPrice: item.menuPrice,
              tenantId: tenant.id
            }
          });
        }

        if (['PENDING', 'CONFIRMED', 'PREPARING'].includes(status)) {
          await prisma.kitchenDisplay.create({
            data: {
              orderId: order.id,
              status: status === 'PREPARING' ? 'ACTIVE' : 'PENDING',
              tenantId: tenant.id
            }
          });
        }

        if (status === 'COMPLETED') {
          await prisma.orderPayment.create({
            data: {
              orderId: order.id,
              amount: total,
              method: order.paymentMethod || 'CASH',
              paymentDate: currentDate,
              tenantId: tenant.id,
              recordedBy: manager.id
            }
          });
        }

        orderCount++;
      }
    }

    console.log(`✅ ${orderCount} orders created\n`);

    // ============================================
    // COMPLETION SUMMARY
    // ============================================
    console.log('\n🎉 DIMA TENANT SEED COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Data Summary:');
    console.log(`   ✅ Tenant: ${tenant.name}`);
    console.log(`   ✅ Users: 1 Manager, 1 Staff`);
    console.log(`   ✅ Suppliers: ${suppliers.length}`);
    console.log(`   ✅ Inventory Items: ${items.length}`);
    console.log(`   ✅ Inventory Transactions: ${txnCount}`);
    console.log(`   ✅ Customers: ${customers.length}`);
    console.log(`   ✅ Restaurant Tables: ${tables.length}`);
    console.log(`   ✅ Menu Categories: ${categories.length}`);
    console.log(`   ✅ Menu Items: ${menuItems.length}`);
    console.log(`   ✅ Orders: ${orderCount}`);
    console.log('\n📍 Workspaces Populated:');
    console.log('   ✅ Inventory Management');
    console.log('   ✅ Ordering System');
    console.log('   ✅ Business Intelligence');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: alirezayousefi@dima.ir');
    console.log('   Password: manager123');
    console.log('   Tenant: dima\n');

  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
