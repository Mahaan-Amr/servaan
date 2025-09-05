#!/usr/bin/env node
/**
 * Local Development Database Setup Script
 * This script sets up the local development database for Servaan
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local development environment...\n');

// Check if PostgreSQL is running
try {
  execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
  console.log('✅ PostgreSQL is running on localhost:5432');
} catch (error) {
  console.error('❌ PostgreSQL is not running. Please start PostgreSQL service.');
  console.error('   On Windows: Start PostgreSQL service from Services');
  console.error('   On macOS: brew services start postgresql');
  console.error('   On Linux: sudo systemctl start postgresql');
  process.exit(1);
}

// Check if the servaan database exists
try {
  console.log('📦 Checking existing database...');
  execSync('psql -h localhost -p 5432 -U postgres -d servaan -c "SELECT 1;"', { stdio: 'pipe' });
  console.log('✅ Database "servaan" exists and is accessible');
} catch (error) {
  console.error('❌ Database "servaan" is not accessible. Please check your database configuration.');
  console.error('   Make sure the database exists and credentials are correct in .env file');
  process.exit(1);
}

// Run Prisma migrations
try {
  console.log('🔄 Running Prisma migrations...');
  process.chdir(path.join(__dirname, '..', 'src', 'prisma'));
  execSync('npx prisma migrate dev --name local-dev-setup', { stdio: 'inherit' });
  console.log('✅ Prisma migrations completed');
} catch (error) {
  console.log('ℹ️  Prisma migration failed or already up to date:', error.message);
}

// Generate Prisma client
try {
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Prisma client generation failed:', error.message);
  process.exit(1);
}

// Install dependencies for all services
try {
  console.log('📦 Installing dependencies...');
  process.chdir(path.join(__dirname, '..'));
  execSync('npm run install:all', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Local development environment setup completed!');
console.log('\n📋 Available commands:');
console.log('   • npm run dev:main     - Start main app (frontend + backend)');
console.log('   • npm run dev:admin    - Start admin panel (frontend + backend)');
console.log('   • npm run dev          - Start all services');
console.log('   • npm run prisma:studio - Open Prisma Studio');
console.log('\n🌐 URLs:');
console.log('   • Main App: http://localhost:3000');
console.log('   • Admin Panel: http://localhost:3004');
console.log('   • Main API: http://localhost:3001/api');
console.log('   • Admin API: http://localhost:3003/api');
console.log('\n🔑 Admin Login Credentials:');
console.log('   • Email: admin@servaan.com');
console.log('   • Password: AdminSecure2024!');