const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment
dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test';
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔍 Testing Login Flow\n');
  console.log('📊 Database:', DATABASE_URL ? 'Connected' : 'NOT FOUND');
  
  try {
    // Step 1: Verify user exists
    console.log('\n1️⃣ Checking if user exists in database...');
    const user = await prisma.user.findFirst({
      where: { email: 'alirezayousefi@dima.ir' },
      include: { tenant: true }
    });
    
    if (!user) {
      console.log('❌ User NOT found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      tenantName: user.tenant?.displayName,
      tenantSubdomain: user.tenant?.subdomain,
      active: user.active,
      passwordHash: user.password.substring(0, 20) + '...'
    });
    
    // Step 2: Try to make a POST request to the login endpoint
    console.log('\n2️⃣ Making POST request to /api/auth/login...');
    
    // Try with subdomain header
    console.log('\n   🔗 Request URL: http://dima.localhost:3001/api/auth/login');
    console.log('   📧 Email: alirezayousefi@dima.ir');
    console.log('   🔐 Password: manager123');
    console.log('   🏠 Host Header: dima.localhost:3001');
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'alirezayousefi@dima.ir',
        password: 'manager123',
        rememberMe: false
      }, {
        headers: {
          'Host': 'dima.localhost:3001',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n✅ Login successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (loginError) {
      console.log('\n❌ Login failed!');
      console.log('Status:', loginError.response?.status);
      console.log('Message:', loginError.response?.data?.message);
      console.log('Full response:', JSON.stringify(loginError.response?.data, null, 2));
      
      // Try to understand what went wrong
      if (loginError.response?.status === 401) {
        console.log('\n🔎 Password verification check:');
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare('manager123', user.password);
        console.log('   Password matches in DB:', isMatch);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
