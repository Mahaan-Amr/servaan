const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndReset() {
  try {
    console.log('🗑️  Cleaning up existing dima tenant data\n');
    
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'dima' },
      select: { id: true }
    });
    
    if (!tenant) {
      console.log('❌ No dima tenant found');
      return;
    }
    
    const tenantId = tenant.id;
    
    // Delete all related data systematically
    console.log('Deleting related records...');
    
    await prisma.kitchenDisplay.deleteMany({ where: { order: { tenantId } } });
    console.log('  ✓ Kitchen displays');
    
    await prisma.orderPayment.deleteMany({ where: { order: { tenantId } } });
    console.log('  ✓ Order payments');
    
    await prisma.orderItem.deleteMany({ where: { tenantId } });
    console.log('  ✓ Order items');
    
    await prisma.order.deleteMany({ where: { tenantId } });
    console.log('  ✓ Orders');
    
    await prisma.tableReservation.deleteMany({ where: { tenantId } });
    console.log('  ✓ Table reservations');
    
    await prisma.table.deleteMany({ where: { tenantId } });
    console.log('  ✓ Tables');
    
    await prisma.menuItem.deleteMany({ where: { tenantId } });
    console.log('  ✓ Menu items');
    
    await prisma.menuCategory.deleteMany({ where: { tenantId } });
    console.log('  ✓ Menu categories');
    
    await prisma.inventoryEntry.deleteMany({ where: { tenantId } });
    console.log('  ✓ Inventory entries');
    
    await prisma.itemSupplier.deleteMany({ where: { tenantId } });
    console.log('  ✓ Item suppliers');
    
    await prisma.item.deleteMany({ where: { tenantId } });
    console.log('  ✓ Items');
    
    await prisma.supplier.deleteMany({ where: { tenantId } });
    console.log('  ✓ Suppliers');
    
    await prisma.customer.deleteMany({ where: { tenantId } });
    console.log('  ✓ Customers');
    
    await prisma.customReport.deleteMany({ where: { tenantId } });
    console.log('  ✓ Custom reports');
    
    await prisma.user.deleteMany({ where: { tenantId } });
    console.log('  ✓ Users');
    
    await prisma.tenantFeatures.deleteMany({ where: { tenantId } });
    console.log('  ✓ Tenant features');
    
    // Finally delete the tenant itself
    await prisma.tenant.delete({ where: { id: tenantId } });
    console.log('  ✓ Tenant');
    
    console.log('\n✅ Cleanup complete! Tenant deleted.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndReset();
