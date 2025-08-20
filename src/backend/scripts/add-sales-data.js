const { PrismaClient } = require('../../shared/generated/client');

const prisma = new PrismaClient();

async function addSalesData() {
  try {
    console.log('🛒 Adding more sales data for ABC analysis...');

    // Get all items and users
    const items = await prisma.item.findMany({ where: { isActive: true } });
    const users = await prisma.user.findMany();
    
    if (items.length === 0 || users.length === 0) {
      console.log('❌ No items or users found. Please run the seed script first.');
      return;
    }

    const salesUser = users.find(u => u.email.includes('sales')) || users[0];
    const staffUser = users.find(u => u.email.includes('staff')) || users[1];

    // Create realistic sales data for the last 30 days
    const salesData = [];
    const now = new Date();

    // High-selling items (Category A - 80% of sales)
    const highSellingItems = items.slice(0, Math.ceil(items.length * 0.2)); // Top 20% of items
    
    // Medium-selling items (Category B - 15% of sales)
    const mediumSellingItems = items.slice(
      Math.ceil(items.length * 0.2), 
      Math.ceil(items.length * 0.5)
    ); // Next 30% of items
    
    // Low-selling items (Category C - 5% of sales)
    const lowSellingItems = items.slice(Math.ceil(items.length * 0.5)); // Remaining 50% of items

    // Generate sales for high-selling items (frequent, high-value sales)
    for (const item of highSellingItems) {
      for (let day = 0; day < 30; day++) {
        const saleDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        
        // 2-5 sales per day for high-selling items
        const salesCount = Math.floor(Math.random() * 4) + 2;
        
        for (let sale = 0; sale < salesCount; sale++) {
          const quantity = Math.floor(Math.random() * 10) + 5; // 5-15 units
          const unitPrice = Math.floor(Math.random() * 50000) + 20000; // 20,000-70,000 تومان
          
          salesData.push({
            itemId: item.id,
            quantity: quantity,
            type: 'OUT',
            note: `فروش روزانه - ${item.name}`,
            unitPrice: unitPrice,
            userId: Math.random() > 0.5 ? salesUser.id : staffUser.id,
            createdAt: new Date(saleDate.getTime() + sale * 60 * 60 * 1000), // Spread throughout the day
            updatedAt: new Date(saleDate.getTime() + sale * 60 * 60 * 1000)
          });
        }
      }
    }

    // Generate sales for medium-selling items (moderate sales)
    for (const item of mediumSellingItems) {
      for (let day = 0; day < 30; day++) {
        const saleDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        
        // 0-2 sales per day for medium-selling items (not every day)
        if (Math.random() > 0.3) { // 70% chance of sale on any given day
          const salesCount = Math.floor(Math.random() * 3); // 0-2 sales
          
          for (let sale = 0; sale < salesCount; sale++) {
            const quantity = Math.floor(Math.random() * 5) + 2; // 2-7 units
            const unitPrice = Math.floor(Math.random() * 30000) + 15000; // 15,000-45,000 تومان
            
            salesData.push({
              itemId: item.id,
              quantity: quantity,
              type: 'OUT',
              note: `فروش متوسط - ${item.name}`,
              unitPrice: unitPrice,
              userId: Math.random() > 0.5 ? salesUser.id : staffUser.id,
              createdAt: new Date(saleDate.getTime() + sale * 60 * 60 * 1000),
              updatedAt: new Date(saleDate.getTime() + sale * 60 * 60 * 1000)
            });
          }
        }
      }
    }

    // Generate sales for low-selling items (occasional sales)
    for (const item of lowSellingItems) {
      for (let day = 0; day < 30; day++) {
        const saleDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        
        // Very occasional sales for low-selling items
        if (Math.random() > 0.8) { // 20% chance of sale on any given day
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
          const unitPrice = Math.floor(Math.random() * 20000) + 10000; // 10,000-30,000 تومان
          
          salesData.push({
            itemId: item.id,
            quantity: quantity,
            type: 'OUT',
            note: `فروش کم - ${item.name}`,
            unitPrice: unitPrice,
            userId: Math.random() > 0.5 ? salesUser.id : staffUser.id,
            createdAt: new Date(saleDate.getTime()),
            updatedAt: new Date(saleDate.getTime())
          });
        }
      }
    }

    // Add corresponding stock entries (IN) to ensure we have enough inventory
    console.log('📦 Adding stock entries to support sales...');
    const stockData = [];
    
    for (const item of items) {
      // Calculate total sales for this item
      const itemSales = salesData.filter(s => s.itemId === item.id);
      const totalSold = itemSales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      if (totalSold > 0) {
        // Add stock entry with 150% of total sales to ensure positive inventory
        const stockQuantity = Math.ceil(totalSold * 1.5);
        const avgUnitPrice = itemSales.reduce((sum, sale) => sum + sale.unitPrice, 0) / itemSales.length;
        
        stockData.push({
          itemId: item.id,
          quantity: stockQuantity,
          type: 'IN',
          note: `موجودی اولیه برای فروش - ${item.name}`,
          unitPrice: Math.floor(avgUnitPrice * 0.7), // Cost price (70% of selling price)
          userId: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
          updatedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
        });
      }
    }

    // Insert stock data first
    console.log(`📦 Creating ${stockData.length} stock entries...`);
    for (const stock of stockData) {
      await prisma.inventoryEntry.create({ data: stock });
    }

    // Insert sales data
    console.log(`🛒 Creating ${salesData.length} sales entries...`);
    for (const sale of salesData) {
      await prisma.inventoryEntry.create({ data: sale });
    }

    console.log('✅ Sales data added successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - High-selling items: ${highSellingItems.length} (Category A)`);
    console.log(`   - Medium-selling items: ${mediumSellingItems.length} (Category B)`);
    console.log(`   - Low-selling items: ${lowSellingItems.length} (Category C)`);
    console.log(`   - Total stock entries: ${stockData.length}`);
    console.log(`   - Total sales entries: ${salesData.length}`);
    console.log(`   - Date range: Last 30 days`);

  } catch (error) {
    console.error('❌ Error adding sales data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addSalesData()
    .then(() => {
      console.log('🎉 Sales data script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sales data script failed:', error);
      process.exit(1);
    });
}

module.exports = { addSalesData }; 