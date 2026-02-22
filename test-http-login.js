const axios = require('axios');

async function testBackendLogin() {
  console.log('🌐 Testing ACTUAL HTTP POST to backend\n');
  
  console.log('📍 Request Details:');
  console.log('   URL: http://localhost:3001/api/auth/login');
  console.log('   Method: POST');
  console.log('   Body: { email: "alirezayousefi@dima.ir", password: "manager123", rememberMe: false }');
  console.log('   Headers: { "Content-Type": "application/json" }');
  console.log('');
  
  try {
    console.log('⏳ Sending request...\n');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'alirezayousefi@dima.ir',
      password: 'manager123',
      rememberMe: false
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status code
    });
    
    console.log('📤 Response Received:');
    console.log('   Status Code:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('');
    
    console.log('📦 Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.status === 200) {
      console.log('✅ Login was SUCCESSFUL');
      console.log('   Token:', response.data.data?.token ? 'Present' : 'Missing');
      console.log('   User:', response.data.data?.name || 'Unknown');
    } else if (response.status === 401) {
      console.log('❌ Login FAILED with 401 Unauthorized');
      console.log('   Message:', response.data.message);
    } else {
      console.log('⚠️  Unexpected status code:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Request failed:');
    console.log('   Error:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testBackendLogin();
