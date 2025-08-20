const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/servaan'
});

async function addTodaysOrders() {
  try {
    console.log('🛒 Adding sample orders for today...');

    // Get the first tenant
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant found');
      return;
    }
    const tenantId = tenantResult.rows[0].id;

    // Get some menu items
    const menuItemsResult = await pool.query(
      'SELECT id, "itemId", "displayName", "menuPrice" FROM "menuItems" WHERE "tenantId" = $1 AND "isActive" = true LIMIT 5',
      [tenantId]
    );

    if (menuItemsResult.rows.length === 0) {
      console.error('❌ No menu items found');
      return;
    }

    // Get some users
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE "tenantId" = $1 LIMIT 3',
      [tenantId]
    );

    if (usersResult.rows.length === 0) {
      console.error('❌ No users found');
      return;
    }

    // Get some tables
    const tablesResult = await pool.query(
      'SELECT id FROM tables WHERE "tenantId" = $1 LIMIT 3',
      [tenantId]
    );

    // Get some customers
    const customersResult = await pool.query(
      'SELECT id, name, phone FROM customers WHERE "tenantId" = $1 LIMIT 3',
      [tenantId]
    );

    // Create today's orders
    const today = new Date();
    const orderConfigs = [
      {
        status: 'COMPLETED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItemsResult.rows[0], qty: 2 }, { menuItem: menuItemsResult.rows[1], qty: 1 }],
        payment: 'PAID',
        method: 'CASH',
        hoursAgo: 2
      },
      {
        status: 'COMPLETED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItemsResult.rows[2], qty: 1 }],
        payment: 'PAID',
        method: 'CARD',
        hoursAgo: 4
      },
      {
        status: 'SERVED',
        type: 'DINE_IN',
        items: [{ menuItem: menuItemsResult.rows[3], qty: 1 }, { menuItem: menuItemsResult.rows[4], qty: 2 }],
        payment: 'PAID',
        method: 'ONLINE',
        hoursAgo: 1
      },
      {
        status: 'PREPARING',
        type: 'TAKEAWAY',
        items: [{ menuItem: menuItemsResult.rows[0], qty: 1 }],
        payment: 'PENDING',
        method: 'CASH',
        hoursAgo: 0.5
      },
      {
        status: 'PENDING',
        type: 'DINE_IN',
        items: [{ menuItem: menuItemsResult.rows[1], qty: 3 }],
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
      
      const customerId = customersResult.rows.length > 0 ? customersResult.rows[i % customersResult.rows.length]?.id : null;
      const customerName = customersResult.rows.length > 0 ? customersResult.rows[i % customersResult.rows.length]?.name : 'مشتری نقدی';
      const customerPhone = customersResult.rows.length > 0 ? customersResult.rows[i % customersResult.rows.length]?.phone : null;
      const tableId = tablesResult.rows.length > 0 ? tablesResult.rows[i % tablesResult.rows.length]?.id : null;
      const createdBy = usersResult.rows[i % usersResult.rows.length].id;
      
      // Insert order
      const orderResult = await pool.query(`
        INSERT INTO orders (
          "tenantId", "orderNumber", "orderType", "status", "priority",
          "customerId", "customerName", "customerPhone", "tableId", "guestCount",
          "subtotal", "taxAmount", "serviceCharge", "totalAmount",
          "paymentStatus", "paymentMethod", "paidAmount", "orderDate",
          "estimatedTime", "createdBy", "servedBy",
          "startedAt", "readyAt", "servedAt", "completedAt",
          "notes", "kitchenNotes"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        RETURNING id
      `, [
        tenantId, orderNumber, config.type, config.status, 0,
        customerId, customerName, customerPhone, tableId, config.type === 'DINE_IN' ? Math.floor(Math.random() * 4) + 1 : 1,
        subtotal, taxAmount, serviceCharge, totalAmount,
        config.payment, config.method, config.payment === 'PAID' ? totalAmount : 0, orderDate,
        orderItems.reduce((sum, item) => sum + 5, 0), createdBy,
        ['COMPLETED', 'SERVED'].includes(config.status) ? createdBy : null,
        ['PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 5 * 60 * 1000) : null,
        ['READY', 'SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 15 * 60 * 1000) : null,
        ['SERVED', 'COMPLETED'].includes(config.status) ? new Date(orderDate.getTime() + 20 * 60 * 1000) : null,
        config.status === 'COMPLETED' ? new Date(orderDate.getTime() + 25 * 60 * 1000) : null,
        `سفارش ${config.type === 'DINE_IN' ? 'حضوری' : 'بیرون‌بر'}`, null
      ]);

      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of orderItems) {
        await pool.query(`
          INSERT INTO "orderItems" (
            "orderId", "itemId", "itemName", "quantity", "unitPrice",
            "totalPrice", "modifiers", "lineNumber"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          orderId, item.itemId, item.itemName, item.quantity, item.unitPrice,
          item.totalPrice, item.modifiers, item.lineNumber
        ]);
      }

      console.log(`✅ Created order ${orderNumber} with status ${config.status}`);
    }

    console.log('🎉 Today\'s orders created successfully!');
    console.log('📊 Dashboard should now show real statistics');

  } catch (error) {
    console.error('❌ Error creating today\'s orders:', error);
  } finally {
    await pool.end();
  }
}

addTodaysOrders(); 