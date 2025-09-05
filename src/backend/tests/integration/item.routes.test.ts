import request from 'supertest';
import express from 'express';
import { itemRoutes } from '../../src/routes/itemRoutes';
import { testPrisma, createTestUser, createTestItem, createTestSupplier } from '../setup';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { generateToken } from '../../src/services/authService';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/items', itemRoutes);
app.use(errorHandler);

describe('Item Routes', () => {
  let adminToken: string;
  let managerToken: string;
  let staffToken: string;

  beforeEach(async () => {
    // Create test users and tokens
    const adminUser = await createTestUser('ADMIN');
    const managerUser = await createTestUser('MANAGER');
    const staffUser = await createTestUser('STAFF');

    adminToken = generateToken(adminUser.id);
    managerToken = generateToken(managerUser.id);
    staffToken = generateToken(staffUser.id);
  });

  describe('GET /api/items', () => {
    test('should return all items for admin', async () => {
      await createTestItem();
      await createTestItem();

      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items).toHaveLength(2);
    });

    test('should return items for manager', async () => {
      await createTestItem();

      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    test('should return items for staff', async () => {
      await createTestItem();

      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/items');

      expect(response.status).toBe(401);
    });

    test('should filter items by search query', async () => {
      await testPrisma.item.create({
        data: {
          name: 'شیر پر چرب',
          category: 'لبنیات',
          unit: 'لیتر',
          minStock: 20,
          description: 'شیر پر چرب پاستوریزه',
          isActive: true
        }
      });

      await testPrisma.item.create({
        data: {
          name: 'قهوه اسپرسو',
          category: 'نوشیدنی',
          unit: 'کیلوگرم',
          minStock: 3,
          description: 'دانه قهوه درجه یک',
          isActive: true
        }
      });

      const response = await request(app)
        .get('/api/items?search=شیر')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toContain('شیر');
    });

    test('should filter items by category', async () => {
      await testPrisma.item.create({
        data: {
          name: 'شیر',
          category: 'لبنیات',
          unit: 'لیتر',
          isActive: true
        }
      });

      await testPrisma.item.create({
        data: {
          name: 'قهوه',
          category: 'نوشیدنی',
          unit: 'کیلوگرم',
          isActive: true
        }
      });

      const response = await request(app)
        .get('/api/items?category=لبنیات')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].category).toBe('لبنیات');
    });

    test('should filter items by active status', async () => {
      await testPrisma.item.create({
        data: {
          name: 'Active Item',
          category: 'Test',
          unit: 'kg',
          isActive: true
        }
      });

      await testPrisma.item.create({
        data: {
          name: 'Inactive Item',
          category: 'Test',
          unit: 'kg',
          isActive: false
        }
      });

      const response = await request(app)
        .get('/api/items?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].isActive).toBe(true);
    });

    test('should filter items by low stock', async () => {
      // Create item with current stock below minimum
      const item = await testPrisma.item.create({
        data: {
          name: 'Low Stock Item',
          category: 'Test',
          unit: 'kg',
          minStock: 10,
          isActive: true
        }
      });

      // Create inventory entry with quantity below minStock
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 5,
          type: 'IN',
          note: 'Initial stock',
          userId: (await createTestUser('ADMIN')).id
        }
      });

      const response = await request(app)
        .get('/api/items?lowStock=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/items/:id', () => {
    test('should return item by ID', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .get(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', item.id);
      expect(response.body).toHaveProperty('name', item.name);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'کالا یافت نشد');
    });

    test('should include item suppliers in response', async () => {
      const item = await createTestItem();
      const supplier = await createTestSupplier();

      // Create item-supplier relationship
      await testPrisma.itemSupplier.create({
        data: {
          itemId: item.id,
          supplierId: supplier.id,
          preferredSupplier: true,
          unitPrice: 1000
        }
      });

      const response = await request(app)
        .get(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suppliers');
      expect(Array.isArray(response.body.suppliers)).toBe(true);
      expect(response.body.suppliers).toHaveLength(1);
    });

    test('should include current stock in response', async () => {
      const item = await createTestItem();
      const user = await createTestUser('ADMIN');

      // Create inventory entries
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 100,
          type: 'IN',
          note: 'Stock in',
          userId: user.id
        }
      });

      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: -20,
          type: 'OUT',
          note: 'Stock out',
          userId: user.id
        }
      });

      const response = await request(app)
        .get(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStock');
      expect(response.body.currentStock).toBe(80);
    });
  });

  describe('POST /api/items', () => {
    const validItemData = {
      name: 'New Test Item',
      category: 'Test Category',
      unit: 'kg',
      minStock: 10,
      description: 'Test item description',
      barcode: '1234567890123'
    };

    test('should create item as admin', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItemData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', validItemData.name);
      expect(response.body).toHaveProperty('isActive', true);
    });

    test('should create item as manager', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validItemData);

      expect(response.status).toBe(201);
    });

    test('should reject creation by staff', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validItemData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای این عملیات را ندارید');
    });

    test('should reject creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
          category: '', // Empty
          unit: 'invalid-unit'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject creation with duplicate name', async () => {
      await testPrisma.item.create({
        data: {
          name: 'Duplicate Item',
          category: 'Test',
          unit: 'kg'
        }
      });

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Item',
          category: 'Test',
          unit: 'kg'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'کالا با این نام قبلا ثبت شده است');
    });

    test('should reject creation with duplicate barcode', async () => {
      const barcode = '1234567890123';
      
      await testPrisma.item.create({
        data: {
          name: 'First Item',
          category: 'Test',
          unit: 'kg',
          barcode
        }
      });

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Second Item',
          category: 'Test',
          unit: 'kg',
          barcode
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'کالا با این بارکد قبلا ثبت شده است');
    });

    test('should set default values correctly', async () => {
      const minimalData = {
        name: 'Minimal Item',
        category: 'Test',
        unit: 'kg'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('minStock', 0);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('description', null);
      expect(response.body).toHaveProperty('barcode', null);
    });
  });

  describe('PUT /api/items/:id', () => {
    test('should update item as admin', async () => {
      const item = await createTestItem();
      const updateData = {
        name: 'Updated Item Name',
        description: 'Updated description',
        minStock: 15
      };

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('description', updateData.description);
      expect(response.body).toHaveProperty('minStock', updateData.minStock);
    });

    test('should update item as manager', async () => {
      const item = await createTestItem();
      const updateData = { name: 'Manager Updated' };

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    test('should reject update by staff', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Update' });

      expect(response.status).toBe(403);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });

    test('should reject update with invalid data', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // Empty name
          minStock: -1 // Negative stock
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('should soft delete item as admin', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'کالا با موفقیت حذف شد');

      // Verify soft delete
      const deletedItem = await testPrisma.item.findUnique({
        where: { id: item.id }
      });
      expect(deletedItem?.isActive).toBe(false);
    });

    test('should reject deletion by manager', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });

    test('should reject deletion by staff', async () => {
      const item = await createTestItem();

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('should prevent deletion of item with active inventory', async () => {
      const item = await createTestItem();
      const user = await createTestUser('ADMIN');

      // Create inventory entry
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: item.id,
          quantity: 10,
          type: 'IN',
          note: 'Stock',
          userId: user.id
        }
      });

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'نمی‌توان کالای دارای موجودی را حذف کرد');
    });
  });

  describe('GET /api/items/:id/stock-history', () => {
    test('should return stock history for item', async () => {
      const item = await createTestItem();
      const user = await createTestUser('ADMIN');

      // Create inventory entries
      await testPrisma.inventoryEntry.createMany({
        data: [
          {
            itemId: item.id,
            quantity: 100,
            type: 'IN',
            note: 'Initial stock',
            userId: user.id,
            unitPrice: 1000
          },
          {
            itemId: item.id,
            quantity: -20,
            type: 'OUT',
            note: 'Sold',
            userId: user.id
          },
          {
            itemId: item.id,
            quantity: 50,
            type: 'IN',
            note: 'Restock',
            userId: user.id,
            unitPrice: 1100
          }
        ]
      });

      const response = await request(app)
        .get(`/api/items/${item.id}/stock-history`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
      expect(Array.isArray(response.body.entries)).toBe(true);
      expect(response.body.entries).toHaveLength(3);
      expect(response.body).toHaveProperty('currentStock', 130);
    });

    test('should support pagination for stock history', async () => {
      const item = await createTestItem();
      const user = await createTestUser('ADMIN');

      // Create multiple inventory entries
      for (let i = 1; i <= 15; i++) {
        await testPrisma.inventoryEntry.create({
          data: {
            itemId: item.id,
            quantity: i,
            type: 'IN',
            note: `Entry ${i}`,
            userId: user.id
          }
        });
      }

      const response = await request(app)
        .get(`/api/items/${item.id}/stock-history?page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(10);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total', 15);
      expect(response.body.pagination).toHaveProperty('pages', 2);
    });
  });
}); 
