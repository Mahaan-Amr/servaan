// Load test environment variables before tests run
require('dotenv').config({ path: '.env.test' });

// Ensure we're in test environment
process.env.NODE_ENV = 'test'; 