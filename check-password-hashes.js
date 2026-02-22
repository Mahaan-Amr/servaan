const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'src/backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:hiddenitch1739@localhost:5432/servaan_test';
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    // Get all users with the test email
    const allUsers = await prisma.user.findMany({
      where: { email: 'alirezayousefi@dima.ir' }
    });
    
    console.log('🔑 Testing password hashes:\n');
    
    for (const user of allUsers) {
      console.log(`User ID: ${user.id}`);
      console.log(`Password hash: ${user.password}`);
      
      const matches = await bcrypt.compare('manager123', user.password);
      console.log(`Password "manager123" matches: ${matches ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }
    
    console.log('\n🔍 The problem:');
    console.log('findFirst() will return the FIRST user it finds.');
    console.log('If that first user has an invalid password hash, login fails!');
    console.log('\nSolution: Delete the duplicate user with the wrong password.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
