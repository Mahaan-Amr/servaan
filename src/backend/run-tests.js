#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

async function runTests() {
  console.log('🚀 Starting Servaan Backend Test Suite');
  console.log('=====================================\n');

  try {
    // Step 1: Test database connection
    console.log('📡 Step 1: Testing database connection...');
    execSync('node test-db-connection.js', { stdio: 'inherit' });
    console.log('');

    // Step 2: Generate Prisma client if needed
    console.log('🔄 Step 2: Ensuring Prisma client is up to date...');
    const prismaDir = path.join(__dirname, '..', 'prisma');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: prismaDir
    });
    console.log('');

    // Step 3: Run tests
    console.log('🧪 Step 3: Running tests...');
    const testCommand = process.argv.includes('--watch') ? 'npm run test:watch' : 'npm test';
    execSync(testCommand, { stdio: 'inherit' });

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Ensure PostgreSQL is running');
    console.error('  2. Check database credentials in .env.test');
    console.error('  3. Run: npm run test:setup');
    console.error('  4. Verify all dependencies are installed');
    process.exit(1);
  }
}

runTests(); 