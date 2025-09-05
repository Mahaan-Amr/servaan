import request from 'supertest';
import express from 'express';
import { userRoutes } from '../../src/routes/userRoutes';
import { testPrisma, createTestUser } from '../setup';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { generateToken } from '../../src/services/authService';
import bcrypt from 'bcryptjs';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

describe('User Routes', () => {
  let adminToken: string;
  let managerToken: string;
  let staffToken: string;
  let adminUser: any;

  beforeEach(async () => {
    // Create test users and tokens
    adminUser = await createTestUser('ADMIN');
    const managerUser = await createTestUser('MANAGER');
    const staffUser = await createTestUser('STAFF');

    adminToken = generateToken(adminUser.id);
    managerToken = generateToken(managerUser.id);
    staffToken = generateToken(staffUser.id);
  });

  describe('GET /api/users', () => {
    test('should return all users for admin', async () => {
      await createTestUser('STAFF');
      await createTestUser('MANAGER');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(3);
    });

    test('should return limited user info for manager', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      
      // Managers should not see sensitive data like passwords
      response.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      });
    });

    test('should reject access for staff', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای این عملیات را ندارید');
    });

    test('should filter users by role', async () => {
      await createTestUser('STAFF');
      await createTestUser('STAFF');
      await createTestUser('MANAGER');

      const response = await request(app)
        .get('/api/users?role=STAFF')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3); // 2 new + 1 existing
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('STAFF');
      });
    });

    test('should search users by name or email', async () => {
      await testPrisma.user.create({
        data: {
          name: 'احمد محمدی',
          email: 'ahmad@test.com',
          password: await bcrypt.hash('password', 10),
          role: 'STAFF',
          active: true
        }
      });

      const response = await request(app)
        .get('/api/users?search=احمد')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].name).toContain('احمد');
    });

    test('should support pagination', async () => {
      // Create multiple users
      for (let i = 1; i <= 15; i++) {
        await testPrisma.user.create({
          data: {
            name: `کاربر ${i}`,
            email: `user${i}@test.com`,
            password: await bcrypt.hash('password', 10),
            role: 'STAFF',
            active: true
          }
        });
      }

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(10);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    test('should filter active/inactive users', async () => {
      await testPrisma.user.create({
        data: {
          name: 'کاربر غیرفعال',
          email: 'inactive@test.com',
          password: await bcrypt.hash('password', 10),
          role: 'STAFF',
          active: false
        }
      });

      const response = await request(app)
        .get('/api/users?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].active).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user by ID for admin', async () => {
      const testUser = await createTestUser('STAFF');

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    test('should allow manager to view staff details', async () => {
      const staffUser = await createTestUser('STAFF');

      const response = await request(app)
        .get(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', staffUser.id);
    });

    test('should prevent manager from viewing admin details', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای مشاهده این کاربر را ندارید');
    });

    test('should allow users to view their own profile', async () => {
      const staffUser = await createTestUser('STAFF');
      const staffToken = generateToken(staffUser.id);

      const response = await request(app)
        .get(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', staffUser.id);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'کاربر یافت نشد');
    });

    test('should include user activity summary', async () => {
      const testUser = await createTestUser('STAFF');

      // Create some activity for the user
      await testPrisma.inventoryEntry.create({
        data: {
          itemId: (await createTestUser('ADMIN')).id, // Use as placeholder
          quantity: 100,
          type: 'IN',
          note: 'Test activity',
          userId: testUser.id
        }
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}?includeActivity=true`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activitySummary');
      expect(response.body.activitySummary).toHaveProperty('totalEntries');
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      name: 'کاربر جدید',
      email: 'newuser@test.com',
      password: 'SecurePass123!',
      role: 'STAFF',
      phone: '09123456789'
    };

    test('should create user as admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', validUserData.name);
      expect(response.body).toHaveProperty('email', validUserData.email);
      expect(response.body).toHaveProperty('role', validUserData.role);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('active', true);
    });

    test('should allow manager to create staff users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('role', 'STAFF');
    });

    test('should prevent manager from creating admin users', async () => {
      const adminUserData = { ...validUserData, role: 'ADMIN' };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(adminUserData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای ایجاد این نوع کاربر را ندارید');
    });

    test('should reject creation by staff', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validUserData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای این عملیات را ندارید');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          email: 'invalid-email',
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should reject duplicate email', async () => {
      await testPrisma.user.create({
        data: {
          name: 'کاربر موجود',
          email: 'existing@test.com',
          password: await bcrypt.hash('password', 10),
          role: 'STAFF',
          active: true
        }
      });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUserData,
          email: 'existing@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'کاربری با این ایمیل قبلا ثبت شده است');
    });

    test('should hash password before saving', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUserData);

      expect(response.status).toBe(201);

      // Verify password was hashed
      const user = await testPrisma.user.findUnique({
        where: { id: response.body.id }
      });

      expect(user?.password).not.toBe(validUserData.password);
      expect(await bcrypt.compare(validUserData.password, user?.password || '')).toBe(true);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUserData,
          email: 'invalid-email-format'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('فرمت ایمیل نامعتبر است');
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUserData,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('رمز عبور باید حداقل ۸ کاراکتر داشته باشد');
    });

    test('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validUserData,
          phone: '123' // Invalid format
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('فرمت شماره تلفن نامعتبر است');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user as admin', async () => {
      const testUser = await createTestUser('STAFF');
      const updateData = {
        name: 'نام جدید',
        phone: '09123456789',
        role: 'MANAGER'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('phone', updateData.phone);
      expect(response.body).toHaveProperty('role', updateData.role);
    });

    test('should allow manager to update staff details', async () => {
      const staffUser = await createTestUser('STAFF');
      const updateData = { name: 'نام به‌روزرسانی شده' };

      const response = await request(app)
        .put(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
    });

    test('should prevent manager from promoting users to admin', async () => {
      const staffUser = await createTestUser('STAFF');

      const response = await request(app)
        .put(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای تغییر این نقش را ندارید');
    });

    test('should allow users to update their own profile', async () => {
      const staffUser = await createTestUser('STAFF');
      const staffToken = generateToken(staffUser.id);
      const updateData = {
        name: 'نام شخصی جدید',
        phone: '09123456789'
      };

      const response = await request(app)
        .put(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
    });

    test('should prevent users from changing their own role', async () => {
      const staffUser = await createTestUser('STAFF');
      const staffToken = generateToken(staffUser.id);

      const response = await request(app)
        .put(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما نمی‌توانید نقش خود را تغییر دهید');
    });

    test('should prevent email updates', async () => {
      const testUser = await createTestUser('STAFF');

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newemail@test.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'نمی‌توان ایمیل را تغییر داد');
    });

    test('should handle password updates separately', async () => {
      const testUser = await createTestUser('STAFF');
      const newPassword = 'NewSecurePass123!';

      const response = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'رمز عبور با موفقیت تغییر یافت');

      // Verify password was changed
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(await bcrypt.compare(newPassword, updatedUser?.password || '')).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should soft delete user as admin', async () => {
      const testUser = await createTestUser('STAFF');

      const response = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'کاربر با موفقیت حذف شد');

      // Verify soft delete
      const deletedUser = await testPrisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(deletedUser?.active).toBe(false);
    });

    test('should reject deletion by manager', async () => {
      const testUser = await createTestUser('STAFF');

      const response = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'شما دسترسی لازم برای این عملیات را ندارید');
    });

    test('should prevent deletion of last admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'نمی‌توان آخرین مدیر سیستم را حذف کرد');
    });

    test('should prevent users from deleting themselves', async () => {
      const staffUser = await createTestUser('STAFF');
      const staffToken = generateToken(staffUser.id);

      const response = await request(app)
        .delete(`/api/users/${staffUser.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'نمی‌توانید خود را حذف کنید');
    });
  });

  describe('POST /api/users/:id/activate', () => {
    test('should activate deactivated user', async () => {
      const testUser = await testPrisma.user.create({
        data: {
          name: 'کاربر غیرفعال',
          email: 'inactive@test.com',
          password: await bcrypt.hash('password', 10),
          role: 'STAFF',
          active: false
        }
      });

      const response = await request(app)
        .post(`/api/users/${testUser.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'کاربر با موفقیت فعال شد');

      const activatedUser = await testPrisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(activatedUser?.active).toBe(true);
    });

    test('should reject activation by non-admin', async () => {
      const testUser = await createTestUser('STAFF');

      const response = await request(app)
        .post(`/api/users/${testUser.id}/activate`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/profile', () => {
    test('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', adminUser.id);
      expect(response.body).toHaveProperty('name', adminUser.name);
      expect(response.body).toHaveProperty('email', adminUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    test('should include user preferences', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
    });
  });
}); 
