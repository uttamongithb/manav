require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function main() {
  const rawUrl = process.env.DATABASE_URL;
  const adapterUrl = rawUrl.replace(/^mysql:\/\//, 'mariadb://');
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) });

  try {
    await prisma.user.update({
      where: { username: 'admintest' },
      data: { status: 'suspended' },
    });

    const loginRes = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admintest', password: 'TestPass123!' }),
    });

    console.log('Login status:', loginRes.status);
    console.log('Login body:', await loginRes.text());
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
