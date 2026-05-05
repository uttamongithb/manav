require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const rawUrl = process.env.DATABASE_URL;
const adapterUrl = rawUrl.replace(/^mysql:\/\//, 'mariadb://');
const adapter = new PrismaMariaDb(adapterUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Checking testuser1 in database...');
    const user = await prisma.user.findUnique({
      where: { username: 'testuser1' },
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        role: true, 
        status: true, 
        isVerified: true, 
        createdAt: true 
      }
    });
    
    console.log('testuser1 database record:');
    console.log(JSON.stringify(user, null, 2));
    
    if (user) {
      console.log('\n✅ Database Verification Results:');
      console.log(`   Role: ${user.role} (expected: admin)`);
      console.log(`   Status: ${user.status} (expected: suspended)`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log(`   Username: ${user.username}`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
