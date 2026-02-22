import jwt from 'jsonwebtoken';
import { authenticateAdminPlatform, authorizeAdminPlatform } from '../../src/middlewares/adminPlatformAuth';

describe('admin platform auth middleware', () => {
  const secret = 'unit-test-admin-secret';

  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = secret;
    process.env.ADMIN_JWT_ISSUER = 'servaan-admin';
    process.env.ADMIN_JWT_AUDIENCE = 'servaan-admin-users';
  });

  const makeRes = () => {
    const res: any = {
      statusCode: 200,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        this.body = payload;
        return this;
      }
    };
    return res;
  };

  test('accepts valid admin token and allowed role', () => {
    const token = jwt.sign(
      { adminUserId: 'admin-1', role: 'SUPER_ADMIN' },
      secret,
      { issuer: 'servaan-admin', audience: 'servaan-admin-users' }
    );

    const req: any = { headers: { authorization: `Bearer ${token}` }, method: 'GET', path: '/api/tenants' };
    const res = makeRes();
    const next = jest.fn();

    authenticateAdminPlatform(req, res as any, next as any);
    expect(next).toHaveBeenCalledTimes(1);

    const authorize = authorizeAdminPlatform(['SUPER_ADMIN', 'PLATFORM_ADMIN']);
    authorize(req, res as any, next as any);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('returns 401 for missing token', () => {
    const req: any = { headers: {}, method: 'GET', path: '/api/tenants' };
    const res = makeRes();
    const next = jest.fn();

    authenticateAdminPlatform(req, res as any, next as any);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('returns 403 for disallowed role', () => {
    const req: any = {
      adminPlatformUser: { id: 'admin-2', role: 'SUPPORT' }
    };
    const res = makeRes();
    const next = jest.fn();

    const authorize = authorizeAdminPlatform(['SUPER_ADMIN', 'PLATFORM_ADMIN']);
    authorize(req, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
