const axios = require('axios');
const https = require('https');
const { URLSearchParams } = require('url');

// SMS Configuration
const SMS_CONFIG = {
  apiKey: '332F692B634F62656F75357536432B4E765361586D6C456A566365304476555846374E38674C354D7548413D',
  sender: '2000660110',
  testPhone: '09051305165'
};

console.log('🧪 Starting SMS Real Test...');
console.log('📱 Test Phone:', SMS_CONFIG.testPhone);
console.log('📤 Sender:', SMS_CONFIG.sender);
console.log('🔑 API Key:', SMS_CONFIG.apiKey.substring(0, 10) + '...');

// Test message
const testMessage = `تست SMS سرووان
زمان: ${new Date().toLocaleString('fa-IR')}
این یک پیام تست است.`;

console.log('📝 Test Message:', testMessage);

// Method 1: Direct HTTPS
async function testHTTPS() {
  return new Promise((resolve, reject) => {
    console.log('\n🔗 Testing HTTPS Method...');
    
    const postData = new URLSearchParams({
      receptor: SMS_CONFIG.testPhone,
      sender: SMS_CONFIG.sender,
      message: testMessage
    }).toString();

    const options = {
      hostname: 'api.kavenegar.com',
      port: 443,
      path: `/v1/${SMS_CONFIG.apiKey}/sms/send.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Servaan-SMS-Test/1.0'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ HTTPS Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.return && response.return.status === 200) {
            resolve({ method: 'HTTPS', success: true, response });
          } else {
            reject(new Error(`HTTPS Error: ${JSON.stringify(response)}`));
          }
        } catch (parseError) {
          reject(new Error(`HTTPS Parse Error: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTPS Error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTPS timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Method 2: Axios
async function testAxios() {
  console.log('\n📡 Testing Axios Method...');
  
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.kavenegar.com/v1/${SMS_CONFIG.apiKey}/sms/send.json`,
      data: new URLSearchParams({
        receptor: SMS_CONFIG.testPhone,
        sender: SMS_CONFIG.sender,
        message: testMessage
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Servaan-SMS-Test/1.0'
      },
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });

    console.log('✅ Axios Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.return && response.data.return.status === 200) {
      return { method: 'Axios', success: true, response: response.data };
    } else {
      throw new Error(`Axios Error: ${JSON.stringify(response.data)}`);
    }

  } catch (error) {
    console.error('❌ Axios Error:', error.message);
    throw error;
  }
}

// Method 3: GET Request
async function testGET() {
  console.log('\n🔍 Testing GET Method...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.kavenegar.com/v1/' + SMS_CONFIG.apiKey + '/sms/send.json',
      params: {
        receptor: SMS_CONFIG.testPhone,
        sender: SMS_CONFIG.sender,
        message: testMessage
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'Servaan-SMS-Test/1.0'
      }
    });

    console.log('✅ GET Response:', JSON.stringify(response.data, null, 2));
    return { method: 'GET', success: true, response: response.data };

  } catch (error) {
    console.error('❌ GET Error:', error.message);
    throw error;
  }
}

// Test account info
async function testAccountInfo() {
  console.log('\n👤 Testing Account Info...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.kavenegar.com/v1/${SMS_CONFIG.apiKey}/account/info.json`,
      timeout: 30000,
      headers: {
        'User-Agent': 'Servaan-SMS-Test/1.0'
      }
    });

    console.log('✅ Account Info:', JSON.stringify(response.data, null, 2));
    return { method: 'AccountInfo', success: true, response: response.data };

  } catch (error) {
    console.error('❌ Account Info Error:', error.message);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  console.log('🚀 Starting comprehensive SMS tests...\n');
  
  // Test account info first
  try {
    const accountResult = await testAccountInfo();
    results.push(accountResult);
  } catch (error) {
    results.push({ method: 'AccountInfo', success: false, error: error.message });
  }
  
  // Test all SMS methods
  const methods = [
    { name: 'HTTPS', test: testHTTPS },
    { name: 'Axios', test: testAxios },
    { name: 'GET', test: testGET }
  ];
  
  for (const { name, test } of methods) {
    try {
      const result = await test();
      results.push(result);
      console.log(`✅ ${name} method succeeded!`);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({ method: name, success: false, error: error.message });
      console.log(`❌ ${name} method failed:`, error.message);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Working methods:');
    successful.forEach(r => console.log(`  - ${r.method}`));
  }
  
  if (failed.length > 0) {
    console.log('\n💥 Failed methods:');
    failed.forEach(r => console.log(`  - ${r.method}: ${r.error}`));
  }
  
  if (successful.length > 0) {
    console.log('\n🎯 Recommendation: Use the first working method in your application');
  } else {
    console.log('\n⚠️  All methods failed. Check your network connection and API credentials.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 