// Test if bcrypt and bcryptjs are compatible
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

async function testCompatibility() {
  console.log('🔬 Testing bcrypt vs bcryptjs compatibility\n');
  
  const password = 'manager123';
  
  // Hash with bcrypt (what seed uses)
  console.log('1️⃣  Hashing with bcrypt package:');
  const bcryptHash = await bcrypt.hash(password, 10);
  console.log('   Hash:', bcryptHash);
  
  // Try to verify with bcryptjs (what backend uses)
  console.log('\n2️⃣  Verifying with bcryptjs.compare():');
  const bcryptjsVerify = await bcryptjs.compare(password, bcryptHash);
  console.log('   Result:', bcryptjsVerify ? '✅ MATCH' : '❌ NO MATCH');
  
  // Hash with bcryptjs
  console.log('\n3️⃣  Hashing with bcryptjs package:');
  const bcryptjsHash = await bcryptjs.hash(password, 10);
  console.log('   Hash:', bcryptjsHash);
  
  // Verify with bcrypt
  console.log('\n4️⃣  Verifying with bcrypt.compare():');
  const bcryptVerify = await bcrypt.compare(password, bcryptjsHash);
  console.log('   Result:', bcryptVerify ? '✅ MATCH' : '❌ NO MATCH');
  
  console.log('\n' + '='.repeat(50));
  if (!bcryptjsVerify) {
    console.log('❌ INCOMPATIBILITY FOUND!');
    console.log('Hashes created with bcrypt cannot be verified with bcryptjs!');
  } else {
    console.log('✅ Packages ARE compatible');
  }
}

testCompatibility().catch(console.error);
