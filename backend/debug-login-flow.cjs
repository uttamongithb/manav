require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

async function main() {
  console.log('\n🔍 COMPLETE SUPERADMIN LOGIN FLOW DEBUG\n');
  console.log('=' .repeat(70));

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('❌ DATABASE_URL is missing');
    return;
  }

  const parsed = new URL(rawUrl);
  if (!parsed.searchParams.has('connection_limit')) parsed.searchParams.set('connection_limit', '1');
  if (!parsed.searchParams.has('pool_timeout')) parsed.searchParams.set('pool_timeout', '30');
  if (!parsed.searchParams.has('connectTimeout')) parsed.searchParams.set('connectTimeout', '15000');
  if (!parsed.searchParams.has('socketTimeout')) parsed.searchParams.set('socketTimeout', '30000');

  const databaseUrl = parsed.toString();
  const adapterUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) });

  try {
    const testEmail = 'superadmin@INSAAN.local';
    const testPassword = 'SuperAdmin@12345';

    console.log('\n📋 TEST CREDENTIALS:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);

    // Step 1: Check if user exists in database
    console.log('STEP 1: Searching for user in database...');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: testEmail },
          { username: 'INSAAN_superadmin' },
        ],
      },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND IN DATABASE');
      console.log('\n   ACTION: Creating superadmin user...\n');
      
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          username: 'INSAAN_superadmin',
          displayName: 'INSAAN SuperAdmin',
          passwordHash,
          role: 'superadmin',
          status: 'active',
          isVerified: true,
          emailVerified: true,
        },
      });

      console.log(`✅ User created with ID: ${newUser.id}`);
    } else {
      console.log(`✅ User found in database`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password Hash: ${!!user.passwordHash}`);
    }

    // Step 2: Simulate login flow
    console.log('\n\nSTEP 2: Simulating login flow...');
    
    const loginUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: testEmail },
          { username: testEmail },
        ],
      },
    });

    if (!loginUser) {
      console.log('❌ [FATAL] User not found during login');
      return;
    }
    console.log('✅ [1] User found');

    // Step 3: Check user status
    console.log('\n\nSTEP 3: Validating user status...');
    const normalizedStatus = loginUser.status?.toLowerCase?.() ?? '';
    console.log(`   Status: ${loginUser.status}`);
    console.log(`   Normalized: ${normalizedStatus}`);
    
    if (normalizedStatus !== 'active') {
      console.log(`❌ [FATAL] Account is not active: ${normalizedStatus}`);
      return;
    }
    console.log('✅ [2] Status is active');

    // Step 4: Compare password
    console.log('\n\nSTEP 4: Password comparison...');
    console.log(`   Input password: ${testPassword}`);
    console.log(`   Stored hash exists: ${!!loginUser.passwordHash}`);
    
    if (!loginUser.passwordHash) {
      console.log('❌ [FATAL] No password hash stored');
      return;
    }

    const isPasswordValid = await bcrypt.compare(testPassword, loginUser.passwordHash);
    console.log(`   bcrypt.compare result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log('❌ [FATAL] Password does not match');
      return;
    }
    console.log('✅ [3] Password valid');

    // Step 5: Generate token
    console.log('\n\nSTEP 5: Token generation...');
    const tokenPayload = {
      sub: loginUser.id,
      email: loginUser.email,
      username: loginUser.username,
      displayName: loginUser.displayName,
      role: loginUser.role,
    };
    console.log('   Token payload:');
    console.log(JSON.stringify(tokenPayload, null, 2));
    console.log('✅ [4] Token payload ready');

    // Step 6: Final response
    console.log('\n\nSTEP 6: Login response...');
    const loginResponse = {
      id: loginUser.id,
      email: loginUser.email,
      username: loginUser.username,
      displayName: loginUser.displayName,
      role: loginUser.role,
      avatarUrl: loginUser.avatarUrl,
      token: 'JWT_TOKEN_HERE',
    };
    console.log('✅ [5] Response ready:');
    console.log(JSON.stringify(loginResponse, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('✅ LOGIN FLOW SUCCESSFUL!');
    console.log('\n🎯 You can now login with:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error(error.message);
    if (error.meta) {
      console.error('Database Error:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
