const { execSync } = require('child_process');
const path = require('path');

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  
  try {
    // Change to the prisma directory
    const prismaDir = path.join(__dirname, '..', 'prisma');
    process.chdir(prismaDir);
    
    console.log('📦 Installing Prisma dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🗄️ Setting up test database...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/servaan_test'
      }
    });
    
    console.log('✅ Test database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    process.exit(1);
  }
}

setupTestDatabase(); 