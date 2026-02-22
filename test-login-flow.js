const { PrismaClient } = require('./src/shared/generated/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Simulate what the login endpoint does
    const host = 'dima.localhost:3000';
    const subdomain = host.split('.')[0]; // Extract 'dima'

    console.log(`Host: ${host}`);
    console.log(`Subdomain: ${subdomain}`);

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    console.log(`Tenant found: ${tenant ? tenant.name : 'NOT FOUND'}`);
    console.log(`Tenant ID: ${tenant?.id}`);

    if (tenant) {
      // Find user in this tenant
      const user = await prisma.user.findFirst({
        where: {
          email: 'alirezayousefi@dima.ir',
          tenantId: tenant.id
        },
        select: { id: true, email: true, name: true, active: true }
      });

      console.log(`User found: ${user ? 'YES' : 'NO'}`);
      console.log(`User details:`, user);
    }

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testLogin();
