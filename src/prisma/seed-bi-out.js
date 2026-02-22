const { PrismaClient } = require('../shared/generated/client');
const prisma = new PrismaClient();

async function seedBIOutEntries() {
  console.log('\n🌱 SEEDING BI OUT ENTRIES FOR REALISTIC METRICS\n');
  
  try {
    // Get dima tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });
    
    if (!tenant) {
      console.log('❌ Dima tenant not found!');
      process.exit(1);
    }
    
    const tenantId = tenant.id;
    
    // Get manager user
    const manager = await prisma.user.findFirst({
      where: { tenantId, role: 'MANAGER' }
    });
    
    if (!manager) {
      console.log('❌ Manager not found!');
      process.exit(1);
    }
    
    // Get all items
    const items = await prisma.item.findMany({
      where: { tenantId, isActive: true }
    });
    
    if (items.length === 0) {
      console.log('❌ No items found!');
      process.exit(1);
    }
    
    console.log(`📋 Found ${items.length} items for OUT entries\n`);
    
    // Identify high, medium, low sellers based on names
    const highSellers = items.filter(i => 
      i.name.includes('قهوه') || i.name.includes('چای') || 
      i.name.includes('نوشیدنی') || i.name.includes('صبحانه')
    );
    
    const mediumSellers = items.slice(
      highSellers.length, 
      highSellers.length + Math.floor(items.length / 3)
    );
    
    const lowSellers = items.slice(
      highSellers.length + mediumSellers.length
    );
    
    console.log(`📊 Seller Categories:`);
    console.log(`   High Sellers: ${highSellers.length} items`);
    console.log(`   Medium Sellers: ${mediumSellers.length} items`);
    console.log(`   Low Sellers: ${lowSellers.length} items\n`);
    
    let outCount = 0;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('📊 Creating realistic sales pattern over 30 days...\n');
    
    // Create OUT entries for last 30 days with realistic patterns
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const entryDate = new Date(thirtyDaysAgo.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      // Skip ~5 random days (no sales)
      if (Math.random() < 0.167) continue;

      // High sellers: 2-4 sales per day (70% chance)
      for (const item of highSellers) {
        if (Math.random() < 0.7) {
          const quantity = Math.floor(Math.random() * 15) + 2; // 2-16 units
          const price = item.name.includes('قهوه') ? 45000 : 35000;
          
          await prisma.inventoryEntry.create({
            data: {
              itemId: item.id,
              tenantId,
              userId: manager.id,
              type: 'OUT',
              quantity,
              unitPrice: price,
              note: 'فروخت به مشتری',
              createdAt: entryDate
            }
          });
          outCount++;
        }
      }

      // Medium sellers: 1-2 sales per 2 days (50% chance)
      if (dayOffset % 2 === 0) {
        for (const item of mediumSellers) {
          if (Math.random() < 0.5) {
            const quantity = Math.floor(Math.random() * 8) + 1; // 1-8 units
            const price = 25000;
            
            await prisma.inventoryEntry.create({
              data: {
                itemId: item.id,
                tenantId,
                userId: manager.id,
                type: 'OUT',
                quantity,
                unitPrice: price,
                note: 'فروخت به مشتری',
                createdAt: entryDate
              }
            });
            outCount++;
          }
        }
      }

      // Low sellers: occasional sales (30% chance)
      if (dayOffset % 3 === 0) {
        for (const item of lowSellers) {
          if (Math.random() < 0.3) {
            const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 units
            const price = 15000;
            
            await prisma.inventoryEntry.create({
              data: {
                itemId: item.id,
                tenantId,
                userId: manager.id,
                type: 'OUT',
                quantity,
                unitPrice: price,
                note: 'فروخت به مشتری',
                createdAt: entryDate
              }
            });
            outCount++;
          }
        }
      }
    }

    console.log(`✅ ${outCount} OUT (sales) entries created successfully\n`);
    
    // Calculate summary stats
    const outEntries = await prisma.inventoryEntry.findMany({
      where: { tenantId, type: 'OUT' },
      select: { quantity: true, unitPrice: true }
    });
    
    const totalQty = outEntries.reduce((sum, e) => sum + e.quantity, 0);
    const totalRevenue = outEntries.reduce((sum, e) => sum + (e.quantity * e.unitPrice), 0);
    
    console.log('📈 BI DATA SUMMARY:');
    console.log(`   Total Quantity Sold: ${totalQty.toLocaleString()} units`);
    console.log(`   Total Revenue: ${totalRevenue.toLocaleString()} تومان`);
    console.log(`   Average Sale Value: ${Math.round(totalRevenue / outEntries.length).toLocaleString()} تومان\n`);
    
    console.log('🎉 BI SEEDING COMPLETE\n');
    console.log('📊 Dashboard metrics will now show:');
    console.log('   ✅ Total Revenue');
    console.log('   ✅ Net Profit (revenue - supplier costs)');
    console.log('   ✅ Profit Margin %');
    console.log('   ✅ Inventory Turnover');
    console.log('   ✅ Stockout Rate');
    console.log('   ✅ ABC Product Analysis');
    console.log('   ✅ Profitability Analysis');
    console.log('   ✅ Trend Analysis');
    console.log('   ✅ Revenue Charts');
    console.log('   ✅ Top Products');
    console.log('   ✅ Category Breakdown\n');
    
    console.log('🔄 NEXT STEP: Refresh browser to see updated BI dashboard\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seedBIOutEntries();
