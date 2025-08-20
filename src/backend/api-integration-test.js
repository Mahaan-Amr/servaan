// Comprehensive API Integration Test Suite for Servaan
// Tests all major endpoints with authentication and error handling

const http = require('http');
const fs = require('fs');

const baseURL = 'http://localhost:3001';
let authToken = null;
let testUserId = null;

// Test configuration
const testConfig = {
  testUser: {
    name: 'Test User API',
    email: `test-api-${Date.now()}@servaan.com`,
    password: 'TestPassword123!',
    role: 'ADMIN'
  },
  testSupplier: {
    name: 'تست تأمین‌کننده API',
    contactName: 'احمد رضایی',
    email: 'supplier@test.com',
    phoneNumber: '09123456789',
    address: 'تهران، خیابان ولیعصر',
    notes: 'تأمین‌کننده تست برای API'
  },
  testItem: {
    name: 'کالای تست API',
    category: 'نوشیدنی',
    unit: 'عدد',
    description: 'کالای تست برای API',
    minStock: 10,
    barcode: `TEST${Date.now()}`
  }
};

// HTTP request helper
function makeRequest(method, path, data = null, useAuth = true) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

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

// Main test suite
async function runAPIIntegrationTests() {
  console.log('🧪 Starting Comprehensive API Integration Tests...\n');
  console.log('📋 Testing all major endpoints with authentication and error handling\n');

  try {
    // 1. Test Server Health
    console.log('🔵 1. Testing Server Health');
    const healthResponse = await makeRequest('GET', '/api', null, false);
    logTest('Server Health Check', 
      healthResponse.statusCode === 200 && healthResponse.data.message?.includes('سِروان'),
      `Status: ${healthResponse.statusCode}`
    );

    // 2. Test Authentication Flow
    console.log('\n🔵 2. Testing Authentication Flow');
    
    // Register test user
    const registerResponse = await makeRequest('POST', '/api/auth/register', testConfig.testUser, false);
    logTest('User Registration', 
      registerResponse.statusCode === 200 || registerResponse.statusCode === 201,
      `Status: ${registerResponse.statusCode}`
    );

    if (registerResponse.statusCode === 200 || registerResponse.statusCode === 201) {
      authToken = registerResponse.data.token;
      testUserId = registerResponse.data.id;
    }

    // Login test user
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    }, false);
    
    logTest('User Login', 
      loginResponse.statusCode === 200 && loginResponse.data.token,
      `Status: ${loginResponse.statusCode}`
    );

    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
    }

    // Get current user profile
    const profileResponse = await makeRequest('GET', '/api/auth/me');
    logTest('Get User Profile', 
      profileResponse.statusCode === 200 && profileResponse.data.email === testConfig.testUser.email,
      `Status: ${profileResponse.statusCode}`
    );

    // 3. Test Suppliers API
    console.log('\n🔵 3. Testing Suppliers API');
    
    // Create supplier
    const createSupplierResponse = await makeRequest('POST', '/api/suppliers', testConfig.testSupplier);
    logTest('Create Supplier', 
      createSupplierResponse.statusCode === 200 || createSupplierResponse.statusCode === 201,
      `Status: ${createSupplierResponse.statusCode}`
    );

    let supplierId = null;
    if (createSupplierResponse.data && createSupplierResponse.data.id) {
      supplierId = createSupplierResponse.data.id;
    }

    // Get suppliers list
    const getSuppliersResponse = await makeRequest('GET', '/api/suppliers');
    logTest('Get Suppliers List', 
      getSuppliersResponse.statusCode === 200 && Array.isArray(getSuppliersResponse.data),
      `Status: ${getSuppliersResponse.statusCode}, Count: ${getSuppliersResponse.data?.length || 0}`
    );

    // Update supplier (if created successfully)
    if (supplierId) {
      const updateSupplierResponse = await makeRequest('PUT', `/api/suppliers/${supplierId}`, {
        ...testConfig.testSupplier,
        name: 'تست تأمین‌کننده API - بروزرسانی شده'
      });
      logTest('Update Supplier', 
        updateSupplierResponse.statusCode === 200,
        `Status: ${updateSupplierResponse.statusCode}`
      );
    }

    // 4. Test Items API
    console.log('\n🔵 4. Testing Items API');
    
    // Create item
    const createItemResponse = await makeRequest('POST', '/api/items', testConfig.testItem);
    logTest('Create Item', 
      createItemResponse.statusCode === 200 || createItemResponse.statusCode === 201,
      `Status: ${createItemResponse.statusCode}`
    );

    let itemId = null;
    if (createItemResponse.data && createItemResponse.data.id) {
      itemId = createItemResponse.data.id;
    }

    // Get items list
    const getItemsResponse = await makeRequest('GET', '/api/items');
    logTest('Get Items List', 
      getItemsResponse.statusCode === 200 && Array.isArray(getItemsResponse.data),
      `Status: ${getItemsResponse.statusCode}, Count: ${getItemsResponse.data?.length || 0}`
    );

    // 5. Test Inventory API
    console.log('\n🔵 5. Testing Inventory API');
    
    if (itemId) {
      // Create inventory entry
      const createInventoryResponse = await makeRequest('POST', '/api/inventory', {
        itemId: itemId,
        quantity: 50,
        type: 'IN',
        note: 'تست ورود کالا',
        unitPrice: 1000
      });
      logTest('Create Inventory Entry', 
        createInventoryResponse.statusCode === 200 || createInventoryResponse.statusCode === 201,
        `Status: ${createInventoryResponse.statusCode}`
      );

      // Get inventory entries
      const getInventoryResponse = await makeRequest('GET', '/api/inventory');
      logTest('Get Inventory Entries', 
        getInventoryResponse.statusCode === 200 && Array.isArray(getInventoryResponse.data),
        `Status: ${getInventoryResponse.statusCode}, Count: ${getInventoryResponse.data?.length || 0}`
      );

      // Get current inventory status
      const getCurrentInventoryResponse = await makeRequest('GET', '/api/inventory/current');
      logTest('Get Current Inventory Status', 
        getCurrentInventoryResponse.statusCode === 200,
        `Status: ${getCurrentInventoryResponse.statusCode}`
      );

      // Get low stock items
      const getLowStockResponse = await makeRequest('GET', '/api/inventory/low-stock');
      logTest('Get Low Stock Items', 
        getLowStockResponse.statusCode === 200,
        `Status: ${getLowStockResponse.statusCode}`
      );
    }

    // 6. Test Scanner API
    console.log('\n🔵 6. Testing Scanner API');
    
    // Test barcode lookup
    const lookupResponse = await makeRequest('GET', '/api/scanner/lookup/1234567890123?mode=barcode');
    logTest('Barcode Lookup', 
      lookupResponse.statusCode === 200 || lookupResponse.statusCode === 404,
      `Status: ${lookupResponse.statusCode} (404 expected for non-existent barcode)`
    );

    // Get scan statistics
    const scanStatsResponse = await makeRequest('GET', '/api/scanner/statistics');
    logTest('Get Scan Statistics', 
      scanStatsResponse.statusCode === 200,
      `Status: ${scanStatsResponse.statusCode}`
    );

    // 7. Test Business Intelligence API
    console.log('\n🔵 7. Testing Business Intelligence API');
    
    // Get reports list
    const getReportsResponse = await makeRequest('GET', '/api/bi/reports');
    logTest('Get Reports List', 
      getReportsResponse.statusCode === 200,
      `Status: ${getReportsResponse.statusCode}`
    );

    // 8. Test User Management API
    console.log('\n🔵 8. Testing User Management API');
    
    // Get users list
    const getUsersResponse = await makeRequest('GET', '/api/users');
    logTest('Get Users List', 
      getUsersResponse.statusCode === 200 && Array.isArray(getUsersResponse.data),
      `Status: ${getUsersResponse.statusCode}, Count: ${getUsersResponse.data?.length || 0}`
    );

    // 9. Test Error Handling
    console.log('\n🔵 9. Testing Error Handling');
    
    // Test unauthorized access
    const unauthorizedResponse = await makeRequest('GET', '/api/users', null, false);
    logTest('Unauthorized Access Handling', 
      unauthorizedResponse.statusCode === 401 || unauthorizedResponse.statusCode === 403,
      `Status: ${unauthorizedResponse.statusCode}`
    );

    // Test invalid endpoint
    const invalidEndpointResponse = await makeRequest('GET', '/api/nonexistent');
    logTest('Invalid Endpoint Handling', 
      invalidEndpointResponse.statusCode === 404,
      `Status: ${invalidEndpointResponse.statusCode}`
    );

    // Test invalid data
    const invalidDataResponse = await makeRequest('POST', '/api/items', { invalid: 'data' });
    logTest('Invalid Data Handling', 
      invalidDataResponse.statusCode === 400 || invalidDataResponse.statusCode === 422,
      `Status: ${invalidDataResponse.statusCode}`
    );

    // 10. Cleanup Test Data
    console.log('\n🔵 10. Cleaning Up Test Data');
    
    // Delete test supplier
    if (supplierId) {
      const deleteSupplierResponse = await makeRequest('DELETE', `/api/suppliers/${supplierId}`);
      logTest('Delete Test Supplier', 
        deleteSupplierResponse.statusCode === 200 || deleteSupplierResponse.statusCode === 204,
        `Status: ${deleteSupplierResponse.statusCode}`
      );
    }

    // Delete test item
    if (itemId) {
      const deleteItemResponse = await makeRequest('DELETE', `/api/items/${itemId}`);
      logTest('Delete Test Item', 
        deleteItemResponse.statusCode === 200 || deleteItemResponse.statusCode === 204,
        `Status: ${deleteItemResponse.statusCode}`
      );
    }

  } catch (error) {
    console.error('❌ Test Suite Failed:', error.message);
    logTest('Test Suite Execution', false, error.message);
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('🎉 API Integration Test Results');
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
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details
  };

  fs.writeFileSync('api-integration-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed results saved to: api-integration-test-results.json');
  
  console.log('\n🔍 Next Steps:');
  if (testResults.failed === 0) {
    console.log('   ✅ All APIs are working correctly!');
    console.log('   🚀 Ready to proceed with frontend integration verification');
  } else {
    console.log('   🔧 Fix the failed endpoints before proceeding');
    console.log('   📋 Check the detailed error messages above');
  }
}

// Check if server is running before starting tests
console.log('🔍 Checking if Servaan backend server is running...');
console.log('📝 Note: Make sure the backend server is running on localhost:3001');
console.log('   Command: npm run dev (in backend directory)');
console.log('');

runAPIIntegrationTests(); 