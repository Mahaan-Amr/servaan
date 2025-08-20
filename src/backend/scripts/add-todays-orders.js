const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTodaysOrders() {
  try {
    console.log('🛒 Adding sample orders for today...');

    // Get the first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('❌ No tenant found');
      return;
    }

    // Get some menu items
    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId: tenant.id, isActive: true },
      take: 5
    });

    if (menuItems.length === 0) {
      console.error('❌ No menu items found');
      return;
    }

    // Get some users
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      take: 3
    });

    if (users.length === 0) {
      console.error('❌ No users found');
      return;
    }

    // Get some tables
    const tables = await prisma.table.findMany({
      where: { tenantId: tenant.id },
      take: 3
    });

    // Get some customers
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      take: 3
    });

    // Create today's orders
    const today = new Date();
    const orderConfigs = [
      {
        status: 'COMPLETED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItems[0], qty: 2 }, { menuItem: menuItems[1], qty: 1 }],
        payment: 'PAID',
        method: 'CASH',
        hoursAgo: 2
      },
      {
        status: 'COMPLETED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItems[2], qty: 1 }],
        payment: 'PAID',
        method: 'CARD',
        hoursAgo: 4
      },
      {
        status: 'SERVED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItems[3], qty: 1 }, { menuItem: menuItems[4], qty: 2 }],
        payment: 'PAID',
        method: 'ONLINE',
        hoursAgo: 1
      },
      {
        status: 'PREPARING',
        type: 'TAKEAWAY',
        items: [{ menuItem: menuItems[0], qty: 1 }],
        payment: 'PENDING',
        method: 'CASH',
        hoursAgo: 0.5
      },
      {
        status: 'PENDING',
        type: 'DINE_IN',
        items: [{ menuItem: menuItems[1], qty: 3 }],
        payment: 'PENDING',
        method: 'CARD',
        hoursAgo: 0.1
      }
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
        const itemTotal = Number(item.menuItem.menuPrice) * item.qty;
        subtotal += itemTotal;
        orderItems.push({
          itemId: item.menuItem.itemId,
          itemName: item.menuItem.displayName,
          quantity: item.qty,
          unitPrice: Number(item.menuItem.menuPrice),
          totalPrice: itemTotal,
          modifiers: '[]',
          lineNumber: orderItems.length + 1
        });
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
        priority: 0,
        customerId: customers.length > 0 ? customers[i % customers.length]?.id : null,
        customerName: customers.length > 0 ? customers[i % customers.length]?.name : 'مشتری نقدی',
        customerPhone: customers.length > 0 ? customers[i % customers.length]?.phone : null,
        tableId: tables.length > 0 ? tables[i % tables.length]?.id : null,
        guestCount: config.type === 'DINE_IN' ? Math.floor(Math.random() * 4) + 1 : 1,
        subtotal,
        taxAmount,
        serviceCharge,
        totalAmount,
        paymentStatus: config.payment,
        paymentMethod: config.method,
        paidAmount: config.payment === 'PAID' ? totalAmount : 0,
        orderDate,
        estimatedTime: orderItems.reduce((sum, item) => sum + 5, 0),
        createdBy: users[i % users.length].id,
        servedBy: ['COMPLETED', 'SERVED'].includes(config.status) ? users[i % users.length].id : null,
        startedAt: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 5 * 60 * 1000) : null,
        readyAt: ['READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 15 * 60 * 1000) : null,
        servedAt: ['SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 20 * 60 * 1000) : null,
        completedAt: config.status === 'COMPLETED' ? new Date(orderDate.getTime() + 25 * 60 * 1000) : null,
        notes: `سفارش ${config.type === 'DINE_IN' ? 'حضوری' : 'بیرون‌بر'}`,
        kitchenNotes: null
      };

      const order = await prisma.order.create({
        data: {
          ...orderData,
          items: {
            create: orderItems
          }
        }
      });

      console.log(`✅ Created order ${order.orderNumber} with status ${order.status}`);
    }

    console.log('🎉 Today\'s orders created successfully!');
    console.log('📊 Dashboard should now show real statistics');

  } catch (error) {
    console.error('❌ Error creating today\'s orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTodaysOrders(); 