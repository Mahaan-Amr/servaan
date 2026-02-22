const { PrismaClient } = require('./src/shared/generated/client');

const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Get all users for the dima tenant
    const users = await prisma.user.findMany({
      where: { email: 'alirezayousefi@dima.ir' },
      select: { id: true, email: true, createdAt: true }
    });

    console.log(`Found ${users.length} users with email alirezayousefi@dima.ir`);

    if (users.length > 1) {
      // Keep only the first one, delete duplicates
      const toDelete = users.slice(1);
      console.log(`Deleting ${toDelete.length} duplicate users...`);

      for (const user of toDelete) {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`  ✅ Deleted user ${user.id}`);
      }

      console.log('✅ Cleanup complete');
    } else {
      console.log('✅ No duplicates found');
    }

    // Also cleanup sara@dima.ir
    const saraUsers = await prisma.user.findMany({
      where: { email: 'sara@dima.ir' },
      select: { id: true, email: true, createdAt: true }
    });

    if (saraUsers.length > 1) {
      const toDelete = saraUsers.slice(1);
      console.log(`\nDeleting ${toDelete.length} duplicate sara users...`);

      for (const user of toDelete) {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`  ✅ Deleted user ${user.id}`);
      }
    }

    // Verify
    const finalCount = await prisma.user.count();
    console.log(`\nFinal user count: ${finalCount}`);

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

cleanup();
