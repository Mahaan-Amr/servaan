const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'hiddenitch1739',
    database: 'postgres' // Connect to default db to drop servaan
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL');
    
    // Terminate all connections to servaan database
    console.log('\n📍 Terminating existing connections...');
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'servaan'
      AND pid <> pg_backend_pid();
    `);
    console.log('   ✓ Connections terminated');
    
    // Drop the database
    console.log('📍 Dropping servaan database...');
    await client.query('DROP DATABASE IF EXISTS servaan');
    console.log('   ✓ Database dropped');
    
    // Create new database
    console.log('📍 Creating new servaan database...');
    await client.query('CREATE DATABASE servaan');
    console.log('   ✓ Database created');
    
    console.log('\n✅ Database reset complete!');
    console.log('Now run: npm run prisma:migrate or npm run prisma:push');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetDatabase();
