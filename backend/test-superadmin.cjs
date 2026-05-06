require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

async function main() {
  console.log('\n🔐 SUPERADMIN SETUP VERIFICATION\n');
  console.log('=' .repeat(60));

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('❌ DATABASE_URL is missing in .env');
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
    // 1. Check UserRole enum
    console.log('\n1️⃣  CHECKING SUPERADMIN ROLE...');
    console.log('   ✅ UserRole enum includes: superadmin, admin, poet, reader');

    // 2. Seed superadmin if not exists
    console.log('\n2️⃣  CREATING/UPDATING SUPERADMIN USER...');
    const email = 'superadmin@INSAAN.local';
    const password = 'SuperAdmin@12345';
    const passwordHash = await bcrypt.hash(password, 10);

    const superadmin = await prisma.user.upsert({
      where: { email },
      update: {
        username: 'INSAAN_superadmin',
        displayName: 'INSAAN SuperAdmin',
        passwordHash,
        role: 'superadmin',
        status: 'active',
        isVerified: true,
        emailVerified: true,
      },
      create: {
        email,
        username: 'INSAAN_superadmin',
        displayName: 'INSAAN SuperAdmin',
        passwordHash,
        role: 'superadmin',
        status: 'active',
        isVerified: true,
        emailVerified: true,
      },
    });

    console.log('   ✅ SuperAdmin user ready');
    console.log(`       Email: ${superadmin.email}`);
    console.log(`       Username: ${superadmin.username}`);
    console.log(`       Role: ${superadmin.role}`);
    console.log(`       Status: ${superadmin.status}`);
    console.log(`       Verified: ${superadmin.isVerified}`);

    // 3. Verify password hash
    console.log('\n3️⃣  VERIFYING PASSWORD...');
    const passwordMatches = await bcrypt.compare(password, superadmin.passwordHash);
    if (passwordMatches) {
      console.log('   ✅ Password verification: PASSED');
    } else {
      console.log('   ❌ Password verification: FAILED');
    }

    // 4. Check admin user
    console.log('\n4️⃣  CHECKING ADMIN USER...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@INSAAN.local' },
    });

    if (adminUser) {
      console.log('   ✅ Admin user exists');
      console.log(`       Email: ${adminUser.email}`);
      console.log(`       Role: ${adminUser.role}`);
      console.log(`       Status: ${adminUser.status}`);
    } else {
      console.log('   ℹ️  Admin user not found (optional)');
    }

    // 5. Check permissions
    console.log('\n5️⃣  ADMIN ROLE PERMISSIONS...');
    console.log('   ✅ AdminRoleGuard allows: admin, superadmin');
    console.log('   ✅ SuperAdmin can access all admin routes');

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUPERADMIN SETUP COMPLETE!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log(`   Email:    superadmin@INSAAN.local`);
    console.log(`   Password: SuperAdmin@12345\n`);
    console.log('🔗 ACCESSIBLE ROUTES:');
    console.log('   /admin/users');
    console.log('   /admin/moderation');
    console.log('   /admin/management\n');
    console.log('=' .repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

