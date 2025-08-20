const { PrismaClient } = require('../shared/generated/client');
require('dotenv').config({ path: '.env.test' });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test schema
    console.log('🔍 Testing schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    console.log('✅ Database schema is ready!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Troubleshooting tips:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your DATABASE_URL in .env.test');
    console.error('  3. Ensure the test database exists');
    console.error('  4. Run: npm run test:setup');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection(); 