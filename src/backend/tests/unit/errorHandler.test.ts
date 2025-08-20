import { Request, Response } from 'express';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { AppError } from '../../src/utils/AppError';

// Mock response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Mock request object
const mockRequest = (data: Partial<Request> = {}): Request => {
  return {
    method: 'GET',
    path: '/test',
    ip: '127.0.0.1',
    headers: {},
    ...data
  } as Request;
};

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();

describe('Error Handler Middleware', () => {
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('AppError Handling', () => {
    test('should handle AppError with status code and message', () => {
      const error = new AppError('کاربر یافت نشد', 404);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'کاربر یافت نشد',
        error: {
          status: 404,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should handle AppError with additional details', () => {
      const error = new AppError('اطلاعات نامعتبر', 400, {
        field: 'email',
        code: 'INVALID_FORMAT'
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'اطلاعات نامعتبر',
        error: {
          status: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          details: {
            field: 'email',
            code: 'INVALID_FORMAT'
          }
        }
      });
    });

    test('should handle operational AppError without logging', () => {
      const error = new AppError('دسترسی مجاز نیست', 403, null, true);

      errorHandler(error, req, res, next);

      expect(console.error).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should log non-operational AppError', () => {
      const error = new AppError('خطای سیستم', 500, null, false);

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Validation Error Handling', () => {
    test('should handle Joi validation errors', () => {
      const error = {
        name: 'ValidationError',
        isJoi: true,
        details: [
          { message: '"name" is required', path: ['name'] },
          { message: '"email" must be a valid email', path: ['email'] }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'اطلاعات نامعتبر',
        error: {
          status: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          validationErrors: [
            { field: 'name', message: 'این فیلد الزامی است' },
            { field: 'email', message: 'فرمت ایمیل نامعتبر است' }
          ]
        }
      });
    });

    test('should handle Prisma validation errors', () => {
      const error = {
        name: 'PrismaClientValidationError',
        message: 'Invalid `prisma.user.create()` invocation'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'اطلاعات نامعتبر',
        error: {
          status: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('Database Error Handling', () => {
    test('should handle unique constraint violation', () => {
      const error = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: {
          target: ['email']
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'کاربری با این ایمیل قبلا ثبت شده است',
        error: {
          status: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          code: 'DUPLICATE_ENTRY'
        }
      });
    });

    test('should handle foreign key constraint violation', () => {
      const error = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
        meta: {
          field_name: 'userId'
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ارجاع به رکورد نامعتبر',
        error: {
          status: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          code: 'INVALID_REFERENCE'
        }
      });
    });

    test('should handle record not found error', () => {
      const error = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'رکورد یافت نشد',
        error: {
          status: 404,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          code: 'NOT_FOUND'
        }
      });
    });

    test('should handle database connection error', () => {
      const error = {
        name: 'PrismaClientInitializationError',
        message: 'Can\'t reach database server'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'خطا در اتصال به پایگاه داده',
        error: {
          status: 503,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('JWT Error Handling', () => {
    test('should handle invalid JWT token', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'invalid token'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'توکن نامعتبر',
        error: {
          status: 401,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          code: 'INVALID_TOKEN'
        }
      });
    });

    test('should handle expired JWT token', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'توکن منقضی شده است',
        error: {
          status: 401,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          code: 'TOKEN_EXPIRED'
        }
      });
    });
  });

  describe('Generic Error Handling', () => {
    test('should handle generic Error with 500 status', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'خطای داخلی سرور',
        error: {
          status: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    test('should handle unknown error types', () => {
      const error = 'String error';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'خطای داخلی سرور',
        error: {
          status: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('Development vs Production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: 'Error: Test error\n    at test.js:1:1'
          })
        })
      );
    });

    test('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.error).not.toHaveProperty('stack');
    });

    test('should sanitize sensitive information in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed: password=secret123');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'خطای داخلی سرور',
        error: {
          status: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('Request Context', () => {
    test('should include user ID in error context when available', () => {
      const reqWithUser = mockRequest({
        user: { id: 'user123', role: 'ADMIN' }
      });
      const error = new AppError('Test error', 400);

      errorHandler(error, reqWithUser, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            userId: 'user123'
          })
        })
      );
    });

    test('should include request ID when available', () => {
      const reqWithId = mockRequest({
        headers: { 'x-request-id': 'req-123' }
      });
      const error = new AppError('Test error', 400);

      errorHandler(error, reqWithId, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            requestId: 'req-123'
          })
        })
      );
    });

    test('should handle long request paths', () => {
      const reqWithLongPath = mockRequest({
        path: '/api/very/long/path/that/exceeds/normal/length/and/should/be/truncated'
      });
      const error = new AppError('Test error', 400);

      errorHandler(error, reqWithLongPath, res, next);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.error.path.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Logging', () => {
    test('should log errors with appropriate level', () => {
      const criticalError = new AppError('Critical system error', 500);
      errorHandler(criticalError, req, res, next);
      expect(console.error).toHaveBeenCalled();

      jest.clearAllMocks();

      const warningError = new AppError('Validation warning', 400);
      errorHandler(warningError, req, res, next);
      expect(console.warn).toHaveBeenCalled();
    });

    test('should include correlation ID in logs', () => {
      const error = new AppError('Test error', 500);
      
      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error ID:')
      );
    });

    test('should log request details for debugging', () => {
      const error = new Error('System error');
      
      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Request: GET /test')
      );
    });
  });

  describe('Rate Limiting Errors', () => {
    test('should handle rate limit exceeded error', () => {
      const error = {
        name: 'RateLimitError',
        message: 'Too many requests',
        resetTime: Date.now() + 60000
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'تعداد درخواست‌ها بیش از حد مجاز',
        error: {
          status: 429,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          retryAfter: expect.any(Number)
        }
      });
    });
  });

  describe('Async Error Handling', () => {
    test('should handle promise rejection errors', () => {
      const error = {
        name: 'UnhandledPromiseRejectionWarning',
        message: 'Unhandled promise rejection'
      };

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle async timeout errors', () => {
      const error = {
        name: 'TimeoutError',
        message: 'Operation timed out'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'زمان انتظار به پایان رسید',
        error: {
          status: 408,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });
}); 