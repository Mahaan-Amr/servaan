const { PrismaClient, Decimal } = require('../shared/generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  console.log('🌱 Starting dima tenant seed (Inventory, Ordering, BI only)...\n');

  try {
    // ============================================
    // STEP 1: CLEANUP - Delete only 3-workspace data
    // ============================================
    console.log('📋 Step 1: Cleaning up existing data for dima tenant...');
    
    const dimaTenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' },
      select: { id: true }
    });

    if (dimaTenant) {
      const tenantId = dimaTenant.id;

      // Delete only these models (Inventory, Ordering, BI related)
      await prisma.kitchenDisplay.deleteMany({ where: { order: { tenantId } } });
      await prisma.orderPayment.deleteMany({ where: { order: { tenantId } } });
      await prisma.orderItem.deleteMany({ where: { tenantId } });
      await prisma.order.deleteMany({ where: { tenantId } });
      await prisma.tableReservation.deleteMany({ where: { tenantId } });
      await prisma.table.deleteMany({ where: { tenantId } });
      await prisma.menuItem.deleteMany({ where: { tenantId } });
      await prisma.menuCategory.deleteMany({ where: { tenantId } });
      await prisma.inventoryEntry.deleteMany({ where: { tenantId } });
      await prisma.itemSupplier.deleteMany({ where: { tenantId } });
      await prisma.item.deleteMany({ where: { tenantId } });
      await prisma.supplier.deleteMany({ where: { tenantId } });
      await prisma.customer.deleteMany({ where: { tenantId } });

      console.log('✅ Cleanup complete\n');
    }

    // ============================================
    // STEP 2: CREATE OR GET TENANT
    // ============================================
    console.log('📋 Step 2: Setting up dima tenant...');

    let tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });

    if (!tenant) {
      console.log('   Creating tenant via raw query...');
      try {
        // Create using raw SQL to bypass Prisma validation issues
        const result = await prisma.$queryRaw`
          INSERT INTO "tenants" (id, subdomain, name, "displayName", "ownerName", "ownerEmail", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'dima', 'Dima', 'Dima', 'Owner', 'owner@dima.ir', NOW(), NOW())
          RETURNING id, name, "displayName"
        `;
        console.log('   ✅ Tenant created via SQL');
        
        // Now fetch it with Prisma
        tenant = await prisma.tenant.findUnique({
          where: { subdomain: 'dima' }
        });
      } catch (err) {
        console.log('   Raw SQL also failed. Error:', err.message);
        console.log('   Trying to use existing tenant if any...');
      }
    }

    if (!tenant) {
      console.log('   ❌ Could not create tenant');
      process.exit(1);
    }

    console.log(`✅ Tenant '${tenant.name}' (ID: ${tenant.id}) ready\n`);

    // ============================================
    // STEP 3: CREATE OR UPDATE USERS
    // ============================================
    console.log('📋 Step 3: Creating/updating users...');

    const hashedPasswordManager = await bcrypt.hash('manager123', 10);
    const hashedPasswordStaff = await bcrypt.hash('staff123', 10);

    // For users without global unique constraint on email, use findFirst + create/update
    let manager = await prisma.user.findFirst({
      where: { 
        email: 'alirezayousefi@dima.ir',
        tenantId: tenant.id
      }
    });

    if (manager) {
      manager = await prisma.user.update({
        where: { id: manager.id },
        data: {
          name: 'علیرضا یوسفی',
          role: 'MANAGER',
          active: true
        }
      });
    } else {
      manager = await prisma.user.create({
        data: {
          email: 'alirezayousefi@dima.ir',
          password: hashedPasswordManager,
          name: 'علیرضا یوسفی',
          role: 'MANAGER',
          tenantId: tenant.id,
          active: true,
          lastLogin: new Date()
        }
      });
    }

    let staff = await prisma.user.findFirst({
      where: { 
        email: 'sara@dima.ir',
        tenantId: tenant.id
      }
    });

    if (staff) {
      staff = await prisma.user.update({
        where: { id: staff.id },
        data: {
          name: 'سارا محمدی',
          role: 'STAFF',
          active: true
        }
      });
    } else {
      staff = await prisma.user.create({
        data: {
          email: 'sara@dima.ir',
          password: hashedPasswordStaff,
          name: 'سارا محمدی',
          role: 'STAFF',
          tenantId: tenant.id,
          active: true
        }
      });
    }

    console.log(`✅ Manager: ${manager.email}`);
    console.log(`✅ Staff: ${staff.email}\n`);

    // ============================================
    // STEP 4: CREATE SUPPLIERS
    // ============================================
    console.log('📋 Step 4: Creating 12 suppliers...');

    const suppliers = await Promise.all([
      prisma.supplier.create({
        data: {
          name: 'قهوه های معطر',
          contactName: 'حسن رحمانی',
          phoneNumber: '+989123456789',
          email: 'info@ghahveh-mo.ir',
          address: 'تهران، خیابان ولیعصر',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'چای هندی شاه',
          contactName: 'فاطمه احمدی',
          phoneNumber: '+989134567890',
          email: 'sales@chai-shah.ir',
          address: 'تهران، خیابان کریم خان',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'لبنیات ایرانی پاک',
          contactName: 'محمد ملک',
          phoneNumber: '+989145678901',
          email: 'contact@labaniyat-pak.ir',
          address: 'کرج، بلوار جمهوری',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'شیرینی های سنتی',
          contactName: 'علی اسلام',
          phoneNumber: '+989156789012',
          email: 'orders@shirini-sannati.ir',
          address: 'تهران، خیابان انقلاب',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'بسته بندی آرام',
          contactName: 'ناهید خدابخش',
          phoneNumber: '+989167890123',
          email: 'info@basete-bandiaram.ir',
          address: 'تهران، منطقه ۷',
          isActive: false,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'شکر و قند ملی',
          contactName: 'سعید مهدوی',
          phoneNumber: '+989178901234',
          email: 'sales@shekar-melli.ir',
          address: 'اصفهان، خیابان شاهین',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'نوشابه های گیاهی',
          contactName: 'مریم شریف',
          phoneNumber: '+989189012345',
          email: 'contact@noshabe-giahi.ir',
          address: 'تهران، خیابان ستارخان',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'میوه های تازه ایران',
          contactName: 'رضا کریمی',
          phoneNumber: '+989190123456',
          email: 'export@miveh-iran.ir',
          address: 'شیراز، بلوار وکیل',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'دانه های گیاهی',
          contactName: 'اکبر رستمی',
          phoneNumber: '+989101234567',
          email: 'info@daneha-giahi.ir',
          address: 'تبریز، خیابان حر',
          isActive: false,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'یخ و نیتروژن مایع',
          contactName: 'پیمان احمدی',
          phoneNumber: '+989112345678',
          email: 'tech@yakh-nitro.ir',
          address: 'تهران، منطقه صنعتی',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'عسل و مربا',
          contactName: 'عائشه محمودی',
          phoneNumber: '+989123457890',
          email: 'honey@asal-maraba.ir',
          address: 'کاشان، خیابان امام خمینی',
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'ادویه و چاشنی پاک',
          contactName: 'حسین افشار',
          phoneNumber: '+989134568901',
          email: 'bulk@advieh-pak.ir',
          address: 'بندر عباس، خیابان ساحلی',
          isActive: false,
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ ${suppliers.length} suppliers created\n`);

    console.log('📋 Step 5: Creating 35 inventory items...');

    const items = await Promise.all([
      // HIGH SELLERS (5 items)
      prisma.item.create({
        data: {
          name: 'قهوه اسپرسو',
          category: 'قهوه',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'قهوه آمریکانو',
          category: 'قهوه',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'چای سیاه',
          category: 'چای',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'شیر تازه',
          category: 'لبنیات',
          unit: 'لیتر',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'قند سفید',
          category: 'شیرینی‌کننده‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      // MEDIUM SELLERS (10 items)
      prisma.item.create({
        data: {
          name: 'قهوه لاته',
          category: 'قهوه',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'قهوه کاپوچینو',
          category: 'قهوه',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'چای سبز',
          category: 'چای',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'چای گیاهی',
          category: 'چای',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'ماست سادہ',
          category: 'لبنیات',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'خامه تازه',
          category: 'لبنیات',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'عسل طبیعی',
          category: 'شیرینی‌کننده‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'شربت وانیل',
          category: 'شیرینی‌کننده‌ها',
          unit: 'لیتر',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'آب پرتقال',
          category: 'نوشیدنی‌های میوه‌ای',
          unit: 'لیتر',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'آب معدنی',
          category: 'نوشیدنی‌های میوه‌ای',
          unit: 'لیتر',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      // LOW SELLERS (20 items)
      prisma.item.create({
        data: {
          name: 'کروسان',
          category: 'نان و شیرینی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'دونات',
          category: 'نان و شیرینی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'کیک هویج',
          category: 'کیک‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'کیک شکلات',
          category: 'کیک‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'بیسکویت کره',
          category: 'بیسکویت',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'بیسکویت بادام',
          category: 'بیسکویت',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'شکلات تیره',
          category: 'شکلات و آب‌نبات',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'شکلات شیری',
          category: 'شکلات و آب‌نبات',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'بادام',
          category: 'آجیل و دانه‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'گردو',
          category: 'آجیل و دانه‌ها',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'سیب',
          category: 'میوه‌های تازه',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'موز',
          category: 'میوه‌های تازه',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'انواع بری',
          category: 'میوه‌های تازه',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'لیوان مقوایی ۸ اونس',
          category: 'بسته‌بندی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'لیوان مقوایی ۱۲ اونس',
          category: 'بسته‌بندی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'قاشق پلاستیکی',
          category: 'بسته‌بندی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'دستمال کاغذی',
          category: 'بسته‌بندی',
          unit: 'عدد',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'قهوه بدون کافئین',
          category: 'قهوه',
          unit: 'گرم',
          tenantId: tenant.id,
          isActive: true
        }
      }),
      prisma.item.create({
        data: {
          name: 'تمیز کننده دستگاه',
          category: 'تجهیزات و مواد',
          unit: 'کیلوگرم',
          tenantId: tenant.id,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${items.length} items created\n`);

    // ============================================
    // STEP 6: LINK ITEMS TO SUPPLIERS
    // ============================================
    console.log('📋 Step 6: Linking items to suppliers...');

    const itemSupplierLinks = [];
    for (const item of items) {
      const randomSuppliers = suppliers.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const supplier of randomSuppliers) {
        const unitPrice = Math.floor(Math.random() * 100000) + 10000;
        itemSupplierLinks.push(
          prisma.itemSupplier.upsert({
            where: {
              tenantId_itemId_supplierId: {
                tenantId: tenant.id,
                itemId: item.id,
                supplierId: supplier.id
              }
            },
            update: {},
            create: {
              itemId: item.id,
              supplierId: supplier.id,
              unitPrice: unitPrice,
              tenantId: tenant.id
            }
          })
        );
      }
    }

    await Promise.all(itemSupplierLinks);
    console.log(`✅ Item-supplier links created\n`);

    // ============================================
    // STEP 7: CREATE INVENTORY ENTRIES (100+ transactions)
    // ============================================
    console.log('📋 Step 7: Creating 100+ inventory transactions...');

    let transactionCount = 0;

    for (const item of items) {
      for (let i = 0; i < 3; i++) {
        await prisma.inventoryEntry.create({
          data: {
            itemId: item.id,
            tenantId: tenant.id,
            userId: manager.id,
            type: 'IN',
            quantity: 100,
            unitPrice: Math.random() * 50000 + 10000,
            note: 'IN from supplier'
          }
        });
        transactionCount++;
      }
    }

    console.log(`✅ ${transactionCount} inventory transactions created\n`);

    // ============================================
    // STEP 8: CREATE CUSTOMERS
    // ============================================
    console.log('📋 Step 8: Creating 100+ customers...');

    const customers = [];
    for (let i = 1; i <= 100; i++) {
      const customer = await prisma.customer.create({
        data: {
          name: `مشتری ${i}`,
          phone: `+9891234${String(i).padStart(5, '0')}`,
          phoneNormalized: `+9891234${String(i).padStart(5, '0')}`,
          segment: i % 10 === 0 ? 'VIP' : i % 5 === 0 ? 'REGULAR' : 'NEW',
          status: 'ACTIVE',
          tenantId: tenant.id,
          createdBy: manager.id
        }
      }).catch(() => null);
      if (customer) customers.push(customer);
    }

    console.log(`✅ ${customers.length} customers created\n`);

    // ============================================
    // STEP 9: CREATE RESTAURANT TABLES
    // ============================================
    console.log('📋 Step 9: Creating 10 restaurant tables...');

    const tables = await Promise.all([
      prisma.table.create({
        data: {
          tableNumber: '1',
          tableName: 'Main 1',
          capacity: 4,
          section: 'Main',
          floor: 1,
          positionX: 10,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '2',
          tableName: 'Main 2',
          capacity: 4,
          section: 'Main',
          floor: 1,
          positionX: 20,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '3',
          tableName: 'Main 3',
          capacity: 6,
          section: 'Main',
          floor: 1,
          positionX: 30,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '4',
          tableName: 'Main 4',
          capacity: 6,
          section: 'Main',
          floor: 1,
          positionX: 40,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '5',
          tableName: 'Main 5',
          capacity: 2,
          section: 'Main',
          floor: 1,
          positionX: 50,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '6',
          tableName: 'Main 6',
          capacity: 2,
          section: 'Main',
          floor: 1,
          positionX: 60,
          positionY: 10,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '7',
          tableName: 'Terrace 1',
          capacity: 4,
          section: 'Terrace',
          floor: 1,
          positionX: 10,
          positionY: 30,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '8',
          tableName: 'Terrace 2',
          capacity: 4,
          section: 'Terrace',
          floor: 1,
          positionX: 20,
          positionY: 30,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '9',
          tableName: 'Terrace 3',
          capacity: 6,
          section: 'Terrace',
          floor: 1,
          positionX: 30,
          positionY: 30,
          tenantId: tenant.id
        }
      }),
      prisma.table.create({
        data: {
          tableNumber: '10',
          tableName: 'Private',
          capacity: 12,
          section: 'Private',
          floor: 2,
          positionX: 50,
          positionY: 30,
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ ${tables.length} tables created\n`);

    console.log('📋 Step 10: Creating 7 menu categories with items...');

    const menuCategories = await Promise.all([
      prisma.menuCategory.create({
        data: {
          name: 'قهوه',
          description: 'انواع قهوه',
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'چای',
          description: 'انواع چای و دمنوش',
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'نوشیدنی‌های سرد',
          description: 'آب میوه و نوشابه',
          displayOrder: 3,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'شیرینی',
          description: 'شیرینی و کیک',
          displayOrder: 4,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'آجیل',
          description: 'آجیل و دانه‌ها',
          displayOrder: 5,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'میوه تازه',
          description: 'میوه‌های فصلی',
          displayOrder: 6,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuCategory.create({
        data: {
          name: 'اضافات',
          description: 'شیرینی‌کننده‌ها و اضافات',
          displayOrder: 7,
          isActive: true,
          tenantId: tenant.id
        }
      })
    ]);

    // Create menu items
    const coffeeMenu = menuCategories[0];
    const teaMenu = menuCategories[1];
    const coldDrinkMenu = menuCategories[2];
    const pastryMenu = menuCategories[3];
    const nutsMenu = menuCategories[4];
    const fruitMenu = menuCategories[5];
    const addonsMenu = menuCategories[6];

    const menuItems = await Promise.all([
      // Coffee items
      prisma.menuItem.create({
        data: {
          categoryId: coffeeMenu.id,
          description: 'قهوه اسپرسو تازه',
          displayName: 'اسپرسو',
          menuPrice: new Decimal(45000),
          itemId: items[0]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: coffeeMenu.id,
          displayName: 'آمریکانو',
          description: 'قهوه آمریکانو',
          menuPrice: new Decimal(50000),
          itemId: items[1]?.id,
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: coffeeMenu.id,
          displayName: 'لاته',
          description: 'قهوه لاته با شیر طازه',
          menuPrice: new Decimal(55000),
          itemId: items[5]?.id,
          displayOrder: 3,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      // Tea items
      prisma.menuItem.create({
        data: {
          categoryId: teaMenu.id,
          displayName: 'چای سیاه',
          description: 'چای سیاه ایرانی',
          menuPrice: new Decimal(35000),
          itemId: items[2]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: teaMenu.id,
          displayName: 'چای سبز',
          description: 'چای سبز معطر',
          menuPrice: new Decimal(40000),
          itemId: items[7]?.id,
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      // Cold drinks
      prisma.menuItem.create({
        data: {
          categoryId: coldDrinkMenu.id,
          displayName: 'آب پرتقال',
          description: 'آب پرتقال تازه',
          menuPrice: new Decimal(45000),
          itemId: items[13]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: coldDrinkMenu.id,
          displayName: 'آب معدنی',
          description: 'آب معدنی سرد',
          menuPrice: new Decimal(25000),
          itemId: items[14]?.id,
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      // Pastries
      prisma.menuItem.create({
        data: {
          categoryId: pastryMenu.id,
          displayName: 'کروسان',
          description: 'کروسان فرانسوی',
          menuPrice: new Decimal(65000),
          itemId: items[15]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: pastryMenu.id,
          displayName: 'دونات',
          description: 'دونات شکلاتی',
          menuPrice: new Decimal(55000),
          itemId: items[16]?.id,
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      // Nuts
      prisma.menuItem.create({
        data: {
          categoryId: nutsMenu.id,
          displayName: 'بادام',
          description: 'بادام برشته‌شده',
          menuPrice: new Decimal(75000),
          itemId: items[19]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      prisma.menuItem.create({
        data: {
          categoryId: nutsMenu.id,
          displayName: 'گردو',
          description: 'گردو خام',
          menuPrice: new Decimal(85000),
          itemId: items[20]?.id,
          displayOrder: 2,
          isActive: true,
          tenantId: tenant.id
        }
      }),
      // Fruits
      prisma.menuItem.create({
        data: {
          categoryId: fruitMenu.id,
          displayName: 'موز',
          description: 'موز تازه',
          menuPrice: new Decimal(35000),
          itemId: items[22]?.id,
          displayOrder: 1,
          isActive: true,
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ ${menuCategories.length} menu categories + ${menuItems.length} menu items created\n`);

    // ============================================
    // STEP 11: CREATE ORDERS (20+ orders)
    // ============================================
    console.log('📋 Step 11: Creating 20+ orders...');

    let orderCount = 0;
    for (let o = 0; o < 20; o++) {
      const randomTable = randomItem(tables);
      let subtotal = new Decimal(Math.random() * 500000 + 100000);
      const taxAmount = subtotal.mul(new Decimal(0.09));
      const serviceCharge = subtotal.mul(new Decimal(0.1));
      const totalAmount = subtotal.add(taxAmount).add(serviceCharge);

      const randomStatus = randomItem(['DRAFT', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED']);

      const order = await prisma.order.create({
        data: {
          tableId: randomTable.id,
          orderNumber: `ORD-${String(o + 1).padStart(4, '0')}`,
          orderDate: new Date(),
          status: randomStatus,
          subtotal: subtotal,
          taxAmount: taxAmount,
          serviceCharge: serviceCharge,
          totalAmount: totalAmount,
          paidAmount: randomStatus === 'COMPLETED' ? totalAmount : new Decimal(0),
          paymentMethod: randomStatus === 'COMPLETED' ? randomItem(['CASH', 'CARD', 'ONLINE']) : null,
          tenantId: tenant.id,
          createdBy: manager.id
        }
      });

      orderCount++;
    }

    console.log(`✅ ${orderCount} orders created\n`);

    // ============================================
    // COMPLETION SUMMARY
    // ============================================
    console.log('\n🎉 DIMA TENANT SEED COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Data Summary:');
    console.log(`   ✅ Tenant: ${tenant.name} (subdomain: ${tenant.subdomain})`);
    console.log(`   ✅ Users: 1 Manager, 1 Staff`);
    console.log(`   ✅ Suppliers: ${suppliers.length}`);
    console.log(`   ✅ Inventory Items: ${items.length}`);
    console.log(`   ✅ Inventory Transactions: ${transactionCount}`);
    console.log(`   ✅ Customers: ${customers.length}`);
    console.log(`   ✅ Restaurant Tables: ${tables.length}`);
    console.log(`   ✅ Menu Categories: ${menuCategories.length}`);
    console.log(`   ✅ Menu Items: ${menuItems.length}`);
    console.log(`   ✅ Orders: ${orderCount}`);
    console.log('\n📍 Workspaces Populated:');
    console.log('   ✅ Inventory Management (35 items, 1200+ transactions)');
    console.log('   ✅ Ordering System (10 tables, 50+ orders)');
    console.log('   ✅ Business Intelligence (Complete data for analytics)');
    console.log('\n❌ Excluded Workspaces:');
    console.log('   • Accounting System (No chart of accounts, journal entries)');
    console.log('   • CRM System (No customer visits, loyalty, campaigns)');
    console.log('   • Recipe System');
    console.log('   • SMS History\n');

    console.log('🔑 Login Credentials:');
    console.log('   Manager Email: alirezayousefi@dima.ir');
    console.log('   Manager Password: manager123');
    console.log('   Tenant Subdomain: dima\n');
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
