const { PrismaClient } = require('../../shared/generated/client');

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 Quick Database Check...\n');
    
    const productCount = await prisma.product.count();
    const saleCount = await prisma.sale.count();
    const customerCount = await prisma.customer.count();
    const categoryCount = await prisma.category.count();
    
    console.log('📊 COUNTS:');
    console.log(`Products: ${productCount}`);
    console.log(`Sales: ${saleCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Categories: ${categoryCount}`);
    
    if (productCount === 0) {
      console.log('\n🚨 NO PRODUCTS FOUND!');
    }
    
    if (saleCount === 0) {
      console.log('\n🚨 NO SALES FOUND!');
    }
    
    // Sample data check
    if (productCount > 0) {
      const sampleProduct = await prisma.product.findFirst();
      console.log('\n📦 Sample Product:', {
        id: sampleProduct.id,
        name: sampleProduct.name,
        price: sampleProduct.price,
        stock: sampleProduct.stockQuantity
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck(); 