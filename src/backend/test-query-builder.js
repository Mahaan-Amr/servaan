const { QueryBuilder } = require('./dist/backend/src/services/queryBuilder');

async function testQueryBuilder() {
  console.log('Testing QueryBuilder...');
  
  try {
    // Test 3: Query with calculated field and aggregation
    console.log('\n=== Test 3: Query with calculated field and aggregation ===');
    const config3 = {
      dataSources: ['inventory', 'items'],
      columns: [
        { id: 'item_name', label: 'نام کالا', aggregation: 'none' },
        { id: 'total_value', label: 'ارزش کل', aggregation: 'sum' }
      ],
      filters: [],
      sorting: []
    };
    
    const query3 = await QueryBuilder.buildQuery(config3);
    console.log('Query 3:', query3);
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testQueryBuilder(); 