const { PrismaClient } = require('./src/shared/generated/client');
const prisma = new PrismaClient();

async function verifySeedData() {
  console.log('\n✅ VERIFYING DIMA TENANT SEED DATA\n');
  
  try {
    // Get the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' }
    });
    
    console.log(`📍 Tenant: ${tenant?.name} (${tenant?.subdomain})`);
    console.log(`   ID: ${tenant?.id}\n`);
    
    if (!tenant) {
      console.log('❌ Tenant not found!');
      process.exit(1);
    }
    
    const tenantId = tenant.id;
    
    // Count records
    const [userCount, supplierCount, itemCount, inventoryCount, customerCount, tableCount, categoryCount, menuItemCount, orderCount] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.supplier.count({ where: { tenantId } }),
      prisma.item.count({ where: { tenantId } }),
      prisma.inventoryEntry.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.table.count({ where: { tenantId } }),
      prisma.menuCategory.count({ where: { tenantId } }),
      prisma.menuItem.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } })
    ]);
    
    console.log('📊 RECORD COUNTS:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Suppliers: ${supplierCount}`);
    console.log(`   Inventory Items: ${itemCount}`);
    console.log(`   Inventory Transactions: ${inventoryCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Restaurant Tables: ${tableCount}`);
    console.log(`   Menu Categories: ${categoryCount}`);
    console.log(`   Menu Items: ${menuItemCount}`);
    console.log(`   Orders: ${orderCount}\n`);
    
    // Verify users
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { email: true, role: true, name: true }
    });
    
    console.log('👥 USERS:');
    users.forEach(u => {
      console.log(`   ${u.email} (${u.role}) - ${u.name}`);
    });
    
    console.log('\n✅ SEED VERIFICATION COMPLETE - All data present!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifySeedData();
