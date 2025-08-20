const axios = require('axios');

async function testSMSHTTP() {
  try {
    console.log('🧪 Testing SMS via HTTP...');
    
    const apiKey = '332F692B634F62656F75357536432B4E765361586D6C456A566365304476555846374E38674C354D7548413D';
    const sender = '2000660110';
    const receptor = '09051305165';
    const message = 'تست پیامک سرووان - HTTP';

    const response = await axios.post(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
      receptor: receptor,
      sender: sender,
      message: message
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('✅ HTTP Success:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ HTTP Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testSMSSDK() {
  try {
    console.log('🧪 Testing SMS via SDK...');
    
    const Kavenegar = require('kavenegar');
    const api = Kavenegar.KavenegarApi({
      apikey: '332F692B634F62656F75357536432B4E765361586D6C456A566365304476555846374E38674C354D7548413D'
    });

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SDK timeout after 15 seconds'));
      }, 15000);

      api.Send({
        message: 'تست پیامک سرووان - SDK',
        receptor: '09051305165',
        sender: '2000660110'
      }, (response, status) => {
        clearTimeout(timeout);
        console.log('SDK Response:', response);
        console.log('SDK Status:', status);
        resolve({ response, status });
      });
    });

    console.log('✅ SDK Success:', result);
    return result;

  } catch (error) {
    console.error('❌ SDK Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting SMS connectivity tests...\n');
  
  // Test HTTP method
  await testSMSHTTP();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test SDK method
  await testSMSSDK();
  
  console.log('\n✅ Tests completed!');
}

runTests();