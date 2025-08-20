// Test CRUD operations through REST API
const http = require('http');

const baseURL = 'http://localhost:3001';
const userId = '6d09b0c5-8ffd-4271-806f-9241db09bd73';

// Mock auth token (in real scenario, you'd get this from login)
const authToken = 'your-jwt-token-here';

const testReportData = {
  name: 'API CRUD Test Report',
  description: 'Testing CRUD operations via REST API',
  reportType: 'TABULAR',
  dataSources: ['inventory', 'items'],
  columnsConfig: [
    { id: 'item_name', label: 'نام کالا', type: 'text', table: 'items' },
    { id: 'quantity', label: 'تعداد', type: 'number', table: 'inventory_entry' }
  ],
  filtersConfig: [],
  chartConfig: { type: 'table' },
  isPublic: false
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
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

async function testCRUDAPI() {
  console.log('🧪 Testing Custom Reports CRUD via REST API...\n');
  
  try {
    // 1. CREATE - Test creating a new report
    console.log('🔵 1. Testing CREATE via POST /api/bi/reports');
    const createResponse = await makeRequest('POST', '/api/bi/reports', testReportData);
    
    if (createResponse.statusCode === 200 || createResponse.statusCode === 201) {
      console.log('✅ CREATE successful');
      console.log(`   Status: ${createResponse.statusCode}`);
      console.log(`   Report ID: ${createResponse.data.data?.id || 'Unknown'}`);
      
      const reportId = createResponse.data.data?.id;
      
      if (reportId) {
        // 2. READ - Test reading the report
        console.log('\n🔵 2. Testing READ via GET /api/bi/reports/{id}');
        const readResponse = await makeRequest('GET', `/api/bi/reports/${reportId}`);
        
        if (readResponse.statusCode === 200) {
          console.log('✅ READ successful');
          console.log(`   Status: ${readResponse.statusCode}`);
          console.log(`   Report Name: ${readResponse.data.data?.name || 'Unknown'}`);
        } else {
          console.log('❌ READ failed');
          console.log(`   Status: ${readResponse.statusCode}`);
          console.log(`   Error: ${readResponse.data.message || 'Unknown error'}`);
        }
        
        // 3. UPDATE - Test updating the report
        console.log('\n🔵 3. Testing UPDATE via PUT /api/bi/reports/{id}');
        const updateData = {
          ...testReportData,
          name: 'API CRUD Test Report - UPDATED',
          description: 'Updated via REST API'
        };
        
        const updateResponse = await makeRequest('PUT', `/api/bi/reports/${reportId}`, updateData);
        
        if (updateResponse.statusCode === 200) {
          console.log('✅ UPDATE successful');
          console.log(`   Status: ${updateResponse.statusCode}`);
          console.log(`   Updated Name: ${updateResponse.data.data?.name || 'Unknown'}`);
        } else {
          console.log('❌ UPDATE failed');
          console.log(`   Status: ${updateResponse.statusCode}`);
          console.log(`   Error: ${updateResponse.data.message || 'Unknown error'}`);
        }
        
        // 4. EXECUTE - Test executing the report
        console.log('\n🔵 4. Testing EXECUTE via POST /api/bi/reports/{id}/execute');
        const executeResponse = await makeRequest('POST', `/api/bi/reports/${reportId}/execute`, {});
        
        if (executeResponse.statusCode === 200) {
          console.log('✅ EXECUTE successful');
          console.log(`   Status: ${executeResponse.statusCode}`);
          console.log(`   Result Count: ${executeResponse.data.data?.resultCount || 0}`);
        } else {
          console.log('❌ EXECUTE failed');
          console.log(`   Status: ${executeResponse.statusCode}`);
          console.log(`   Error: ${executeResponse.data.message || 'Unknown error'}`);
        }
        
        // 5. DELETE - Test deleting the report
        console.log('\n🔵 5. Testing DELETE via DELETE /api/bi/reports/{id}');
        const deleteResponse = await makeRequest('DELETE', `/api/bi/reports/${reportId}`);
        
        if (deleteResponse.statusCode === 200 || deleteResponse.statusCode === 204) {
          console.log('✅ DELETE successful');
          console.log(`   Status: ${deleteResponse.statusCode}`);
        } else {
          console.log('❌ DELETE failed');
          console.log(`   Status: ${deleteResponse.statusCode}`);
          console.log(`   Error: ${deleteResponse.data.message || 'Unknown error'}`);
        }
      }
    } else {
      console.log('❌ CREATE failed');
      console.log(`   Status: ${createResponse.statusCode}`);
      console.log(`   Error: ${createResponse.data.message || 'Unknown error'}`);
    }
    
    // 6. LIST - Test getting reports list
    console.log('\n🔵 6. Testing LIST via GET /api/bi/reports');
    const listResponse = await makeRequest('GET', '/api/bi/reports?page=1&limit=10');
    
    if (listResponse.statusCode === 200) {
      console.log('✅ LIST successful');
      console.log(`   Status: ${listResponse.statusCode}`);
      console.log(`   Total Reports: ${listResponse.data.data?.pagination?.total || 0}`);
      console.log(`   Reports Count: ${listResponse.data.data?.reports?.length || 0}`);
    } else {
      console.log('❌ LIST failed');
      console.log(`   Status: ${listResponse.statusCode}`);
      console.log(`   Error: ${listResponse.data.message || 'Unknown error'}`);
    }
    
    console.log('\n🎉 API CRUD Test Completed!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

console.log('📝 Note: This test requires:');
console.log('   1. Backend server running on localhost:3001');
console.log('   2. Valid authentication token');
console.log('   3. User access to reports');
console.log('');
console.log('⚠️  Authentication may fail - this is expected in a real scenario');
console.log('   Use browser network tab to get real auth token for testing');
console.log('');

testCRUDAPI(); 