require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function main() {
  try {
    const rawUrl = process.env.DATABASE_URL ?? '';
    if (!rawUrl) {
      throw new Error('DATABASE_URL is missing. Add it to backend/.env before starting the server.');
    }

    const parsed = new URL(rawUrl);
    const adapterUrl = rawUrl.replace(/^mysql:\/\//, 'mariadb://');
    const adapter = new PrismaMariaDb(adapterUrl);
    const prisma = new PrismaClient({ adapter });

    // Update test users to admin role
    const result = await prisma.user.updateMany({
      where: { username: { in: ['admintest', 'editortest', 'publishertest'] } },
      data: { role: 'admin' }
    });
    console.log('Updated:', result.count, 'users');

    // Verify the updates
    const users = await prisma.user.findMany({
      where: { username: { in: ['admintest', 'editortest', 'publishertest'] } },
      select: { id: true, email: true, username: true, role: true, status: true }
    });
    console.log(JSON.stringify(users, null, 2));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
