require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const rawUrl = process.env.DATABASE_URL ?? '';
if (!rawUrl) {
  throw new Error('DATABASE_URL is missing. Add it to backend/.env before running the seed.');
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

const prisma = new PrismaClient({ adapter });

const sections = [
  {
    key: 'news',
    label: 'News',
    cards: [
      {
        slug: 'ui-seed-news-city-library-revival',
        title: 'City Library Revival Draws Record Readers',
        excerpt: 'A local reading campaign has doubled weekly visitors and sparked community programs.',
        content:
          'The city public library has seen a remarkable rise in participation after launching its year-long reading revival program.\n\nWorkshops, children sessions, and open-mic literary evenings are now running every weekend.\n\nOrganizers say the goal is simple: make reading social, accessible, and fun for all age groups.',
        cover:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-news-evening-mushaira-festival',
        title: 'Evening Mushaira Festival Expands to New Venues',
        excerpt: 'Poetry nights now include three additional neighborhoods after high audience demand.',
        content:
          'After packed attendance in the central auditorium, the annual evening mushaira series is expanding to multiple neighborhoods.\n\nThe expanded format includes youth poetry circles and bilingual hosting to welcome new audiences.\n\nCultural coordinators expect this season to be the most inclusive edition so far.',
        cover:
          'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'literature',
    label: 'Literature',
    cards: [
      {
        slug: 'ui-seed-literature-translation-dialogues',
        title: 'Translation Dialogues: Bridging Classical and Modern Voices',
        excerpt: 'Editors discuss how translation can carry rhythm, metaphor, and emotional precision.',
        content:
          'A new literature circle is hosting monthly translation dialogues focused on preserving tone and cadence across languages.\n\nParticipants compare multiple translations of the same poem to understand nuance and voice.\n\nThe sessions are designed for both advanced readers and newcomers.',
        cover:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-literature-reading-club-annotations',
        title: 'Reading Club Introduces Shared Annotation Sessions',
        excerpt: 'Members now annotate selected texts together to unpack imagery and narrative technique.',
        content:
          'The weekly reading club has introduced shared annotation evenings where members collaboratively read, highlight, and discuss selected passages.\n\nThe format encourages deeper engagement with symbolism and structure.\n\nOrganizers report that these sessions are improving both participation and confidence among younger readers.',
        cover:
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'activities',
    label: 'Activities',
    cards: [
      {
        slug: 'ui-seed-activities-weekend-open-mic',
        title: 'Weekend Open-Mic Sessions Attract New Performers',
        excerpt: 'Community stages now feature spoken word, ghazal recitation, and short prose sets.',
        content:
          'The weekend open-mic program has quickly become a launchpad for emerging performers.\n\nEach session includes guided feedback from senior mentors and peer groups.\n\nThe format keeps the stage friendly while maintaining high quality performances.',
        cover:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-activities-writing-sprint-lab',
        title: 'Writing Sprint Lab Helps Authors Finish Drafts Faster',
        excerpt: 'Timed co-writing blocks and mentor checkpoints improve completion rates for new authors.',
        content:
          'A collaborative writing sprint lab is helping participants complete first drafts through focused 25-minute writing blocks.\n\nMentors provide clarity prompts, revision advice, and pacing techniques.\n\nParticipants can convert their best pieces into public submissions after review.',
        cover:
          'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'special_report',
    label: 'Special Report',
    cards: [
      {
        slug: 'ui-seed-special-report-oral-histories',
        title: 'Special Report: Preserving Oral Histories Through Poetry',
        excerpt: 'Researchers and poets collaborate to archive local oral traditions in digital form.',
        content:
          'This special report examines how oral narratives are being preserved using poetry, interviews, and digital curation.\n\nField teams are recording regional voices and pairing them with contextual essays.\n\nThe project highlights memory, identity, and cultural continuity in changing urban spaces.',
        cover:
          'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-special-report-language-shift',
        title: 'Special Report: Language Shift in Contemporary Youth Writing',
        excerpt: 'A field study tracks hybrid vocabulary trends across spoken-word and social media poetry.',
        content:
          'Writers today often blend languages to build flexible, expressive voices.\n\nThis report maps how hybrid vocabulary appears across spoken-word sets, captions, and long-form writing.\n\nEducators suggest this trend is expanding access without reducing literary depth.',
        cover:
          'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'health',
    label: 'Health',
    cards: [
      {
        slug: 'ui-seed-health-reading-for-wellbeing',
        title: 'Reading for Wellbeing: Quiet Minutes, Better Focus',
        excerpt: 'Daily reading routines are being used as low-cost mental wellness support tools.',
        content:
          'Health educators are promoting short, regular reading rituals to reduce mental fatigue and improve attention span.\n\nParticipants in a six-week pilot reported better focus and calmer daily routines.\n\nThe program combines journaling prompts with reflective reading sessions.',
        cover:
          'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-health-community-listening-circles',
        title: 'Community Listening Circles Support Emotional Health',
        excerpt: 'Group reading and listening circles create safe spaces for empathy and reflection.',
        content:
          'Community listening circles are using poetry and short narratives to support emotional conversations.\n\nFacilitators emphasize non-judgmental listening and shared reflection.\n\nThe model is now being adapted by schools and local youth groups.',
        cover:
          'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'interesting',
    label: 'Interesting',
    cards: [
      {
        slug: 'ui-seed-interesting-hidden-archives',
        title: 'Hidden Archives: Forgotten Margins in Old Manuscripts',
        excerpt: 'Researchers discover reader notes that reveal social history behind classic texts.',
        content:
          'A restoration project has uncovered handwritten margin notes in rare manuscripts, revealing personal reflections from earlier readers.\n\nThese notes provide historical clues about culture, education, and everyday life.\n\nCurators say the findings open new ways to interpret familiar works.',
        cover:
          'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-interesting-poetry-map-project',
        title: 'Interactive Poetry Map Connects Place and Memory',
        excerpt: 'A new digital map links poems to neighborhoods, landmarks, and local memories.',
        content:
          'The interactive poetry map project lets readers explore writing tied to specific places in the city.\n\nEach point combines text, audio, and local context contributed by residents.\n\nEarly users say it feels like walking through a living literary archive.',
        cover:
          'https://images.unsplash.com/photo-1502920917128-1aa500764b6f?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'sport',
    label: 'Sport',
    cards: [
      {
        slug: 'ui-seed-sport-stadium-poetry-night',
        title: 'Stadium Poetry Night Blends Sports and Storytelling',
        excerpt: 'Fans and poets share match-day memories through spoken performances.',
        content:
          'A unique stadium event brought together sports fans and spoken-word artists in a celebration of memory, rivalry, and collective emotion.\n\nPerformers used poetry to retell iconic match moments from personal perspectives.\n\nOrganizers plan to make it a monthly city event.',
        cover:
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-sport-youth-commentary-workshop',
        title: 'Youth Commentary Workshop Builds Voice and Confidence',
        excerpt: 'Students learn live commentary techniques and narrative rhythm from professionals.',
        content:
          'A youth workshop on sports commentary is helping students practice clear speech, pacing, and narrative structure.\n\nMentors guide participants through voice warmups and live simulation drills.\n\nThe program combines communication skills with creative storytelling.',
        cover:
          'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    cards: [
      {
        slug: 'ui-seed-entertainment-ghazal-night-series',
        title: 'Ghazal Night Series Returns with Contemporary Arrangements',
        excerpt: 'Classic verses are reimagined with modern instrumentation and live visuals.',
        content:
          'The ghazal night series has returned with an experimental format that pairs classic lyrics with contemporary arrangements.\n\nVisual artists and musicians collaborate in real-time to create immersive performances.\n\nAudience turnout suggests strong demand for cross-genre literary entertainment.',
        cover:
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1400&q=80',
      },
      {
        slug: 'ui-seed-entertainment-storytelling-stage',
        title: 'Storytelling Stage Spotlights New Digital Creators',
        excerpt: 'Short-form performers adapt literary scenes for live and online audiences.',
        content:
          'A new storytelling stage is featuring digital creators who adapt literary scenes into short live sets.\n\nThe format blends theatre, spoken word, and audience interaction.\n\nCurators say this bridge between digital and live performance is expanding literary reach.',
        cover:
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
];

async function run() {
  const seedUser = await prisma.user.upsert({
    where: { email: 'ui.seed@insaan.local' },
    update: {
      displayName: 'UI Seed Author',
      status: 'active',
      role: 'admin',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    },
    create: {
      email: 'ui.seed@insaan.local',
      username: 'ui_seed_author',
      displayName: 'UI Seed Author',
      role: 'admin',
      status: 'active',
      passwordHash: '$2b$10$Y6A6GQX0m2n2OH9M9S9I7uR7w2Wl4n7Y2nO8x0x6k4n2fQ9mQm8lm',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    },
  });

  let created = 0;
  let updated = 0;

  for (const section of sections) {
    for (const card of section.cards) {
      const existing = await prisma.article.findFirst({
        where: {
          section: section.key,
          slug: card.slug,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.article.update({
          where: { id: existing.id },
          data: {
            title: card.title,
            excerpt: card.excerpt,
            content: card.content,
            coverImageUrl: card.cover,
            status: 'published',
            publishedAt: new Date(),
            deletedAt: null,
            authorId: seedUser.id,
            tenantId: 'public-tenant',
            isPinned: false,
          },
        });
        updated += 1;
      } else {
        await prisma.article.create({
          data: {
            title: card.title,
            slug: card.slug,
            excerpt: card.excerpt,
            content: card.content,
            coverImageUrl: card.cover,
            section: section.key,
            status: 'published',
            publishedAt: new Date(),
            authorId: seedUser.id,
            tenantId: 'public-tenant',
            likeCount: BigInt(Math.floor(Math.random() * 80) + 3),
            viewCount: BigInt(Math.floor(Math.random() * 400) + 25),
          },
        });
        created += 1;
      }
    }
  }

  const stats = await prisma.article.groupBy({
    by: ['section'],
    where: { deletedAt: null, status: 'published' },
    _count: { _all: true },
  });

  console.log('Seed complete');
  console.log(`User: ${seedUser.email}`);
  console.log(`Created: ${created}, Updated: ${updated}`);
  console.log('Published article counts by section:');
  for (const s of stats) {
    console.log(`- ${s.section}: ${s._count._all}`);
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
