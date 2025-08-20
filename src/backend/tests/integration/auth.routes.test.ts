import request from 'supertest';
import express from 'express';
import { authRoutes } from '../../src/routes/authRoutes';
import { testPrisma, createTestUser } from '../setup';
import { errorHandler } from '../../src/middlewares/errorHandler';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Authentication Routes', () => {
  describe('POST /api/auth/login', () => {
    test('should login user with valid credentials', async () => {
      const testUser = await createTestUser('STAFF');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', testUser.role);
      expect(response.body).toHaveProperty('token');
    });

    test('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
      expect(response.body).toHaveProperty('errors');
    });

    test('should reject login with short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject login with wrong credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'ایمیل یا رمز عبور اشتباه است');
    });

    test('should handle remember me option', async () => {
      const testUser = await createTestUser('STAFF');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test123',
          rememberMe: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('should update last login time', async () => {
      const testUser = await createTestUser('STAFF');
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test123'
        });

      const updatedUser = await testPrisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser?.lastLogin).toBeTruthy();
      expect(new Date(updatedUser!.lastLogin!)).toBeInstanceOf(Date);
      expect(updatedUser!.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'STAFF',
        phoneNumber: '09123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('role', userData.role);
      expect(response.body).toHaveProperty('token');
    });

    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject registration with short name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'AB',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });

    test('should reject registration with existing email', async () => {
      const testUser = await createTestUser('STAFF');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: testUser.email,
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'این ایمیل قبلا ثبت شده است');
    });

    test('should reject registration with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'INVALID_ROLE'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'اطلاعات نامعتبر');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user info with valid token', async () => {
      const testUser = await createTestUser('ADMIN');
      
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test123'
        });

      const token = loginResponse.body.token;

      // Get current user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', testUser.role);
      expect(response.body).not.toHaveProperty('password');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'توکن احراز هویت ارائه نشده است');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'توکن نامعتبر');
    });

    test('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'توکن احراز هویت ارائه نشده است');
    });
  });
}); 