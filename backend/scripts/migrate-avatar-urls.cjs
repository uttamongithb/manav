require('dotenv/config');

const { readFile, rm, readdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { join, basename, resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? '';
  if (!rawUrl) {
    throw new Error('DATABASE_URL is missing. Add it to backend/.env before running the avatar migration.');
  }

  const parsed = new URL(rawUrl);
  if (!parsed.searchParams.has('connection_limit')) {
    parsed.searchParams.set('connection_limit', '1');
  }
  if (!parsed.searchParams.has('pool_timeout')) {
    parsed.searchParams.set('pool_timeout', '30');
  }
  if (!parsed.searchParams.has('connectTimeout')) {
    parsed.searchParams.set('connectTimeout', '15000');
  }
  if (!parsed.searchParams.has('socketTimeout')) {
    parsed.searchParams.set('socketTimeout', '30000');
  }

  const databaseUrl = parsed.toString();
  const adapterUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
  const adapter = new PrismaMariaDb(adapterUrl);

  return new PrismaClient({ adapter });
}

function resolveUploadsPath() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'uploads');
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

function isLocalUploadsUrl(value) {
  return typeof value === 'string' && /(?:^|\/)(?:uploads\/[^\s?#]+)$/i.test(value);
}

function extractUploadsFilename(value) {
  if (typeof value !== 'string') return null;

  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value);
      const uploadsIndex = parsed.pathname.indexOf('/uploads/');
      if (uploadsIndex === -1) return null;
      return basename(parsed.pathname.slice(uploadsIndex + '/uploads/'.length));
    }
  } catch {
    // fall through to pathname parsing
  }

  const match = value.match(/(?:^|\/)(?:uploads\/)([^\s?#/]+)$/i);
  return match ? match[1] : null;
}

function buildDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function mimeFromFilename(filename) {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

async function loadAvatarData(uploadsRoot, filename) {
  const filePath = join(uploadsRoot, filename);
  const buffer = await readFile(filePath);
  return buildDataUrl(buffer, mimeFromFilename(filename));
}

async function collectLegacyAvatarFiles(uploadsRoot) {
  if (!existsSync(uploadsRoot)) {
    return new Set();
  }

  const entries = await readdir(uploadsRoot, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith('avatar-'))
      .map((entry) => entry.name),
  );
}

async function migrateTableRecords(prisma, uploadsRoot, tableName) {
  const model = tableName === 'userProfile' ? prisma.userProfile : prisma.user;
  const rows = await model.findMany({
    select: {
      ...(tableName === 'userProfile'
        ? { userId: true, avatarUrl: true }
        : { id: true, avatarUrl: true }),
    },
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const currentUrl = row.avatarUrl;
    if (!currentUrl || isDataUrl(currentUrl) || !isLocalUploadsUrl(currentUrl)) {
      skippedCount += 1;
      continue;
    }

    const filename = extractUploadsFilename(currentUrl);
    if (!filename) {
      skippedCount += 1;
      continue;
    }

    const filePath = join(uploadsRoot, filename);
    if (!existsSync(filePath)) {
      skippedCount += 1;
      continue;
    }

    const dataUrl = await loadAvatarData(uploadsRoot, filename);

    if (tableName === 'userProfile') {
      await prisma.userProfile.update({
        where: { userId: row.userId },
        data: { avatarUrl: dataUrl },
      });
    } else {
      await prisma.user.update({
        where: { id: row.id },
        data: { avatarUrl: dataUrl },
      });
    }

    updatedCount += 1;
  }

  return { updatedCount, skippedCount };
}

async function cleanupMigratedFiles(uploadsRoot, filenames) {
  for (const filename of filenames) {
    const filePath = join(uploadsRoot, filename);
    if (existsSync(filePath)) {
      await rm(filePath);
    }
  }
}

async function main() {
  const prisma = createPrismaClient();
  const uploadsRoot = resolveUploadsPath();
  const legacyFiles = await collectLegacyAvatarFiles(uploadsRoot);

  try {
    const profileResult = await migrateTableRecords(prisma, uploadsRoot, 'userProfile');
    const userResult = await migrateTableRecords(prisma, uploadsRoot, 'user');

    await cleanupMigratedFiles(uploadsRoot, legacyFiles);

    console.log(
      JSON.stringify(
        {
          uploadsRoot: resolve(uploadsRoot),
          migratedProfiles: profileResult.updatedCount,
          migratedUsers: userResult.updatedCount,
          skippedProfiles: profileResult.skippedCount,
          skippedUsers: userResult.skippedCount,
          removedLegacyFiles: legacyFiles.size,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Avatar migration failed:', error);
  process.exit(1);
});
