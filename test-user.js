const { PrismaClient } = require('./src/shared/generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function test() {
  try {
    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'alirezayousefi@dima.ir' },
      select: { id: true, email: true, password: true, name: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('Password hash length:', user.password.length);
    console.log('Hash starts with:', user.password.substring(0, 20));

    // Test password
    const isMatch = await bcrypt.compare('manager123', user.password);
    console.log('Password matches "manager123":', isMatch);

    if (!isMatch) {
      console.log('❌ Password does NOT match!');
    } else {
      console.log('✅ Password matches correctly');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
