// Frontend Integration Test Suite for Servaan
// Tests frontend services integration with backend APIs

const axios = require('axios');
const fs = require('fs');

// Mock localStorage for Node.js environment
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Mock sessionStorage
global.sessionStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Mock process.env for frontend services
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';

// Import frontend services (simulated - we'll test the actual API calls)
const API_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  testUser: {
    name: 'Frontend Test User',
    email: `frontend-test-${Date.now()}@servaan.com`,
    password: 'TestPassword123!',
    role: 'ADMIN'
  },
  testSupplier: {
    name: 'تست تأمین‌کننده Frontend',
    contactName: 'علی احمدی',
    email: 'frontend-supplier@test.com',
    phoneNumber: '09123456789',
    address: 'تهران، خیابان آزادی',
    notes: 'تأمین‌کننده تست برای Frontend'
  },
  testItem: {
    name: 'کالای تست Frontend',
    category: 'غذا',
    unit: 'کیلوگرم',
    description: 'کالای تست برای Frontend',
    minStock: 5,
    barcode: `FRONTEND${Date.now()}`
  }
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function logTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
  testResults.details.push({ name, success, details });
}

// Simulate frontend service functions
class FrontendServiceTester {
  constructor() {
    this.authToken = null;
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000
    });

    // Add request interceptor for auth
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  // Auth Service Tests
  async testAuthService() {
    console.log('🔵 Testing Auth Service Integration');

    try {
      // Test login
      const loginResponse = await this.axiosInstance.post('/auth/login', {
        email: testConfig.testUser.email,
        password: testConfig.testUser.password
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data));
        logTest('Auth Service - Login', true, 'Token received and stored');
      } else {
        logTest('Auth Service - Login', false, `Status: ${loginResponse.status}`);
      }

      // Test get current user
      const profileResponse = await this.axiosInstance.get('/auth/me');
      logTest('Auth Service - Get Profile', 
        profileResponse.status === 200 && profileResponse.data.email === testConfig.testUser.email,
        `Status: ${profileResponse.status}`
      );

    } catch (error) {
      logTest('Auth Service - Login', false, error.message);
    }
  }

  // Supplier Service Tests
  async testSupplierService() {
    console.log('\n🔵 Testing Supplier Service Integration');

    try {
      // Test create supplier
      const createResponse = await this.axiosInstance.post('/suppliers', testConfig.testSupplier);
      const supplierId = createResponse.data?.id;
      
      logTest('Supplier Service - Create', 
        createResponse.status === 200 || createResponse.status === 201,
        `Status: ${createResponse.status}, ID: ${supplierId}`
      );

      // Test get suppliers
      const getResponse = await this.axiosInstance.get('/suppliers');
      logTest('Supplier Service - Get List', 
        getResponse.status === 200 && Array.isArray(getResponse.data),
        `Status: ${getResponse.status}, Count: ${getResponse.data?.length || 0}`
      );

      // Test get supplier by ID
      if (supplierId) {
        const getByIdResponse = await this.axiosInstance.get(`/suppliers/${supplierId}`);
        logTest('Supplier Service - Get By ID', 
          getByIdResponse.status === 200 && getByIdResponse.data.id === supplierId,
          `Status: ${getByIdResponse.status}`
        );

        // Test update supplier
        const updateResponse = await this.axiosInstance.put(`/suppliers/${supplierId}`, {
          ...testConfig.testSupplier,
          name: 'تست تأمین‌کننده Frontend - بروزرسانی شده'
        });
        logTest('Supplier Service - Update', 
          updateResponse.status === 200,
          `Status: ${updateResponse.status}`
        );

        // Store for cleanup
        this.testSupplierId = supplierId;
      }

    } catch (error) {
      logTest('Supplier Service - Error', false, error.message);
    }
  }

  // Item Service Tests
  async testItemService() {
    console.log('\n🔵 Testing Item Service Integration');

    try {
      // Test create item
      const createResponse = await this.axiosInstance.post('/items', testConfig.testItem);
      const itemId = createResponse.data?.id;
      
      logTest('Item Service - Create', 
        createResponse.status === 200 || createResponse.status === 201,
        `Status: ${createResponse.status}, ID: ${itemId}`
      );

      // Test get items
      const getResponse = await this.axiosInstance.get('/items');
      logTest('Item Service - Get List', 
        getResponse.status === 200 && Array.isArray(getResponse.data),
        `Status: ${getResponse.status}, Count: ${getResponse.data?.length || 0}`
      );

      // Test get item by ID
      if (itemId) {
        const getByIdResponse = await this.axiosInstance.get(`/items/${itemId}`);
        logTest('Item Service - Get By ID', 
          getByIdResponse.status === 200 && getByIdResponse.data.id === itemId,
          `Status: ${getByIdResponse.status}`
        );

        // Store for inventory tests
        this.testItemId = itemId;
      }

    } catch (error) {
      logTest('Item Service - Error', false, error.message);
    }
  }

  // Inventory Service Tests
  async testInventoryService() {
    console.log('\n🔵 Testing Inventory Service Integration');

    if (!this.testItemId) {
      logTest('Inventory Service - Skipped', false, 'No test item available');
      return;
    }

    try {
      // Test create inventory entry
      const createResponse = await this.axiosInstance.post('/inventory', {
        itemId: this.testItemId,
        quantity: 25,
        type: 'IN',
        note: 'تست ورود کالا از Frontend',
        unitPrice: 2000
      });
      
      logTest('Inventory Service - Create Entry', 
        createResponse.status === 200 || createResponse.status === 201,
        `Status: ${createResponse.status}`
      );

      // Test get inventory entries
      const getResponse = await this.axiosInstance.get('/inventory');
      logTest('Inventory Service - Get Entries', 
        getResponse.status === 200 && Array.isArray(getResponse.data),
        `Status: ${getResponse.status}, Count: ${getResponse.data?.length || 0}`
      );

      // Test get current inventory
      const currentResponse = await this.axiosInstance.get('/inventory/current');
      logTest('Inventory Service - Get Current', 
        currentResponse.status === 200,
        `Status: ${currentResponse.status}`
      );

      // Test get low stock items
      const lowStockResponse = await this.axiosInstance.get('/inventory/low-stock');
      logTest('Inventory Service - Get Low Stock', 
        lowStockResponse.status === 200,
        `Status: ${lowStockResponse.status}`
      );

    } catch (error) {
      logTest('Inventory Service - Error', false, error.message);
    }
  }

  // Scanner Service Tests
  async testScannerService() {
    console.log('\n🔵 Testing Scanner Service Integration');

    try {
      // Test barcode lookup
      const lookupResponse = await this.axiosInstance.get('/scanner/lookup/1234567890123', {
        params: { mode: 'barcode' }
      });
      logTest('Scanner Service - Barcode Lookup', 
        lookupResponse.status === 200 || lookupResponse.status === 404,
        `Status: ${lookupResponse.status} (404 expected for non-existent barcode)`
      );

      // Test scan statistics
      const statsResponse = await this.axiosInstance.get('/scanner/statistics');
      logTest('Scanner Service - Get Statistics', 
        statsResponse.status === 200,
        `Status: ${statsResponse.status}`
      );

      // Test scan history
      const historyResponse = await this.axiosInstance.get('/scanner/history', {
        params: { limit: 10, offset: 0 }
      });
      logTest('Scanner Service - Get History', 
        historyResponse.status === 200,
        `Status: ${historyResponse.status}`
      );

    } catch (error) {
      logTest('Scanner Service - Error', false, error.message);
    }
  }

  // BI Service Tests
  async testBIService() {
    console.log('\n🔵 Testing Business Intelligence Service Integration');

    try {
      // Test get reports
      const reportsResponse = await this.axiosInstance.get('/bi/reports');
      logTest('BI Service - Get Reports', 
        reportsResponse.status === 200,
        `Status: ${reportsResponse.status}`
      );

      // Test create custom report
      const createReportResponse = await this.axiosInstance.post('/bi/reports', {
        name: 'Frontend Test Report',
        description: 'Test report from frontend integration',
        reportType: 'TABULAR',
        dataSources: ['inventory'],
        columnsConfig: [
          { id: 'item_name', label: 'نام کالا', type: 'text', table: 'items' }
        ],
        filtersConfig: [],
        chartConfig: { type: 'table' },
        isPublic: false
      });
      
      logTest('BI Service - Create Report', 
        createReportResponse.status === 200 || createReportResponse.status === 201,
        `Status: ${createReportResponse.status}`
      );

    } catch (error) {
      logTest('BI Service - Error', false, error.message);
    }
  }

  // Error Handling Tests
  async testErrorHandling() {
    console.log('\n🔵 Testing Error Handling');

    try {
      // Test unauthorized request (remove token temporarily)
      const originalToken = this.authToken;
      this.authToken = null;
      
      try {
        await this.axiosInstance.get('/users');
        logTest('Error Handling - Unauthorized', false, 'Should have failed');
      } catch (error) {
        logTest('Error Handling - Unauthorized', 
          error.response?.status === 401 || error.response?.status === 403,
          `Status: ${error.response?.status}`
        );
      }
      
      // Restore token
      this.authToken = originalToken;

      // Test invalid data
      try {
        await this.axiosInstance.post('/items', { invalid: 'data' });
        logTest('Error Handling - Invalid Data', false, 'Should have failed');
      } catch (error) {
        logTest('Error Handling - Invalid Data', 
          error.response?.status === 400 || error.response?.status === 422,
          `Status: ${error.response?.status}`
        );
      }

      // Test non-existent endpoint
      try {
        await this.axiosInstance.get('/nonexistent');
        logTest('Error Handling - 404 Endpoint', false, 'Should have failed');
      } catch (error) {
        logTest('Error Handling - 404 Endpoint', 
          error.response?.status === 404,
          `Status: ${error.response?.status}`
        );
      }

    } catch (error) {
      logTest('Error Handling - Test Error', false, error.message);
    }
  }

  // Cleanup test data
  async cleanup() {
    console.log('\n🔵 Cleaning Up Test Data');

    try {
      // Delete test supplier
      if (this.testSupplierId) {
        const deleteSupplierResponse = await this.axiosInstance.delete(`/suppliers/${this.testSupplierId}`);
        logTest('Cleanup - Delete Supplier', 
          deleteSupplierResponse.status === 200 || deleteSupplierResponse.status === 204,
          `Status: ${deleteSupplierResponse.status}`
        );
      }

      // Delete test item
      if (this.testItemId) {
        const deleteItemResponse = await this.axiosInstance.delete(`/items/${this.testItemId}`);
        logTest('Cleanup - Delete Item', 
          deleteItemResponse.status === 200 || deleteItemResponse.status === 204,
          `Status: ${deleteItemResponse.status}`
        );
      }

    } catch (error) {
      logTest('Cleanup - Error', false, error.message);
    }
  }
}

// Main test runner
async function runFrontendIntegrationTests() {
  console.log('🧪 Starting Frontend Integration Tests...\n');
  console.log('📋 Testing frontend services integration with backend APIs\n');

  // First, create a test user for authentication
  try {
    console.log('🔵 Setting up test user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testConfig.testUser);
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('✅ Test user created successfully');
    }
  } catch (error) {
    console.log('⚠️  Test user might already exist, continuing...');
  }

  const tester = new FrontendServiceTester();

  try {
    await tester.testAuthService();
    await tester.testSupplierService();
    await tester.testItemService();
    await tester.testInventoryService();
    await tester.testScannerService();
    await tester.testBIService();
    await tester.testErrorHandling();
    await tester.cleanup();

  } catch (error) {
    console.error('❌ Frontend Integration Test Failed:', error.message);
    logTest('Frontend Integration Test Suite', false, error.message);
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Frontend Integration Test Results');
  console.log('='.repeat(60));
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.success)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }

  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    testType: 'Frontend Integration',
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details
  };

  fs.writeFileSync('frontend-integration-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed results saved to: frontend-integration-test-results.json');
  
  console.log('\n🔍 Next Steps:');
  if (testResults.failed === 0) {
    console.log('   ✅ All frontend services are working correctly!');
    console.log('   🚀 Frontend-backend integration is solid');
  } else {
    console.log('   🔧 Fix the failed frontend service integrations');
    console.log('   📋 Check error handling and API response formats');
  }
}

// Check if server is running before starting tests
console.log('🔍 Checking frontend service integration...');
console.log('📝 Note: Make sure the backend server is running on localhost:3001');
console.log('   Command: npm run dev (in backend directory)');
console.log('');

runFrontendIntegrationTests(); 