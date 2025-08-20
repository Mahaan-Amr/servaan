const { PrismaClient } = require('../shared/generated/client');

const prisma = new PrismaClient();

async function debugPrismaClient() {
  console.log('🔍 Debugging Prisma Client...');
  
  // Check the client version
  console.log('Client version:', prisma._clientVersion);
  
  // Check if we can access the Order model
  try {
    // Try to get the Order model definition
    console.log('Order model methods:', Object.keys(prisma.order));
    
    // Try different ways to access field information
    console.log('\n--- Field Access Methods ---');
    
    // Method 1: Direct fields property
    console.log('1. prisma.order.fields:', prisma.order.fields);
    
    // Method 2: Check if fields is a function
    console.log('2. typeof prisma.order.fields:', typeof prisma.order.fields);
    
    // Method 3: Try to call fields as a function
    if (typeof prisma.order.fields === 'function') {
      console.log('3. prisma.order.fields():', prisma.order.fields());
    }
    
    // Method 4: Check for other properties
    console.log('4. prisma.order.$name:', prisma.order.$name);
    console.log('5. prisma.order.name:', prisma.order.name);
    
    // Method 5: Try to inspect the model object
    console.log('6. Order model object keys:', Object.getOwnPropertyNames(prisma.order));
    
    // Method 6: Check for hidden properties
    console.log('7. Order model symbol properties:', Object.getOwnPropertySymbols(prisma.order));
    
    // Method 7: Try to create a simple order to see what fields are accepted
    console.log('\n--- Testing Order Creation ---');
    try {
      const testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-001',
          orderType: 'DINE_IN',
          status: 'DRAFT',
          subtotal: 1000,
          totalAmount: 1000,
          createdBy: 'test-user-id'
        }
      });
      console.log('✅ Simple order created successfully:', testOrder.id);
      
      // Clean up
      await prisma.order.delete({ where: { id: testOrder.id } });
      console.log('✅ Test order cleaned up');
      
    } catch (error) {
      console.log('❌ Order creation failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('Error testing Prisma client:', error.message);
  }
  
  await prisma.$disconnect();
}

debugPrismaClient().catch(console.error);
