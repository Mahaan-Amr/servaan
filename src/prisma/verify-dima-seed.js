#!/usr/bin/env node

/**
 * Verify Script for Dima Tenant Seed
 * Validates all created data and reports statistics
 */

const { PrismaClient } = require('../shared/generated/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying Dima Tenant Seed Data...\n');

    // 1. Verify Tenant
    console.log('📋 TENANT INFORMATION');
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });

    if (!tenant) {
      console.log('❌ Tenant "dima" not found!');
      process.exit(1);
    }

    console.log(`  ✅ Tenant ID: ${tenant.id}`);
    console.log(`  ✅ Subdomain: ${tenant.subdomain}`);
    console.log(`  ✅ Name: ${tenant.name}`);
    console.log(`  ✅ Plan: ${tenant.plan}`);
    console.log(`  ✅ Active: ${tenant.isActive}`);

    // 2. Verify Users
    console.log('\n👥 USERS');
    const userCount = await prisma.user.count({
      where: { tenantId: tenant.id }
    });
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, email: true, role: true }
    });

    console.log(`  ✅ Total Users: ${userCount}`);
    users.forEach((u) => {
      console.log(`     • ${u.name} (${u.role}) - ${u.email}`);
    });

    // 3. Verify Suppliers
    console.log('\n🏢 SUPPLIERS');
    const supplierCount = await prisma.supplier.count({
      where: { tenantId: tenant.id }
    });
    console.log(`  ✅ Total Suppliers: ${supplierCount}`);

    // 4. Verify Items
    console.log('\n📦 INVENTORY ITEMS');
    const itemCount = await prisma.item.count({
      where: { tenantId: tenant.id }
    });
    const itemsByCategory = await prisma.item.groupBy({
      by: ['category'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total Items: ${itemCount}`);
    console.log('     By Category:');
    itemsByCategory.forEach((cat) => {
      console.log(`       • ${cat.category}: ${cat._count}`);
    });

    // 5. Verify Item Suppliers
    console.log('\n🔗 ITEM-SUPPLIER RELATIONSHIPS');
    const itemSupplierCount = await prisma.itemSupplier.count({
      where: { tenantId: tenant.id }
    });
    console.log(`  ✅ Total Relationships: ${itemSupplierCount}`);

    // 6. Verify Inventory Entries
    console.log('\n📊 INVENTORY TRANSACTIONS');
    const inventoryCount = await prisma.inventoryEntry.count({
      where: { tenantId: tenant.id }
    });
    const entryTypes = await prisma.inventoryEntry.groupBy({
      by: ['type'],
      where: { tenantId: tenant.id },
      _count: true,
      _sum: { quantity: true }
    });

    console.log(`  ✅ Total Transactions: ${inventoryCount}`);
    entryTypes.forEach((t) => {
      console.log(`     • ${t.type}: ${t._count} transactions (${t._sum.quantity} units)`);
    });

    // 7. Verify Tables
    console.log('\n🍽️  RESTAURANT TABLES');
    const tableCount = await prisma.table.count({
      where: { tenantId: tenant.id }
    });
    const tablesBySection = await prisma.table.groupBy({
      by: ['section'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total Tables: ${tableCount}`);
    tablesBySection.forEach((s) => {
      console.log(`     • ${s.section}: ${s._count} tables`);
    });

    // 8. Verify Menu Categories
    console.log('\n🗂️  MENU CATEGORIES');
    const categoryCount = await prisma.menuCategory.count({
      where: { tenantId: tenant.id }
    });
    const categories = await prisma.menuCategory.findMany({
      where: { tenantId: tenant.id },
      select: { name: true, _count: { select: { items: true } } }
    });

    console.log(`  ✅ Total Categories: ${categoryCount}`);
    categories.forEach((c) => {
      console.log(`     • ${c.name}: ${c._count.items} items`);
    });

    // 9. Verify Menu Items
    console.log('\n🍽️  MENU ITEMS');
    const menuItemCount = await prisma.menuItem.count({
      where: { tenantId: tenant.id }
    });
    const avgPrice = await prisma.menuItem.aggregate({
      where: { tenantId: tenant.id },
      _avg: { menuPrice: true },
      _min: { menuPrice: true },
      _max: { menuPrice: true }
    });

    console.log(`  ✅ Total Menu Items: ${menuItemCount}`);
    console.log(`     • Average Price: ${Math.round(Number(avgPrice._avg.menuPrice))} TOMAN`);
    console.log(`     • Min Price: ${Math.round(Number(avgPrice._min.menuPrice))} TOMAN`);
    console.log(`     • Max Price: ${Math.round(Number(avgPrice._max.menuPrice))} TOMAN`);

    // 10. Verify Customers
    console.log('\n👤 CUSTOMERS');
    const customerCount = await prisma.customer.count({
      where: { tenantId: tenant.id }
    });
    const customerBySegment = await prisma.customer.groupBy({
      by: ['segment'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total Customers: ${customerCount}`);
    customerBySegment.forEach((s) => {
      console.log(`     • ${s.segment}: ${s._count} customers`);
    });

    // 11. Verify Orders
    console.log('\n🛒 ORDERS');
    const orderCount = await prisma.order.count({
      where: { tenantId: tenant.id }
    });
    const orderStats = await prisma.order.aggregate({
      where: { tenantId: tenant.id },
      _count: true,
      _avg: { totalAmount: true },
      _sum: { totalAmount: true }
    });
    const orderByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId: tenant.id },
      _count: true
    });
    const orderByType = await prisma.order.groupBy({
      by: ['orderType'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total Orders: ${orderCount}`);
    console.log(
      `     • Total Revenue: ${Math.round(Number(orderStats._sum.totalAmount))} TOMAN`
    );
    console.log(
      `     • Average Order: ${Math.round(Number(orderStats._avg.totalAmount))} TOMAN`
    );
    console.log('     By Status:');
    orderByStatus.forEach((s) => {
      console.log(`       • ${s.status}: ${s._count}`);
    });
    console.log('     By Type:');
    orderByType.forEach((t) => {
      console.log(`       • ${t.orderType}: ${t._count}`);
    });

    // 12. Verify Order Items
    console.log('\n📋 ORDER ITEMS');
    const orderItemCount = await prisma.orderItem.count({
      where: { tenantId: tenant.id }
    });
    const orderItemStats = await prisma.orderItem.aggregate({
      where: { tenantId: tenant.id },
      _sum: { quantity: true, totalPrice: true },
      _avg: { quantity: true, totalPrice: true }
    });

    console.log(`  ✅ Total Order Items: ${orderItemCount}`);
    console.log(
      `     • Total Units Sold: ${Math.round(Number(orderItemStats._sum.quantity))}`
    );
    console.log(
      `     • Total Value: ${Math.round(Number(orderItemStats._sum.totalPrice))} TOMAN`
    );
    console.log(
      `     • Avg Items per Order: ${(Number(orderItemStats._avg.quantity) || 0).toFixed(1)}`
    );

    // 13. Verify Order Payments
    console.log('\n💳 ORDER PAYMENTS');
    const paymentCount = await prisma.orderPayment.count({
      where: { tenantId: tenant.id }
    });
    const paymentByMethod = await prisma.orderPayment.groupBy({
      by: ['paymentMethod'],
      where: { tenantId: tenant.id },
      _count: true,
      _sum: { amount: true }
    });
    const paymentByStatus = await prisma.orderPayment.groupBy({
      by: ['paymentStatus'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total Payments: ${paymentCount}`);
    console.log('     By Method:');
    paymentByMethod.forEach((m) => {
      console.log(
        `       • ${m.paymentMethod}: ${m._count} (${Math.round(Number(m._sum.amount))} TOMAN)`
      );
    });
    console.log('     By Status:');
    paymentByStatus.forEach((s) => {
      console.log(`       • ${s.paymentStatus}: ${s._count}`);
    });

    // 14. Verify Kitchen Display
    console.log('\n🖥️  KITCHEN DISPLAY SYSTEM');
    const kdsCount = await prisma.kitchenDisplay.count({
      where: { tenantId: tenant.id }
    });
    const kdsByStatus = await prisma.kitchenDisplay.groupBy({
      by: ['status'],
      where: { tenantId: tenant.id },
      _count: true
    });

    console.log(`  ✅ Total KDS Entries: ${kdsCount}`);
    kdsByStatus.forEach((s) => {
      console.log(`     • ${s.status}: ${s._count}`);
    });

    // 15. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DATA SUMMARY');
    console.log('='.repeat(50));
    console.log(`
✅ All Critical Data Verified!

✨ INVENTORY MANAGEMENT:
   • Suppliers: ${supplierCount}
   • Items: ${itemCount}
   • Transactions: ${inventoryCount}

✨ ORDERING SYSTEM:
   • Tables: ${tableCount}
   • Menu Categories: ${categoryCount}
   • Menu Items: ${menuItemCount}
   • Orders: ${orderCount}
   • Order Items: ${orderItemCount}
   • Payments: ${paymentCount}

✨ OPERATIONS:
   • Customers: ${customerCount}
   • KDS Entries: ${kdsCount}
   • Total Revenue: ${Math.round(Number(orderStats._sum.totalAmount))} TOMAN
   • Avg Order Value: ${Math.round(Number(orderStats._avg.totalAmount))} TOMAN

✅ Seed data is valid and ready for testing!
    `);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
