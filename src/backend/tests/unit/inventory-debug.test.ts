import { 
  calculateCurrentStock, 
  isLowStock
} from '../../src/services/inventoryService';
import { 
  testPrisma, 
  createTestUser, 
  createTestItem, 
  createTestInventoryEntry,
  validateTestData,
  debugLog
} from '../setup';

// Enable debug mode for this test file
process.env.DEBUG_TESTS = 'true';

describe('Inventory Service - Debug Tests', () => {
  beforeEach(async () => {
    debugLog('=== DEBUG TEST STARTING ===');
    
    // Force cleanup
    await testPrisma.inventoryEntry.deleteMany();
    await testPrisma.itemSupplier.deleteMany();
    await testPrisma.item.deleteMany();
    await testPrisma.supplier.deleteMany();
    await testPrisma.user.deleteMany();
    
    const counts = await validateTestData();
    debugLog('Clean state confirmed', counts);
  });

  test('should create test data correctly', async () => {
    debugLog('=== Creating test data step by step ===');
    
    // Step 1: Create user
    const user = await createTestUser('ADMIN', { name: 'Debug Admin User' });
    debugLog('Created user', { id: user.id, name: user.name, role: user.role });
    
    // Step 2: Create item
    const item = await createTestItem({ name: 'Debug Test Item', minStock: 10 });
    debugLog('Created item', { id: item.id, name: item.name, minStock: item.minStock });
    
    // Step 3: Create inventory entry
    const entry = await createTestInventoryEntry(item.id, user.id, {
      quantity: 50,
      type: 'IN',
      note: 'Debug test entry',
      unitPrice: 1000
    });
    debugLog('Created inventory entry', { 
      id: entry.id, 
      itemId: entry.itemId, 
      userId: entry.userId, 
      quantity: entry.quantity 
    });
    
    // Step 4: Test stock calculation
    const currentStock = await calculateCurrentStock(item.id);
    debugLog('Calculated current stock', { itemId: item.id, currentStock });
    
    // Step 5: Test low stock detection
    const isLow = await isLowStock(item.id);
    debugLog('Low stock check', { itemId: item.id, minStock: item.minStock, currentStock, isLow });
    
    // Assertions
    expect(currentStock).toBe(50);
    expect(isLow).toBe(false); // 50 > 10, so not low stock
    
    debugLog('=== DEBUG TEST COMPLETED SUCCESSFULLY ===');
  });

  test('should handle multiple entries correctly', async () => {
    debugLog('=== Testing multiple entries ===');
    
    const user = await createTestUser('ADMIN');
    const item = await createTestItem({ name: 'Multi Entry Item', minStock: 100 });
    
    // Create multiple entries
    const entry1 = await createTestInventoryEntry(item.id, user.id, {
      quantity: 50,
      type: 'IN',
      unitPrice: 1000
    });
    debugLog('Created entry 1', { quantity: entry1.quantity });
    
    const entry2 = await createTestInventoryEntry(item.id, user.id, {
      quantity: 30,
      type: 'IN',
      unitPrice: 1200
    });
    debugLog('Created entry 2', { quantity: entry2.quantity });
    
    const entry3 = await createTestInventoryEntry(item.id, user.id, {
      quantity: -20,
      type: 'OUT'
    });
    debugLog('Created entry 3', { quantity: entry3.quantity });
    
    const currentStock = await calculateCurrentStock(item.id);
    debugLog('Final stock calculation', { 
      entry1: entry1.quantity,
      entry2: entry2.quantity, 
      entry3: entry3.quantity,
      total: currentStock
    });
    
    expect(currentStock).toBe(60); // 50 + 30 - 20 = 60
    
    const isLow = await isLowStock(item.id);
    expect(isLow).toBe(true); // 60 < 100, so low stock
    
    debugLog('=== MULTIPLE ENTRIES TEST COMPLETED ===');
  });

  test('should handle empty inventory correctly', async () => {
    debugLog('=== Testing empty inventory ===');
    
    const item = await createTestItem({ name: 'Empty Item' });
    
    const currentStock = await calculateCurrentStock(item.id);
    debugLog('Empty inventory stock', { itemId: item.id, currentStock });
    
    expect(currentStock).toBe(0);
    
    debugLog('=== EMPTY INVENTORY TEST COMPLETED ===');
  });
}); 
