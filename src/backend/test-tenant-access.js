const { PrismaClient } = require('./dist/shared/generated/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testTenantAccess() {
  try {
    console.log('🧪 TESTING TENANTID FIELD ACCESS\n');
    console.log('=' .repeat(40));
    
    // Test key models for tenantId access
    const modelsToTest = [
      'item', 'customer', 'order', 'table', 'user', 'menuCategory',
      'menuItem', 'supplier', 'notification', 'scanHistory'
    ];
    
    let workingModels = 0;
    
    for (const modelName of modelsToTest) {
      try {
        const result = await prisma[modelName].findFirst({
          select: { tenantId: true }
        });
        
        if (result && result.tenantId !== undefined) {
          console.log(`   ✅ ${modelName}: tenantId accessible`);
          workingModels++;
        } else {
          console.log(`   ❌ ${modelName}: tenantId missing`);
        }
      } catch (error) {
        if (error.message.includes('Unknown field `tenantId`')) {
          console.log(`   ❌ ${modelName}: tenantId field not found`);
        } else {
          console.log(`   ❌ ${modelName}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📊 Results: ${workingModels}/${modelsToTest.length} models working`);
    
    if (workingModels === modelsToTest.length) {
      console.log('\n🎉 SUCCESS! All models have tenantId fields accessible');
      console.log('   Multi-tenancy implementation is working correctly!');
      console.log('   Ready to run mega-seed.js for testing');
    } else {
      console.log('\n⚠️  Some models still need attention');
      console.log(`   ${modelsToTest.length - workingModels} models missing tenantId fields`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting Tenant Access Test...\n');
testTenantAccess();
