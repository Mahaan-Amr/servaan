const axios = require('axios');

async function testAdminLogin() {
  console.log('🔐 Testing login with admin@dima.ir\n');
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@dima.ir',
      password: 'admin123',
      rememberMe: false
    }, {
      validateStatus: () => true
    });
    
    console.log('📤 Response:');
    console.log('   Status:', response.status);
    console.log('   Message:', response.data.message);
    console.log('');
    
    if (response.status === 200) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('');
      console.log('📋 User Data:');
      console.log('   Name:', response.data.data?.name);
      console.log('   Email:', response.data.data?.email);
      console.log('   Role:', response.data.data?.role);
      console.log('   Tenant ID:', response.data.data?.tenantId);
      console.log('   Tenant Subdomain:', response.data.data?.tenantSubdomain);
      console.log('   Tenant Name:', response.data.data?.tenantName);
      console.log('');
      console.log('🔑 Token:', response.data.data?.token ? '✅ Generated' : '❌ Missing');
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('   Full response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
  }
}

testAdminLogin();
