import { PrismaClient } from '../../../shared/generated/client';

// Validate and log DATABASE_URL before creating client
console.log('[پایگاه داده] مقدار DATABASE_URL:', process.env['DATABASE_URL']);
console.log('[پایگاه داده] آماده‌سازی Prisma Client');
console.log('[پایگاه داده] وضعیت DATABASE_URL:', process.env['DATABASE_URL'] ? 'پیدا شد' : 'پیدا نشد');

if (!process.env['DATABASE_URL']) {
  console.error('[پایگاه داده] DATABASE_URL در متغیرهای محیطی تعریف نشده است');
  console.error('[پایگاه داده] مطمئن شوید فایل .env وجود دارد و DATABASE_URL داخل آن ثبت شده است');
  console.error('[پایگاه داده] مسیر اجرای فعلی:', process.cwd());
  console.error('[پایگاه داده] متغیرهای محیطی مرتبط:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
  throw new Error('DATABASE_URL is not defined in environment variables');
}

console.log('[پایگاه داده] ساخت Prisma Client با DATABASE_URL');

// Create a singleton Prisma client instance with robust configuration
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'colorless',
  transactionOptions: {
    timeout: 5000,
  },
  // Add datasources configuration to avoid configuration issues
  datasources: {
    db: {
      url: process.env['DATABASE_URL']
    }
  }
});

export { prisma }; 

