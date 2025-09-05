import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../../src/routes/supplierRoutes';
import { testPrisma, createTestUser, createTestSupplier, createTestItem } from '../setup';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { generateToken } from '../../src/services/authService';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);
app.use(errorHandler);

describe('Supplier Routes', () => {
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

  describe('GET /api/suppliers', () => {
    test('should return all suppliers for admin', async () => {
      await createTestSupplier();
      await createTestSupplier();

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suppliers');
      expect(Array.isArray(response.body.suppliers)).toBe(true);
      expect(response.body.suppliers).toHaveLength(2);
    });

    test('should return suppliers for manager', async () => {
      await createTestSupplier();

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suppliers');
    });

    test('should return suppliers for staff', async () => {
      await createTestSupplier();

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suppliers');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/suppliers');

      expect(response.status).toBe(401);
    });

    test('should filter suppliers by search query', async () => {
      await testPrisma.supplier.create({
        data: {
          name: 'شرکت لبنیات پاک',
          contactName: 'محمد رضایی',
          email: 'info@pak-dairy.com',
          isActive: true
        }
      });

      await testPrisma.supplier.create({
        data: {
          name: 'کافه بین ایرانیان',
          contactName: 'سارا احمدی',
          email: 'orders@iranian-beans.ir',
          isActive: true
        }
      });

      const response = await request(app)
        .get('/api/suppliers?search=لبنیات')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.suppliers).toHaveLength(1);
      expect(response.body.suppliers[0].name).toContain('لبنیات');
    });

    test('should filter suppliers by active status', async () => {
      await testPrisma.supplier.create({
        data: {
          name: 'Active Supplier',
          isActive: true
        }
      });

      await testPrisma.supplier.create({
        data: {
          name: 'Inactive Supplier',
          isActive: false
        }
      });

      const response = await request(app)
        .get('/api/suppliers?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.suppliers).toHaveLength(1);
      expect(response.body.suppliers[0].isActive).toBe(true);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    test('should return supplier by ID', async () => {
      const supplier = await createTestSupplier();

      const response = await request(app)
        .get(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', supplier.id);
      expect(response.body).toHaveProperty('name', supplier.name);
    });

    test('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .get('/api/suppliers/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'تامین کننده یافت نشد');
    });

    test('should include supplier items in response', async () => {
      const supplier = await createTestSupplier();
      const item = await createTestItem();

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
        .get(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items).toHaveLength(1);
    });
  });

  describe('POST /api/suppliers', () => {
    const validSupplierData = {
      name: 'New Supplier',
      contactName: 'Contact Person',
      email: 'contact@newsupplier.com',
      phoneNumber: '02112345678',
      address: 'Test Address',
      notes: 'Test notes'
    };

    test('should create supplier as admin', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplierData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', validSupplierData.name);
      expect(response.body).toHaveProperty('isActive', true);
    });

    test('should create supplier as manager', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validSupplierData);

      expect(response.status).toBe(201);
    });

    test('should reject creation by staff', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validSupplierData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای این عملیات را ندارید');
    });

    test('should reject creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject creation with duplicate name', async () => {
      await testPrisma.supplier.create({
        data: { name: 'Duplicate Supplier' }
      });

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Supplier',
          contactName: 'Test Contact'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'تامین کننده با این نام قبلا ثبت شده است');
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    test('should update supplier as admin', async () => {
      const supplier = await createTestSupplier();
      const updateData = {
        name: 'Updated Supplier Name',
        contactName: 'Updated Contact'
      };

      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('contactName', updateData.contactName);
    });

    test('should update supplier as manager', async () => {
      const supplier = await createTestSupplier();
      const updateData = { name: 'Manager Updated' };

      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    test('should reject update by staff', async () => {
      const supplier = await createTestSupplier();

      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Update' });

      expect(response.status).toBe(403);
    });

    test('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .put('/api/suppliers/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    test('should soft delete supplier as admin', async () => {
      const supplier = await createTestSupplier();

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'تامین کننده با موفقیت حذف شد');

      // Verify soft delete
      const deletedSupplier = await testPrisma.supplier.findUnique({
        where: { id: supplier.id }
      });
      expect(deletedSupplier?.isActive).toBe(false);
    });

    test('should reject deletion by manager', async () => {
      const supplier = await createTestSupplier();

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });

    test('should reject deletion by staff', async () => {
      const supplier = await createTestSupplier();

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/suppliers/:id/items', () => {
    test('should add item to supplier', async () => {
      const supplier = await createTestSupplier();
      const item = await createTestItem();

      const response = await request(app)
        .post(`/api/suppliers/${supplier.id}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: item.id,
          unitPrice: 1500,
          preferredSupplier: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'کالا با موفقیت به تامین کننده اضافه شد');

      // Verify relationship was created
      const relationship = await testPrisma.itemSupplier.findUnique({
        where: {
          itemId_supplierId: {
            itemId: item.id,
            supplierId: supplier.id
          }
        }
      });
      expect(relationship).toBeTruthy();
      expect(relationship?.unitPrice).toBe(1500);
    });

    test('should reject duplicate item-supplier relationship', async () => {
      const supplier = await createTestSupplier();
      const item = await createTestItem();

      // Create initial relationship
      await testPrisma.itemSupplier.create({
        data: {
          itemId: item.id,
          supplierId: supplier.id,
          unitPrice: 1000
        }
      });

      const response = await request(app)
        .post(`/api/suppliers/${supplier.id}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: item.id,
          unitPrice: 1500
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'این کالا قبلا به این تامین کننده اضافه شده است');
    });
  });

  describe('DELETE /api/suppliers/:id/items/:itemId', () => {
    test('should remove item from supplier', async () => {
      const supplier = await createTestSupplier();
      const item = await createTestItem();

      // Create relationship
      await testPrisma.itemSupplier.create({
        data: {
          itemId: item.id,
          supplierId: supplier.id,
          unitPrice: 1000
        }
      });

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'کالا از تامین کننده حذف شد');

      // Verify relationship was deleted
      const relationship = await testPrisma.itemSupplier.findUnique({
        where: {
          itemId_supplierId: {
            itemId: item.id,
            supplierId: supplier.id
          }
        }
      });
      expect(relationship).toBeNull();
    });

    test('should return 404 for non-existent relationship', async () => {
      const supplier = await createTestSupplier();
      const item = await createTestItem();

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}/items/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'رابطه کالا و تامین کننده یافت نشد');
    });
  });
}); 
