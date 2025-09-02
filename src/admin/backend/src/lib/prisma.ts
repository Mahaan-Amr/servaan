import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance
const prisma = new PrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;
