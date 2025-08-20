import { PrismaClient } from '../../shared/generated/client/index';

const prisma = new PrismaClient();

async function checkDataIntegrity() {
  console.log('🔍 Starting comprehensive data integrity check...\n');

  try {
    // Check Products
    console.log('📦 PRODUCTS DATA:');
    const productCount = await prisma.product.count();
    const products = await prisma.product.findMany({
      take: 3,
      include: {
        category: true,
        supplier: true
      }
    });
    console.log(`Total products: ${productCount}`);
    console.log('Sample products:', products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stockQuantity,
      category: p.category?.name,
      supplier: p.supplier?.name
    })));
    console.log('');

    // Check Categories
    console.log('📂 CATEGORIES DATA:');
    const categoryCount = await prisma.category.count();
    const categories = await prisma.category.findMany({ take: 5 });
    console.log(`Total categories: ${categoryCount}`);
    console.log('Sample categories:', categories.map((c: any) => ({ id: c.id, name: c.name })));
    console.log('');

    // Check Suppliers
    console.log('🏢 SUPPLIERS DATA:');
    const supplierCount = await prisma.supplier.count();
    const suppliers = await prisma.supplier.findMany({ take: 3 });
    console.log(`Total suppliers: ${supplierCount}`);
    console.log('Sample suppliers:', suppliers.map((s: any) => ({ id: s.id, name: s.name, contactEmail: s.contactEmail })));
    console.log('');

    // Check Sales
    console.log('💰 SALES DATA:');
    const saleCount = await prisma.sale.count();
    const sales = await prisma.sale.findMany({
      take: 3,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    console.log(`Total sales: ${saleCount}`);
    console.log('Sample sales:', sales.map((s: any) => ({
      id: s.id,
      date: s.saleDate,
      total: s.totalAmount,
      customer: s.customer?.name,
      itemCount: s.items.length
    })));
    console.log('');

    // Check Customers
    console.log('👥 CUSTOMERS DATA:');
    const customerCount = await prisma.customer.count();
    const customers = await prisma.customer.findMany({
      take: 3,
      include: {
        loyalty: true
      }
    });
    console.log(`Total customers: ${customerCount}`);
    console.log('Sample customers:', customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      segment: c.segment,
      loyalty: c.loyalty ? {
        points: c.loyalty.currentPoints,
        totalVisits: c.loyalty.totalVisits,
        lifetimeSpent: c.loyalty.lifetimeSpent
      } : null
    })));
    console.log('');

    // Check Inventory Transactions
    console.log('📋 INVENTORY TRANSACTIONS:');
    const inventoryCount = await prisma.inventoryTransaction.count();
    const inventory = await prisma.inventoryTransaction.findMany({
      take: 3,
      include: {
        product: true
      }
    });
    console.log(`Total inventory transactions: ${inventoryCount}`);
    console.log('Sample inventory transactions:', inventory.map((i: any) => ({
      id: i.id,
      type: i.type,
      quantity: i.quantity,
      product: i.product?.name,
      date: i.date
    })));
    console.log('');

    // Check Financial Records
    console.log('�� FINANCIAL DATA:');
    const journalCount = await prisma.journalEntry.count();
    const journalEntries = await prisma.journalEntry.findMany({
      take: 3,
      include: {
        transactions: true
      }
    });
    console.log(`Total journal entries: ${journalCount}`);
    console.log('Sample journal entries:', journalEntries.map((j: any) => ({
      id: j.id,
      description: j.description,
      amount: j.totalAmount,
      date: j.entryDate,
      transactionCount: j.transactions.length
    })));
    console.log('');

    // Summary
    console.log('📊 DATA SUMMARY:');
    console.log(`Products: ${productCount}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Suppliers: ${supplierCount}`);
    console.log(`Sales: ${saleCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Inventory Transactions: ${inventoryCount}`);
    console.log(`Journal Entries: ${journalCount}`);

    if (productCount === 0 || saleCount === 0 || customerCount === 0) {
      console.log('\n🚨 WARNING: Critical data missing! Database appears to be empty or corrupted.');
    } else {
      console.log('\n✅ Database contains data. Issue might be in API layer or frontend.');
    }

  } catch (error) {
    console.error('❌ Error checking data integrity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataIntegrity(); 