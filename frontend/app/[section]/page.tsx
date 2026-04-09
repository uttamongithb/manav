"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/context/theme";
import { SiteNavbar } from "@/app/components/site-navbar";

type UserPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: "public";
  createdAt: string;
};

type SectionConfig = {
  title: string;
  subtitle: string;
  tone: string;
};

const createSectionImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/520`;

const SECTION_QUICK_TAGS: Record<string, string[]> = {
  sher: ["Classic", "Love", "Life", "Wisdom", "Modern"],
  dictionary: ["Meaning", "Usage", "Word Roots", "Synonyms", "Examples"],
  videos: ["Recitation", "Interviews", "Performances", "Lectures", "Shorts"],
  "e-books": ["Classics", "New Releases", "Collections", "Read Online", "Popular"],
  prose: ["Essays", "Memoir", "Commentary", "Reflections", "Narratives"],
  blog: ["Editorial", "Culture", "Interviews", "Reviews", "Updates"],
  shayari: ["Romance", "Motivation", "Sad", "Festival", "Trending"],
  quiz: ["Beginner", "Advanced", "Poets", "Vocabulary", "Timed"],
  more: ["Collections", "Featured", "Tools", "Community", "Archive"],
  poets: ["Classical", "Modern", "Women", "Contemporary", "Featured"],
};

const SECTION_JOURNEY_COPY: Record<string, string> = {
  sher: "Start from timeless couplets, move to modern voices, and explore compact lines that carry emotional depth.",
  dictionary: "Begin with core meanings, then usage context, and finally discover related literary terms and nuances.",
  videos: "Watch classic recitations first, then interviews and performances to experience poetry in voice and presence.",
  "e-books": "Browse foundational texts, continue with curated collections, and then explore contemporary long-form works.",
  prose: "Read short reflective prose first, then essays and narratives to follow thought, tone, and storytelling style.",
  blog: "Start with featured editorials, then interviews, and finally cultural commentary to follow current conversations.",
  shayari: "Explore mood-based shayari, then thematic collections, and continue with trending lines from contemporary writers.",
  quiz: "Begin with easy rounds, move to poet-focused questions, and then test advanced literary recall with timed sets.",
  more: "Use featured collections as a start, then move through tools, archives, and community picks for deeper discovery.",
  poets: "Start from classical masters, move to modern voices, and then read contemporary poets to trace evolution in form.",
};

const SECTION_MAP: Record<string, SectionConfig> = {
  poets: {
    title: "Poets",
    subtitle: "Explore voices, biographies, and poetic expression from classic and modern authors.",
    tone: "Curated poet highlights and notable writings.",
  },
  sher: {
    title: "Sher",
    subtitle: "Read impactful couplets and concise poetic fragments that stay with the reader.",
    tone: "A quick collection of memorable lines.",
  },
  dictionary: {
    title: "Dictionary",
    subtitle: "Discover meanings, usage context, and literary language references.",
    tone: "Language-first discovery and interpretation.",
  },
  videos: {
    title: "Videos",
    subtitle: "Watch recitations, performances, and literary storytelling content.",
    tone: "Visual and spoken literary experiences.",
  },
  "e-books": {
    title: "E-Books",
    subtitle: "Browse digital books and long-form reading across genres.",
    tone: "Extended reading and archival content.",
  },
  prose: {
    title: "Prose",
    subtitle: "Read essays, reflections, and narrative prose from diverse writers.",
    tone: "Thoughtful long-form writing.",
  },
  blog: {
    title: "Blog",
    subtitle: "Editorial stories, interviews, and cultural commentary from the community.",
    tone: "Current literary conversations.",
  },
  shayari: {
    title: "Shayari",
    subtitle: "Enjoy thematic poetry collections and expressive verse.",
    tone: "Emotion-rich poetic selections.",
  },
  quiz: {
    title: "Quiz",
    subtitle: "Test your literary knowledge with bite-sized quiz formats.",
    tone: "Interactive learning for literature lovers.",
  },
  more: {
    title: "More",
    subtitle: "Access additional categories, tools, and platform experiences.",
    tone: "Everything beyond the core sections.",
  },
};

export default function SectionPage() {
  const params = useParams<{ section: string }>();
  const sectionSlug = String(params?.section ?? "").toLowerCase();
  const section = SECTION_MAP[sectionSlug];

  const { isDark, setIsDark } = useTheme();
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const backendUrl = "http://localhost:3001";

  useEffect(() => {
    if (!section) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        setApiError(null);
        setIsLoading(true);

        const endpoint = sectionSlug === "more"
          ? `${backendUrl}/posts/public`
          : `${backendUrl}/posts?section=${encodeURIComponent(section.title.toUpperCase())}`;

        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error("failed_response");
        }

        const data = (await res.json()) as UserPost[];
        setPosts(data);
      } catch {
        setPosts([]);
        setApiError("Unable to load this section. Ensure backend is running on port 3001.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [section, sectionSlug]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return posts;

    return posts.filter((post) =>
      [post.author, post.content, post.section].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [posts, query]);

  const featuredPost = filteredPosts[0] ?? null;
  const quickTags = SECTION_QUICK_TAGS[sectionSlug] ?? ["Featured", "Trending", "Latest", "Popular", "Archive"];

  if (!section) {
    return (
      <main className="min-h-screen bg-[#edf3e6] px-4 py-10 text-[#182218]">
        <div className="mx-auto max-w-240 rounded-2xl border border-black/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold">Section not found</h1>
          <p className="mt-2 text-sm text-[#657a66]">This page does not exist in the menu.</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-[#2ce88f] px-5 py-2 text-sm font-semibold text-[#0b1112]"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative isolate min-h-screen overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>

      <div className="relative z-10">
      <SiteNavbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        activeHref={`/${sectionSlug}`}
      />

      <div className="mx-auto w-[80vw] max-w-none px-1 py-6 md:py-10">
        <section
          className={`mb-6 rounded-[26px] border p-5 md:mb-7 md:p-6 ${
            isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"
          }`}
        >
          <div className="grid gap-5 md:grid-cols-[1.25fr_0.75fr] md:items-end">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/55" : "text-[#617860]"}`}>
                Search {section.title}
              </p>
              <div className={`mt-3 flex items-center gap-2 rounded-full border px-4 py-2.5 ${isDark ? "border-white/20 bg-[#101318]" : "border-black/10 bg-[#f4f8f0]"}`}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${isDark ? "text-white/45" : "text-[#738671]"}`} fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.2-3.2" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search in ${section.title}`}
                  className={`w-full bg-transparent text-[14px] outline-none ${isDark ? "placeholder:text-white/35" : "placeholder:text-[#7e907d]"}`}
                />
              </div>
              <p className={`mt-3 text-[12px] ${isDark ? "text-white/55" : "text-[#6a7f68]"}`}>
                Showing {filteredPosts.length} entries
              </p>
            </div>

            <div className={`md:border-l md:pl-5 ${isDark ? "md:border-white/12" : "md:border-black/10"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-[#b8f7d8]" : "text-[#0b7a52]"}`}>
                {section.title} Journey
              </p>
              <p className={`mt-2 text-[14px] leading-relaxed ${isDark ? "text-white/85" : "text-[#2b4a3f]"}`}>
                {SECTION_JOURNEY_COPY[sectionSlug] ?? `Discover ${section.title} through curated highlights, focused exploration, and easy navigation.`}
              </p>
              <Link
                href="/"
                className={`mt-4 inline-flex rounded-full border px-4 py-2 text-[12px] font-bold tracking-[0.08em] transition ${
                  isDark
                    ? "border-[#2ce88f]/45 bg-[#2ce88f]/15 text-[#9df9cb] hover:bg-[#2ce88f]/25"
                    : "border-[#0a8a5b]/30 bg-[#effaf4] text-[#0a8a5b] hover:bg-[#e3f5eb]"
                }`}
              >
                BACK TO FEED
              </Link>
            </div>
          </div>
        </section>

        <section className={`rounded-[28px] border p-5 md:p-7 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/55" : "text-[#637a63]"}`}>
                {section.title} Archive
              </p>
              <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Explore {section.title},
                <br />
                Voices, and Verse.
              </h1>
              <p className={`mt-2 max-w-180 text-[15px] leading-relaxed ${isDark ? "text-white/72" : "text-[#496048]"}`}>
                {section.subtitle}
              </p>
              <p className={`mt-1 text-[13px] ${isDark ? "text-white/52" : "text-[#657a66]"}`}>{section.tone}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition ${
                      isDark
                        ? "border-white/18 bg-[#1f2229] text-white/80 hover:bg-[#2a2f39]"
                        : "border-black/10 bg-[#f4f8f0] text-[#3a523a] hover:bg-[#e9f2e6]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <aside className={`rounded-2xl border p-4 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-[#f9fbf7]"}`}>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <img
                  src={createSectionImage(`${sectionSlug}-featured`) }
                  alt={`${section.title} featured poster`}
                  className="h-44 w-full object-cover"
                />
              </div>
              <p className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] ${isDark ? "text-white/55" : "text-[#637a63]"}`}>
                Featured {section.title}
              </p>
              {featuredPost ? (
                <>
                  <p className={`mt-2 text-[15px] leading-7 ${isDark ? "text-white/88" : "text-[#2b3f2b]"}`}>
                    {featuredPost.content.length > 140
                      ? `${featuredPost.content.slice(0, 140).trim()}...`
                      : featuredPost.content}
                  </p>
                  <p className={`mt-3 text-[13px] font-semibold ${isDark ? "text-white/84" : "text-[#223822]"}`}>{featuredPost.author}</p>
                </>
              ) : (
                <p className={`mt-2 text-[14px] ${isDark ? "text-white/60" : "text-[#607560]"}`}>
                  Add content to show a featured highlight.
                </p>
              )}
            </aside>
          </div>
        </section>

        <div className="mt-5 space-y-3">
          {apiError ? (
            <div className={`rounded-xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
              {apiError}
            </div>
          ) : isLoading ? (
            <div className={`rounded-xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
              Loading {section.title}...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
              No posts found in {section.title}.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={`section-${post.id}`}
                className={`rounded-2xl border p-5 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white"}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold ${isDark ? "bg-white/10 text-white" : "bg-[#edf4ea] text-[#2f4732]"}`}>
                        {post.author.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#202634]"}`}>{post.author}</p>
                        <p className={`text-[12px] ${isDark ? "text-white/45" : "text-[#72866f]"}`}>
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className={`mt-3 text-[15px] leading-relaxed ${isDark ? "text-white/85" : "text-[#304831]"}`}>
                      {post.content}
                    </p>
                  </div>

                  <div className="w-full md:w-56">
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <img
                        src={createSectionImage(`${sectionSlug}-${post.id}`)}
                        alt={`${section.title} poster`}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white/75" : "bg-black/6 text-[#516751]"}`}>
                        {post.section}
                      </span>
                    </div>
                  </div>
                </div>

              </article>
            ))
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
