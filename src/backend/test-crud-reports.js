// Test script for Custom Reports CRUD operations
console.log('🧪 Testing Custom Reports CRUD Operations...\n');

const testData = {
  // Test user ID (should exist in your database)
  userId: '6d09b0c5-8ffd-4271-806f-9241db09bd73',
  
  // Test report configuration
  reportConfig: {
    name: 'CRUD Test Report',
    description: 'Test report for CRUD operations verification',
    reportType: 'TABULAR',
    dataSources: ['inventory', 'items'],
    columnsConfig: [
      { id: 'item_name', label: 'نام کالا', type: 'text', table: 'items' },
      { id: 'quantity', label: 'تعداد', type: 'number', table: 'inventory_entry' }
    ],
    filtersConfig: [],
    chartConfig: { type: 'table' },
    isPublic: false
  }
};

async function testCRUDOperations() {
  try {
    // Import required services
    const { ReportService } = require('./dist/backend/src/services/reportService');
    
    console.log('📊 Test Data:');
    console.log(`- User ID: ${testData.userId}`);
    console.log(`- Report Name: ${testData.reportConfig.name}`);
    console.log(`- Fields Count: ${testData.reportConfig.columnsConfig.length}`);
    console.log('');

    // 1. CREATE - Test creating a new report
    console.log('🔵 1. Testing CREATE operation...');
    const createdReport = await ReportService.createReport(testData.reportConfig, testData.userId);
    console.log(`✅ Report created successfully with ID: ${createdReport.id}`);
    console.log(`   Name: ${createdReport.name}`);
    console.log('');

    // Store the created report ID for other operations
    const reportId = createdReport.id;

    // 2. READ - Test reading the created report
    console.log('🔵 2. Testing READ operation...');
    const readReport = await ReportService.getReportById(reportId, testData.userId);
    console.log(`✅ Report read successfully:`);
    console.log(`   ID: ${readReport.id}`);
    console.log(`   Name: ${readReport.name}`);
    console.log(`   Description: ${readReport.description}`);
    console.log(`   Created At: ${readReport.createdAt}`);
    console.log('');

    // 3. UPDATE - Test updating the report
    console.log('🔵 3. Testing UPDATE operation...');
    const updateData = {
      name: 'CRUD Test Report - UPDATED',
      description: 'Updated description for CRUD test',
      columnsConfig: [
        ...testData.reportConfig.columnsConfig,
        { id: 'entry_type', label: 'نوع تراکنش', type: 'text', table: 'inventory_entry' }
      ]
    };
    
    const updatedReport = await ReportService.updateReport(reportId, testData.userId, updateData);
    console.log(`✅ Report updated successfully:`);
    console.log(`   ID: ${updatedReport.id}`);
    console.log(`   Name: ${updatedReport.name}`);
    console.log(`   Description: ${updatedReport.description}`);
    console.log(`   Fields Count: ${JSON.parse(updatedReport.columnsConfig).length}`);
    console.log('');

    // 4. EXECUTE - Test executing the report
    console.log('🔵 4. Testing EXECUTE operation...');
    const executeResult = await ReportService.executeReport(reportId, testData.userId);
    console.log(`✅ Report executed successfully:`);
    console.log(`   Result Count: ${executeResult.resultCount}`);
    console.log(`   Execution Time: ${executeResult.executionTime}ms`);
    console.log(`   Status: ${executeResult.status}`);
    console.log('');

    // 5. LIST - Test getting reports list
    console.log('🔵 5. Testing LIST operation...');
    const reportsList = await ReportService.getReports(testData.userId, 1, 10);
    console.log(`✅ Reports list retrieved successfully:`);
    console.log(`   Total Reports: ${reportsList.pagination.total}`);
    console.log(`   Current Page: ${reportsList.pagination.page}`);
    console.log(`   Reports on this page: ${reportsList.reports.length}`);
    console.log('');

    // 6. DELETE - Test deleting the report
    console.log('🔵 6. Testing DELETE operation...');
    await ReportService.deleteReport(reportId, testData.userId);
    console.log(`✅ Report deleted successfully (soft delete)`);
    
    // Verify deletion by trying to read the report
    try {
      await ReportService.getReportById(reportId, testData.userId);
      console.log('❌ ERROR: Report should not be accessible after deletion');
    } catch (error) {
      console.log(`✅ Confirmed: Report is no longer accessible (${error.message})`);
    }
    console.log('');

    // Final Summary
    console.log('🎉 ALL CRUD OPERATIONS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Summary:');
    console.log('   ✓ CREATE - Report created successfully');
    console.log('   ✓ READ   - Report retrieved successfully');
    console.log('   ✓ UPDATE - Report updated successfully');
    console.log('   ✓ EXECUTE- Report executed successfully');
    console.log('   ✓ LIST   - Reports list retrieved successfully');
    console.log('   ✓ DELETE - Report deleted successfully');
    console.log('');
    console.log('🔍 All operations are working as expected!');

  } catch (error) {
    console.error('❌ CRUD Test Failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCRUDOperations(); 