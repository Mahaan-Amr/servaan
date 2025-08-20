const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Test credentials (assuming admin user exists)
const testCredentials = {
  email: 'admin@servaan.com',
  password: 'admin123'
};

async function testNotifications() {
  try {
    console.log('🔍 Testing real-time notifications...');
    
    // 1. Login to get token
    console.log('📝 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testCredentials);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Check low stock notifications
    console.log('📦 Triggering low stock check...');
    try {
      await axios.post(`${API_URL}/notifications/check-low-stock`, {}, { headers });
      console.log('✅ Low stock check triggered');
    } catch (error) {
      console.log('⚠️ Low stock check failed:', error.response?.data?.message || error.message);
    }

    // 3. Get current notifications
    console.log('📋 Fetching notifications...');
    const notificationsResponse = await axios.get(`${API_URL}/notifications`, { headers });
    console.log(`✅ Found ${notificationsResponse.data.notifications?.length || 0} notifications`);
    
    // 4. Get unread count
    const unreadResponse = await axios.get(`${API_URL}/notifications/unread/count`, { headers });
    console.log(`📊 Unread count: ${unreadResponse.data.count}`);

    // 5. Create a test inventory entry to trigger notifications
    console.log('📊 Creating test inventory entry...');
    try {
      // First, get an item to work with
      const itemsResponse = await axios.get(`${API_URL}/items`, { headers });
      const items = itemsResponse.data.items || itemsResponse.data;
      
      if (items && items.length > 0) {
        const testItem = items[0];
        console.log(`📦 Using item: ${testItem.name}`);
        
        // Create an inventory entry
        const inventoryData = {
          itemId: testItem.id,
          quantity: 5,
          type: 'IN',
          note: 'Test notification entry'
        };
        
        await axios.post(`${API_URL}/inventory`, inventoryData, { headers });
        console.log('✅ Test inventory entry created');
      } else {
        console.log('⚠️ No items found to test with');
      }
    } catch (error) {
      console.log('⚠️ Inventory test failed:', error.response?.data?.message || error.message);
    }

    console.log('🎉 Notification test completed!');
    console.log('💡 Check your browser for real-time notifications');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testNotifications(); 