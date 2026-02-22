const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectInsert() {
  try {
    console.log('🧪 Testing direct Tenant creation\n');
    
    const result = await prisma.$executeRaw`
      INSERT INTO "Tenant" (
        id,
        subdomain,
        name,
        "displayName",
        plan,
        "maxUsers",
        "isActive",
        "ownerName",
        "ownerEmail",
        timezone,
        locale,
        currency,
        country,
        "createdAt",
        "updatedAt"
      ) VALUES (
        'test123',
        'testdima',
        'TestDima',
        'Test',
        'BUSINESS',
        20,
        true,
        'Owner',
        'owner@test.ir',
        'Asia/Tehran',
        'fa-IR',
        'TOMAN',
        'Iran',
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Direct SQL insert successful');
    
    // Try with Prisma again
    const prismaResult = await prisma.tenant.create({
      data: {
        subdomain: 'prismatestdima',
        name: 'PrismaTestDima',
        displayName: 'Prisma',
        plan: 'BUSINESS',
        maxUsers: 20,
        isActive: true,
        ownerName: 'Owner',
        ownerEmail: 'owner@prism.ir',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        currency: 'TOMAN'
      }
    });
    
    console.log('✅ Prisma insert also successful');
    console.log('Created tenant ID:', prismaResult.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.meta) {
      console.log('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDirectInsert();
