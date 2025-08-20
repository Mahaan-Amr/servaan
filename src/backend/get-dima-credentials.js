require('dotenv').config({ path: './.env' });
const { PrismaClient } = require("../shared/generated/client");

const prisma = new PrismaClient();

/**
 * Get Dima Cafe Credentials
 * Retrieves login credentials for the Dima cafe tenant
 */
async function getDimaCredentials() {
  console.log('🔍 Searching for Dima cafe credentials...\n');

  try {
    // Find the Dima tenant
    const dimaTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'dima', mode: 'insensitive' } },
          { name: { contains: 'دبما', mode: 'insensitive' } },
          { subdomain: { contains: 'dima', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!dimaTenant) {
      console.log('❌ Dima cafe tenant not found');
      return;
    }

    console.log(`✅ Found Dima tenant: ${dimaTenant.name} (${dimaTenant.subdomain})`);
    console.log(`   Tenant ID: ${dimaTenant.id}`);
    console.log(`   Status: ${dimaTenant.isActive ? 'Active' : 'Inactive'}\n`);

    // Find users associated with this tenant
    const users = await prisma.user.findMany({
      where: {
        tenantId: dimaTenant.id,
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found for Dima tenant');
      return;
    }

    console.log(`📋 Found ${users.length} user(s) for Dima tenant:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.active ? 'Active' : 'Inactive'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
    });

    // Check if there are any admin users
    const adminUsers = users.filter(user => user.role === 'ADMIN' || user.role === 'OWNER');
    
    if (adminUsers.length > 0) {
      console.log('🎯 RECOMMENDED LOGIN CREDENTIALS:');
      console.log('   Use one of these admin accounts for full access:\n');
      
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Name: ${user.name}\n`);
      });
    } else {
      console.log('⚠️  No admin users found. You may need to create one.');
    }

    // Check if there are any users with common passwords
    console.log('💡 LOGIN INSTRUCTIONS:');
    console.log('   1. Go to: https://dima.servaan.ir (or your domain)');
    console.log('   2. Use one of the email addresses above');
    console.log('   3. If you forgot the password, you can reset it or check the mega-seed.js file');
    console.log('   4. Default passwords are usually: "123456" or "password123"');
    console.log('   5. For admin access, use an account with ADMIN or OWNER role\n');

    // Check if we can find any password hints in the database
    console.log('🔐 PASSWORD HINTS:');
    console.log('   - Check the mega-seed.js file for default passwords');
    console.log('   - Common default passwords: "123456", "password123", "admin123"');
    console.log('   - If none work, you may need to reset the password via database\n');

  } catch (error) {
    console.error('❌ Error retrieving Dima credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getDimaCredentials();
