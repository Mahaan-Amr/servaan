import { PrismaClient } from '../../shared/generated/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'] // Add logging for debugging
});

// Debug flag
const DEBUG_TESTS = process.env.DEBUG_TESTS === 'true';

// Helper function for debug logging
export const debugLog = (message: string, data?: any) => {
  if (DEBUG_TESTS) {
    console.log(`🧪 [TEST DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Global test setup
beforeAll(async () => {
  try {
    // Connect to test database
    await testPrisma.$connect();
    debugLog('Connected to test database');
    
    // Verify database connection
    const userCount = await testPrisma.user.count();
    debugLog(`Initial user count: ${userCount}`);
    
    console.log('🔗 Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Clean up after each test with transaction safety
afterEach(async () => {
  try {
    debugLog('Starting test cleanup...');
    
    // Use individual deletions with proper order to handle foreign keys
    // Delete in reverse dependency order
    
    const inventoryCount = await testPrisma.inventoryEntry.count();
    if (inventoryCount > 0) {
      await testPrisma.inventoryEntry.deleteMany();
      debugLog(`Deleted ${inventoryCount} inventory entries`);
    }
    
    const itemSupplierCount = await testPrisma.itemSupplier.count();
    if (itemSupplierCount > 0) {
      await testPrisma.itemSupplier.deleteMany();
      debugLog(`Deleted ${itemSupplierCount} item-supplier relationships`);
    }
    
    const itemCount = await testPrisma.item.count();
    if (itemCount > 0) {
      await testPrisma.item.deleteMany();
      debugLog(`Deleted ${itemCount} items`);
    }
    
    const supplierCount = await testPrisma.supplier.count();
    if (supplierCount > 0) {
      await testPrisma.supplier.deleteMany();
      debugLog(`Deleted ${supplierCount} suppliers`);
    }
    
    const userCount = await testPrisma.user.count();
    if (userCount > 0) {
      await testPrisma.user.deleteMany();
      debugLog(`Deleted ${userCount} users`);
    }
    
    debugLog('Test cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
    
    // If normal cleanup fails, try a force cleanup
    try {
      debugLog('Attempting force cleanup...');
      
      // Disable foreign key checks temporarily (if supported)
      await testPrisma.$executeRaw`SET foreign_key_checks = 0;`.catch(() => {
        // PostgreSQL equivalent
        return testPrisma.$executeRaw`SET session_replication_role = replica;`;
      }).catch(() => {
        debugLog('Could not disable foreign key checks');
      });
      
      // Force delete all tables
      await testPrisma.inventoryEntry.deleteMany();
      await testPrisma.itemSupplier.deleteMany();
      await testPrisma.item.deleteMany();
      await testPrisma.supplier.deleteMany();
      await testPrisma.user.deleteMany();
      
      // Re-enable foreign key checks
      await testPrisma.$executeRaw`SET foreign_key_checks = 1;`.catch(() => {
        // PostgreSQL equivalent
        return testPrisma.$executeRaw`SET session_replication_role = DEFAULT;`;
      }).catch(() => {
        debugLog('Could not re-enable foreign key checks');
      });
      
      debugLog('Force cleanup completed');
    } catch (forceError) {
      console.error('❌ Force cleanup also failed:', forceError);
    }
  }
});

// Global test teardown
afterAll(async () => {
  try {
    debugLog('Disconnecting from test database...');
    await testPrisma.$disconnect();
    console.log('🔌 Disconnected from test database');
  } catch (error) {
    console.error('❌ Error disconnecting from test database:', error);
  }
});

// Enhanced test utilities with proper validation and debugging

export const createTestUser = async (role: 'ADMIN' | 'MANAGER' | 'STAFF' = 'STAFF', customData?: Partial<any>) => {
  const bcrypt = require('bcryptjs');
  
  try {
    debugLog(`Creating test user with role: ${role}`);
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    const timestamp = Date.now();
    
    const userData = {
      name: customData?.name || `Test ${role} User ${timestamp}`,
      email: customData?.email || `test-${role.toLowerCase()}-${timestamp}@test.com`,
      password: hashedPassword,
      role,
      phoneNumber: customData?.phoneNumber || '09123456789',
      active: customData?.active !== undefined ? customData.active : true,
      ...customData
    };
    
    const user = await testPrisma.user.create({
      data: userData
    });
    
    debugLog(`Created test user:`, { id: user.id, name: user.name, email: user.email, role: user.role });
    return user;
  } catch (error) {
    console.error(`❌ Failed to create test user with role ${role}:`, error);
    throw error;
  }
};

export const createTestSupplier = async (customData?: Partial<any>) => {
  try {
    debugLog('Creating test supplier');
    
    const timestamp = Date.now();
    const supplierData = {
      name: customData?.name || `Test Supplier ${timestamp}`,
      contactName: customData?.contactName || 'Test Contact',
      email: customData?.email || `test-supplier-${timestamp}@test.com`,
      phoneNumber: customData?.phoneNumber || '02112345678',
      address: customData?.address || 'Test Address',
      notes: customData?.notes || 'Test supplier for testing',
      isActive: customData?.isActive !== undefined ? customData.isActive : true,
      ...customData
    };
    
    const supplier = await testPrisma.supplier.create({
      data: supplierData
    });
    
    debugLog(`Created test supplier:`, { id: supplier.id, name: supplier.name });
    return supplier;
  } catch (error) {
    console.error('❌ Failed to create test supplier:', error);
    throw error;
  }
};

export const createTestItem = async (customData?: Partial<any>) => {
  try {
    debugLog('Creating test item');
    
    const timestamp = Date.now();
    const itemData = {
      name: customData?.name || `Test Item ${timestamp}`,
      category: customData?.category || 'Test Category',
      unit: customData?.unit || 'kg',
      minStock: customData?.minStock !== undefined ? customData.minStock : 10,
      description: customData?.description || 'Test item for testing',
      isActive: customData?.isActive !== undefined ? customData.isActive : true,
      barcode: customData?.barcode || undefined,
      ...customData
    };
    
    const item = await testPrisma.item.create({
      data: itemData
    });
    
    debugLog(`Created test item:`, { id: item.id, name: item.name, category: item.category, minStock: item.minStock });
    return item;
  } catch (error) {
    console.error('❌ Failed to create test item:', error);
    throw error;
  }
};

export const createTestInventoryEntry = async (
  itemId: string, 
  userId: string, 
  customData?: Partial<any>
) => {
  try {
    debugLog('Creating test inventory entry', { itemId, userId });
    
    // Verify dependencies exist
    const item = await testPrisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error(`Item with ID ${itemId} does not exist`);
    }
    
    const user = await testPrisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`);
    }
    
    const entryData = {
      itemId,
      userId,
      quantity: customData?.quantity !== undefined ? customData.quantity : 10,
      type: customData?.type || 'IN',
      note: customData?.note || 'Test entry',
      unitPrice: customData?.unitPrice !== undefined ? customData.unitPrice : (customData?.type === 'IN' ? 1000 : null),
      expiryDate: customData?.expiryDate || undefined,
      // Include any other custom data fields including createdAt
      ...(customData && Object.keys(customData).reduce((acc, key) => {
        if (!['quantity', 'type', 'note', 'unitPrice', 'expiryDate'].includes(key)) {
          acc[key] = customData[key];
        }
        return acc;
      }, {} as any))
    };
    
    const entry = await testPrisma.inventoryEntry.create({
      data: entryData
    });
    
    debugLog(`Created test inventory entry:`, { id: entry.id, itemId: entry.itemId, quantity: entry.quantity, type: entry.type, createdAt: entry.createdAt });
    return entry;
  } catch (error) {
    console.error('❌ Failed to create test inventory entry:', error);
    throw error;
  }
};

// Helper function to create a complete test scenario with all dependencies
export const createTestScenario = async (scenario: {
  users?: Array<{ role: 'ADMIN' | 'MANAGER' | 'STAFF', data?: any }>;
  suppliers?: Array<any>;
  items?: Array<any>;
  inventoryEntries?: Array<{ itemIndex: number, userIndex: number, data?: any }>;
}) => {
  try {
    debugLog('Creating complete test scenario', scenario);
    
    // Create users
    const users: any[] = [];
    if (scenario.users) {
      for (const userConfig of scenario.users) {
        const user = await createTestUser(userConfig.role, userConfig.data);
        users.push(user);
      }
    }
    
    // Create suppliers
    const suppliers: any[] = [];
    if (scenario.suppliers) {
      for (const supplierData of scenario.suppliers) {
        const supplier = await createTestSupplier(supplierData);
        suppliers.push(supplier);
      }
    }
    
    // Create items
    const items: any[] = [];
    if (scenario.items) {
      for (const itemData of scenario.items) {
        const item = await createTestItem(itemData);
        items.push(item);
      }
    }
    
    // Create inventory entries
    const inventoryEntries: any[] = [];
    if (scenario.inventoryEntries && items.length > 0 && users.length > 0) {
      for (const entryConfig of scenario.inventoryEntries) {
        const item = items[entryConfig.itemIndex];
        const user = users[entryConfig.userIndex];
        
        if (item && user) {
          const entry = await createTestInventoryEntry(item.id, user.id, entryConfig.data);
          inventoryEntries.push(entry);
        }
      }
    }
    
    debugLog('Test scenario created successfully', {
      usersCount: users.length,
      suppliersCount: suppliers.length,
      itemsCount: items.length,
      entriesCount: inventoryEntries.length
    });
    
    return {
      users,
      suppliers,
      items,
      inventoryEntries
    };
  } catch (error) {
    console.error('❌ Failed to create test scenario:', error);
    throw error;
  }
};

// Validation helpers
export const validateTestData = async () => {
  try {
    const counts = {
      users: await testPrisma.user.count(),
      suppliers: await testPrisma.supplier.count(),
      items: await testPrisma.item.count(),
      inventoryEntries: await testPrisma.inventoryEntry.count(),
      itemSuppliers: await testPrisma.itemSupplier.count()
    };
    
    debugLog('Current test data counts:', counts);
    return counts;
  } catch (error) {
    console.error('❌ Failed to validate test data:', error);
    throw error;
  }
}; 
