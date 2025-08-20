const { Client } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function createTestDatabase() {
  console.log('🗄️ Creating test database...');
  
  // Connect to postgres database to create the test database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'hiddenitch1739',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if test database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'servaan_test'"
    );

    if (result.rows.length === 0) {
      // Create test database
      await client.query('CREATE DATABASE servaan_test');
      console.log('✅ Test database "servaan_test" created successfully');
    } else {
      console.log('ℹ️ Test database "servaan_test" already exists');
    }

  } catch (error) {
    console.error('❌ Error creating test database:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔧 Authentication failed. Please check:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. Username and password are correct');
      console.error('  3. PostgreSQL is accepting connections on localhost:5432');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestDatabase(); 