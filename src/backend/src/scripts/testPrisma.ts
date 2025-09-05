import { PrismaClient } from '../../../shared/generated/client';

const prisma = new PrismaClient();

async function testPrismaConnection() {
  try {
    console.log('Testing Prisma connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    console.log('🎉 Prisma client is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Prisma connection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection(); 
