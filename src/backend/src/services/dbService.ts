import { PrismaClient } from '../../../shared/generated/client';

// Validate and log DATABASE_URL before creating client
console.log('DATABASE_URL:', process.env['DATABASE_URL']);
console.log('🔧 Prisma Client Initialization:');
console.log('📍 DATABASE_URL:', process.env['DATABASE_URL'] ? 'Found' : 'NOT FOUND');

if (!process.env['DATABASE_URL']) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  console.error('📍 Make sure .env file exists and contains DATABASE_URL');
  console.error('🔧 Current working directory:', process.cwd());
  console.error('🔧 Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
  throw new Error('DATABASE_URL is not defined in environment variables');
}

console.log('✅ Creating Prisma client with DATABASE_URL...');

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
