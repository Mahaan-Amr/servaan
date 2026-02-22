const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAdminCredentials() {
  try {
    console.log('🔍 Looking for admin@dima.ir in production database\n');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@dima.ir'
      },
      include: { tenant: true }
    });
    
    if (!adminUser) {
      console.log('❌ User admin@dima.ir not found');
      return;
    }
    
    console.log('✅ Found admin user:');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Name:', adminUser.name);
    console.log('   Role:', adminUser.role);
    console.log('   Tenant:', adminUser.tenant?.displayName);
    console.log('   Tenant Subdomain:', adminUser.tenant?.subdomain);
    console.log('   Active:', adminUser.active);
    console.log('   Password Hash (first 20):', adminUser.password.substring(0, 20));
    
    console.log('\n💡 Now testing login with this user...');
    
    // Try to login
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@dima.ir',
        password: 'admin123', // Try default password
        rememberMe: false
      }, {
        validateStatus: () => true
      });
      
      console.log('\n📤 Login Test with admin@dima.ir / admin123:');
      console.log('   Status:', response.status);
      console.log('   Message:', response.data.message);
      
      if (response.status === 200) {
        console.log('   ✅ LOGIN SUCCESSFUL!');
        console.log('   Token:', response.data.data?.token ? '✅ Generated' : '❌ Missing');
      } else {
        console.log('   ❌ Login failed');
      }
    } catch (error) {
      console.log('   ❌ Request error:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findAdminCredentials();
