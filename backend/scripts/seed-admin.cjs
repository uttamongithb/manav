require('dotenv/config');

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function main() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const parsed = new URL(rawUrl);

  if (!parsed.searchParams.has('connection_limit')) parsed.searchParams.set('connection_limit', '1');
  if (!parsed.searchParams.has('pool_timeout')) parsed.searchParams.set('pool_timeout', '30');
  if (!parsed.searchParams.has('connectTimeout')) parsed.searchParams.set('connectTimeout', '15000');
  if (!parsed.searchParams.has('socketTimeout')) parsed.searchParams.set('socketTimeout', '30000');

  const databaseUrl = parsed.toString();
  const adapterUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) });

  const email = 'admin@manav.local';
  const username = 'manav_admin';
  const password = 'Admin@12345';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      displayName: 'Manav Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      isVerified: true,
      emailVerified: true,
    },
    create: {
      email,
      username,
      displayName: 'Manav Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      isVerified: true,
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  console.log(JSON.stringify({ user, credentials: { email, password } }, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});