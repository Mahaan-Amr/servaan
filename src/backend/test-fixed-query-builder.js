// Test the fixed QueryBuilder with scenarios that were failing
console.log('Testing Fixed QueryBuilder...');

// Test case 1: Supplier name + User name (was failing due to missing JOINs)
console.log('\n=== Test 1: Supplier + User fields ===');
const test1Config = {
  dataSources: ['suppliers', 'users'],
  columns: [
    { id: 'supplier_name', label: 'نام تأمین‌کننده', aggregation: 'none' },
    { id: 'user_name', label: 'نام کاربر', aggregation: 'none' }
  ],
  filters: [],
  sorting: []
};

console.log('Expected tables: suppliers, users, item_suppliers, inventory_entries, items');
console.log('Expected JOIN order:');
console.log('1. Item i (base)');
console.log('2. InventoryEntry ie (for users)');
console.log('3. User u (depends on ie)');
console.log('4. ItemSupplier isp (for suppliers)');
console.log('5. Supplier s (depends on isp)');

// Test case 2: Supplier + User + Inventory quantity (more complex scenario)
console.log('\n=== Test 2: Supplier + User + Inventory ===');
const test2Config = {
  dataSources: ['suppliers', 'users', 'inventory'],
  columns: [
    { id: 'supplier_name', label: 'نام تأمین‌کننده', aggregation: 'none' },
    { id: 'user_name', label: 'نام کاربر', aggregation: 'none' },
    { id: 'inventory_quantity', label: 'تعداد', aggregation: 'none' }
  ],
  filters: [],
  sorting: []
};

console.log('Expected tables: suppliers, users, inventory_entries, item_suppliers, items');
console.log('This should work because all dependent tables are included');

console.log('\n✅ Test configurations ready for browser testing');
console.log('Use these field combinations in the report builder:');
console.log('- supplier_name (نام تأمین‌کننده)');
console.log('- user_name (نام کاربر)');
console.log('- inventory_quantity (مقدار تراکنش)'); 