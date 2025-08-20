import { generateToken, verifyToken, loginUser, registerUser } from '../../src/services/authService';
import { testPrisma, createTestUser } from '../setup';
import bcrypt from 'bcryptjs';

describe('Authentication Service', () => {
  describe('Token Management', () => {
    test('should generate a valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should verify a valid token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(userId);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('توکن نامعتبر یا منقضی شده');
    });

    test('should generate token with custom expiry', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId, '30d');
      
      expect(token).toBeDefined();
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(userId);
    });
  });

  describe('User Login', () => {
    test('should login user with correct credentials', async () => {
      // Create test user
      const testUser = await createTestUser('STAFF');
      
      // Login with correct credentials
      const result = await loginUser(testUser.email, 'test123');
      
      expect(result).toHaveProperty('id', testUser.id);
      expect(result).toHaveProperty('name', testUser.name);
      expect(result).toHaveProperty('email', testUser.email);
      expect(result).toHaveProperty('role', testUser.role);
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
    });

    test('should reject login with incorrect email', async () => {
      await expect(
        loginUser('nonexistent@test.com', 'password')
      ).rejects.toThrow('ایمیل یا رمز عبور اشتباه است');
    });

    test('should reject login with incorrect password', async () => {
      const testUser = await createTestUser('STAFF');
      
      await expect(
        loginUser(testUser.email, 'wrongpassword')
      ).rejects.toThrow('ایمیل یا رمز عبور اشتباه است');
    });

    test('should reject login for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('test123', 10);
      const inactiveUser = await testPrisma.user.create({
        data: {
          name: 'Inactive User',
          email: 'inactive@test.com',
          password: hashedPassword,
          role: 'STAFF',
          active: false
        }
      });

      await expect(
        loginUser(inactiveUser.email, 'test123')
      ).rejects.toThrow('حساب کاربری شما غیرفعال شده است');
    });

    test('should handle remember me option', async () => {
      const testUser = await createTestUser('STAFF');
      
      const result = await loginUser(testUser.email, 'test123', true);
      
      expect(result).toHaveProperty('token');
      // Token should be valid (we can't easily test expiry time without mocking)
      const decoded = verifyToken(result.token);
      expect(decoded.id).toBe(testUser.id);
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'STAFF' as const,
        phoneNumber: '09123456789'
      };

      const result = await registerUser(
        userData.name,
        userData.email,
        userData.password,
        userData.role,
        userData.phoneNumber
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', userData.name);
      expect(result).toHaveProperty('email', userData.email);
      expect(result).toHaveProperty('role', userData.role);
      expect(result).toHaveProperty('token');

      // Verify user was created in database
      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser?.name).toBe(userData.name);
    });

    test('should reject registration with existing email', async () => {
      const testUser = await createTestUser('STAFF');
      
      await expect(
        registerUser('Another User', testUser.email, 'password123')
      ).rejects.toThrow('این ایمیل قبلا ثبت شده است');
    });

    test('should hash password during registration', async () => {
      const userData = {
        name: 'Password Test User',
        email: 'passwordtest@test.com',
        password: 'plainpassword123'
      };

      await registerUser(userData.name, userData.email, userData.password);

      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(dbUser?.password).not.toBe(userData.password);
      expect(dbUser?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should set default role to STAFF', async () => {
      const result = await registerUser(
        'Default Role User',
        'defaultrole@test.com',
        'password123'
      );

      expect(result.role).toBe('STAFF');
    });

    test('should register user with custom role', async () => {
      const result = await registerUser(
        'Admin User',
        'admin@test.com',
        'password123',
        'ADMIN'
      );

      expect(result.role).toBe('ADMIN');
    });
  });
}); 