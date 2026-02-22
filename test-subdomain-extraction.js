// Test subdomain extraction logic
function extractSubdomain(host) {
  console.log('🔍 Input host:', host);
  
  // Remove port if present
  const hostname = host.split(':')[0];
  console.log('   After removing port:', hostname);
  
  // Split by dots
  const parts = hostname.split('.');
  console.log('   Parts:', parts);
  
  // For localhost development: handle subdomains like dima.localhost
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    console.log('   🏠 Detected localhost/127.0.0.1');
    
    // If we have a subdomain before localhost (e.g., dima.localhost)
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      console.log('   ✅ Found subdomain before localhost:', parts[0]);
      return parts[0]; // Return the subdomain (e.g., 'dima')
    }
    // If it's just localhost without subdomain
    if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
      console.log('   ❌ No subdomain found, just localhost');
      return null; // No subdomain
    }
  }
  
  // For production domains: require at least 3 parts (subdomain.domain.tld)
  if (parts.length < 3) {
    console.log('   ❌ Not enough parts for production domain');
    return null;
  }
  
  // Return first part as subdomain
  console.log('   ✅ Found production subdomain:', parts[0]);
  return parts[0];
}

// Test cases
console.log('Test 1: dima.localhost:3001');
const result1 = extractSubdomain('dima.localhost:3001');
console.log('Result:', result1);
console.log('');

console.log('Test 2: localhost:3001 (no subdomain)');
const result2 = extractSubdomain('localhost:3001');
console.log('Result:', result2);
console.log('');

console.log('Test 3: dima.localhost (no port)');
const result3 = extractSubdomain('dima.localhost');
console.log('Result:', result3);
console.log('');

console.log('Test 4: localhost (no subdomain, no port)');
const result4 = extractSubdomain('localhost');
console.log('Result:', result4);
console.log('');
