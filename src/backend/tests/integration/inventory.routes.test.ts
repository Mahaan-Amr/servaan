import request from 'supertest';
import express from 'express';
import { inventoryRoutes } from '../../src/routes/inventoryRoutes';
import { testPrisma, createTestUser, createTestItem, createTestInventoryEntry } from '../setup';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { generateToken } from '../../src/services/authService';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/inventory', inventoryRoutes);
app.use(errorHandler);

describe('Inventory Routes', () => {
  let adminToken: string;
  let managerToken: string;
  let staffToken: string;
  let testUser: any;

  beforeEach(async () => {
    // Create test users and tokens
    const adminUser = await createTestUser('ADMIN');
    const managerUser = await createTestUser('MANAGER');
    const staffUser = await createTestUser('STAFF');

    testUser = adminUser;
    adminToken = generateToken(adminUser.id);
    managerToken = generateToken(managerUser.id);
    staffToken = generateToken(staffUser.id);
  });

  describe('GET /api/inventory/entries', () => {
    test('should return all inventory entries for admin', async () => {
      const item = await createTestItem();
      await createTestInventoryEntry(item.id, testUser.id);
      await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .get('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
      expect(Array.isArray(response.body.entries)).toBe(true);
      expect(response.body.entries).toHaveLength(2);
    });

    test('should return entries for manager', async () => {
      const item = await createTestItem();
      await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .get('/api/inventory/entries')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
    });

    test('should return entries for staff', async () => {
      const item = await createTestItem();
      await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .get('/api/inventory/entries')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
    });

    test('should filter entries by item ID', async () => {
      const item1 = await createTestItem();
      const item2 = await createTestItem();
      
      await createTestInventoryEntry(item1.id, testUser.id);
      await createTestInventoryEntry(item2.id, testUser.id);

      const response = await request(app)
        .get(`/api/inventory/entries?itemId=${item1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(response.body.entries[0].itemId).toBe(item1.id);
    });

    test('should filter entries by type', async () => {
      const item = await createTestItem();
      
      // Create IN entry
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Stock in',
          userId: testUser.id
        }
      });

      // Create OUT entry
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: -20,
          type: 'OUT',
          note: 'Stock out',
          userId: testUser.id
        }
      });

      const response = await request(app)
        .get('/api/inventory/entries?type=IN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(response.body.entries[0].type).toBe('IN');
    });

    test('should filter entries by date range', async () => {
      const item = await createTestItem();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Old entry',
          userId: testUser.id,
          createdAt: yesterday
        }
      });

      await createTestInventoryEntry(item.id, testUser.id);

      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/inventory/entries?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
    });

    test('should support pagination', async () => {
      const item = await createTestItem();

      // Create multiple entries
      for (let i = 1; i <= 15; i++) {
        await testPrisma.inventoryEntry.create({
          data: {
            itemId: item.id,
            quantity: i,
            type: 'IN',
            note: `Entry ${i}`,
            userId: testUser.id
          }
        });
      }

      const response = await request(app)
        .get('/api/inventory/entries?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(10);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total', 15);
      expect(response.body.pagination).toHaveProperty('pages', 2);
    });
  });

  describe('POST /api/inventory/entries', () => {
    test('should create inventory entry as admin', async () => {
      const item = await createTestItem();
      const entryData = {
        itemId: item.id,
        quantity: 100,
        type: 'IN',
        note: 'New stock arrival',
        unitPrice: 1500,
        batchNumber: 'BATCH001',
        expiryDate: '2025-12-31'
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(entryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('quantity', entryData.quantity);
      expect(response.body).toHaveProperty('type', entryData.type);
      expect(response.body).toHaveProperty('note', entryData.note);
      expect(response.body).toHaveProperty('userId', testUser.id);
    });

    test('should create entry as manager', async () => {
      const item = await createTestItem();
      const entryData = {
        itemId: item.id,
        quantity: 50,
        type: 'IN',
        note: 'Manager entry',
        unitPrice: 1000
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(entryData);

      expect(response.status).toBe(201);
    });

    test('should create entry as staff', async () => {
      const item = await createTestItem();
      const entryData = {
        itemId: item.id,
        quantity: -10,
        type: 'OUT',
        note: 'Staff consumption'
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(entryData);

      expect(response.status).toBe(201);
    });

    test('should reject entry with invalid data', async () => {
      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: 'invalid-id',
          quantity: 0, // Zero quantity
          type: 'INVALID_TYPE'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject entry for non-existent item', async () => {
      const entryData = {
        itemId: 'non-existent-id',
        quantity: 100,
        type: 'IN',
        note: 'Test entry'
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(entryData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'کالا یافت نشد');
    });

    test('should validate stock availability for OUT entries', async () => {
      const item = await createTestItem();
      
      // Add some stock first
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 50,
          type: 'IN',
          note: 'Initial stock',
          userId: testUser.id
        }
      });

      // Try to remove more than available
      const entryData = {
        itemId: item.id,
        quantity: -100, // More than available (50)
        type: 'OUT',
        note: 'Excessive consumption'
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(entryData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'موجودی کافی نیست');
    });

    test('should require unitPrice for IN entries', async () => {
      const item = await createTestItem();
      const entryData = {
        itemId: item.id,
        quantity: 100,
        type: 'IN',
        note: 'Stock without price'
        // Missing unitPrice
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(entryData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'قیمت واحد برای ورودی الزامی است');
    });

    test('should handle expiry date validation', async () => {
      const item = await createTestItem();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const entryData = {
        itemId: item.id,
        quantity: 100,
        type: 'IN',
        note: 'Expired stock',
        unitPrice: 1000,
        expiryDate: pastDate.toISOString()
      };

      const response = await request(app)
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(entryData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'تاریخ انقضا نمی‌تواند در گذشته باشد');
    });
  });

  describe('PUT /api/inventory/entries/:id', () => {
    test('should update entry as admin', async () => {
      const item = await createTestItem();
      const entry = await createTestInventoryEntry(item.id, testUser.id);
      
      const updateData = {
        note: 'Updated note',
        batchNumber: 'UPDATED_BATCH'
      };

      const response = await request(app)
        .put(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('note', updateData.note);
      expect(response.body).toHaveProperty('batchNumber', updateData.batchNumber);
    });

    test('should reject update by staff for other users entries', async () => {
      const item = await createTestItem();
      const entry = await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .put(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ note: 'Staff update' });

      expect(response.status).toBe(403);
    });

    test('should prevent updating quantity and type', async () => {
      const item = await createTestItem();
      const entry = await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .put(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 999,
          type: 'OUT'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'نمی‌توان مقدار و نوع تراکنش را تغییر داد');
    });
  });

  describe('DELETE /api/inventory/entries/:id', () => {
    test('should delete entry as admin', async () => {
      const item = await createTestItem();
      const entry = await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .delete(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'رکورد موجودی با موفقیت حذف شد');

      // Verify deletion
      const deletedEntry = await testPrisma.inventoryEntry.findUnique({
        where: { id: entry.id }
      });
      expect(deletedEntry).toBeNull();
    });

    test('should reject deletion by staff', async () => {
      const item = await createTestItem();
      const entry = await createTestInventoryEntry(item.id, testUser.id);

      const response = await request(app)
        .delete(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    test('should prevent deletion of old entries', async () => {
      const item = await createTestItem();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30); // 30 days ago

      const entry = await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Old entry',
          userId: testUser.id,
          createdAt: oldDate
        }
      });

      const response = await request(app)
        .delete(`/api/inventory/entries/${entry.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'نمی‌توان رکوردهای قدیمی را حذف کرد');
    });
  });

  describe('GET /api/inventory/stock-levels', () => {
    test('should return current stock levels', async () => {
      const item1 = await createTestItem();
      const item2 = await createTestItem();

      // Add stock to items
      await testPrisma.inventoryEntry.createMany({
        data: [
          { itemId: item1.id, quantity: 100, type: 'IN', note: 'Stock 1', userId: testUser.id },
          { itemId: item1.id, quantity: -20, type: 'OUT', note: 'Usage 1', userId: testUser.id },
          { itemId: item2.id, quantity: 50, type: 'IN', note: 'Stock 2', userId: testUser.id }
        ]
      });

      const response = await request(app)
        .get('/api/inventory/stock-levels')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stockLevels');
      expect(Array.isArray(response.body.stockLevels)).toBe(true);
      expect(response.body.stockLevels).toHaveLength(2);

      const item1Stock = response.body.stockLevels.find((s: any) => s.itemId === item1.id);
      const item2Stock = response.body.stockLevels.find((s: any) => s.itemId === item2.id);

      expect(item1Stock.currentStock).toBe(80);
      expect(item2Stock.currentStock).toBe(50);
    });

    test('should filter by low stock items', async () => {
      const lowStockItem = await testPrisma.item.create({
        data: {
          name: 'Low Stock Item',
          category: 'Test',
          unit: 'kg',
          minStock: 20,
          isActive: true
        }
      });

      const normalItem = await testPrisma.item.create({
        data: {
          name: 'Normal Item',
          category: 'Test',
          unit: 'kg',
          minStock: 10,
          isActive: true
        }
      });

      // Add stock below minimum for first item
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: lowStockItem.id,
          quantity: 15, // Below minStock (20)
          type: 'IN',
          note: 'Low stock',
          userId: testUser.id
        }
      });

      // Add stock above minimum for second item
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: normalItem.id,
          quantity: 50, // Above minStock (10)
          type: 'IN',
          note: 'Normal stock',
          userId: testUser.id
        }
      });

      const response = await request(app)
        .get('/api/inventory/stock-levels?lowStock=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stockLevels).toHaveLength(1);
      expect(response.body.stockLevels[0].itemId).toBe(lowStockItem.id);
      expect(response.body.stockLevels[0].isLowStock).toBe(true);
    });
  });

  describe('GET /api/inventory/reports/movement', () => {
    test('should generate inventory movement report', async () => {
      const item = await createTestItem();

      // Create various transactions
      await testPrisma.inventoryEntry.createMany({
        data: [
          { itemId: item.id, quantity: 100, type: 'IN', note: 'Purchase', userId: testUser.id, unitPrice: 1000 },
          { itemId: item.id, quantity: -30, type: 'OUT', note: 'Sale', userId: testUser.id },
          { itemId: item.id, quantity: 50, type: 'IN', note: 'Restock', userId: testUser.id, unitPrice: 1100 },
          { itemId: item.id, quantity: -20, type: 'OUT', note: 'Usage', userId: testUser.id }
        ]
      });

      const response = await request(app)
        .get('/api/inventory/reports/movement')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('totalIn', 150);
      expect(response.body.report).toHaveProperty('totalOut', 50);
      expect(response.body.report).toHaveProperty('netMovement', 100);
    });

    test('should support date range filtering', async () => {
      const item = await createTestItem();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Yesterday',
          userId: testUser.id,
          createdAt: yesterday
        }
      });

      await createTestInventoryEntry(item.id, testUser.id);

      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/inventory/reports/movement?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.report.entries).toHaveLength(1);
    });
  });

  describe('GET /api/inventory/reports/valuation', () => {
    test('should generate inventory valuation report', async () => {
      const item1 = await createTestItem();
      const item2 = await createTestItem();

      // Add stock with different prices
      await testPrisma.inventoryEntry.createMany({
        data: [
          { itemId: item1.id, quantity: 100, type: 'IN', note: 'Purchase 1', userId: testUser.id, unitPrice: 1000 },
          { itemId: item1.id, quantity: 50, type: 'IN', note: 'Purchase 2', userId: testUser.id, unitPrice: 1200 },
          { itemId: item2.id, quantity: 75, type: 'IN', note: 'Purchase 3', userId: testUser.id, unitPrice: 800 }
        ]
      });

      const response = await request(app)
        .get('/api/inventory/reports/valuation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valuation');
      expect(response.body.valuation).toHaveProperty('totalValue');
      expect(response.body.valuation).toHaveProperty('items');
      expect(Array.isArray(response.body.valuation.items)).toBe(true);
    });

    test('should calculate weighted average cost', async () => {
      const item = await createTestItem();

      // Add stock at different prices
      await testPrisma.inventoryEntry.createMany({
        data: [
          { itemId: item.id, quantity: 100, type: 'IN', note: 'First purchase', userId: testUser.id, unitPrice: 1000 },
          { itemId: item.id, quantity: 50, type: 'IN', note: 'Second purchase', userId: testUser.id, unitPrice: 1200 }
        ]
      });

      const response = await request(app)
        .get('/api/inventory/reports/valuation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const itemValuation = response.body.valuation.items.find((i: any) => i.itemId === item.id);
      // Weighted average: (100*1000 + 50*1200) / 150 = 1066.67
      expect(Math.round(itemValuation.averageCost)).toBe(1067);
    });
  });

  describe('POST /api/inventory/adjust', () => {
    test('should perform stock adjustment as admin', async () => {
      const item = await createTestItem();
      
      // Add initial stock
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Initial stock',
          userId: testUser.id,
          unitPrice: 1000
        }
      });

      const adjustmentData = {
        itemId: item.id,
        newQuantity: 85,
        reason: 'Physical count adjustment'
      };

      const response = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'تعدیل موجودی با موفقیت انجام شد');
      expect(response.body.adjustment).toHaveProperty('quantity', -15); // 85 - 100
    });

    test('should reject adjustment by staff', async () => {
      const item = await createTestItem();
      const adjustmentData = {
        itemId: item.id,
        newQuantity: 50,
        reason: 'Adjustment'
      };

      const response = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(adjustmentData);

      expect(response.status).toBe(403);
    });

    test('should require reason for adjustment', async () => {
      const item = await createTestItem();
      const adjustmentData = {
        itemId: item.id,
        newQuantity: 50
        // Missing reason
      };

      const response = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });
  });
}); 
