"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/auth";
import { useTheme } from "@/app/context/theme";
import { SiteNavbar } from "@/app/components/site-navbar";
import { getApiBaseUrl } from "@/app/lib/api-base";

type UserPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: "public";
  createdAt: string;
};

const DEFAULT_POSTS: UserPost[] = [];

const QUICK_ACCESS_ITEMS = [
  { label: "POETS", href: "/poets" },
  { label: "SHER", href: "/sher" },
  { label: "DICTIONARY", href: "/dictionary" },
  { label: "VIDEOS", href: "/videos" },
  { label: "E-BOOKS", href: "/e-books" },
  { label: "PROSE", href: "/prose" },
  { label: "BLOG", href: "/blog" },
  { label: "SHAYARI", href: "/shayari" },
  { label: "QUIZ", href: "/quiz" },
  { label: "MORE", href: "/more" },
];

function formatPostDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function postPreview(content: string, max = 180) {
  if (content.length <= max) return content;
  return `${content.slice(0, max).trim()}...`;
}

export default function PublicFeed() {
  const { user } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [allPublicPosts, setAllPublicPosts] = useState<UserPost[]>(DEFAULT_POSTS);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("All");

  const backendUrl = getApiBaseUrl();

  const loadPosts = async () => {
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/posts/public`);

      if (!res.ok) {
        throw new Error("failed_response");
      }

      const data = (await res.json()) as UserPost[];
      setAllPublicPosts(data);
    } catch {
      setAllPublicPosts([]);
      setApiError("Unable to reach post service. Start backend on port 3001.");
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const sections = ["All", ...Array.from(new Set(allPublicPosts.map((post) => post.section)))];

  const filteredPosts = allPublicPosts.filter((post) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      [post.author, post.section, post.content].join(" ").toLowerCase().includes(query);
    const matchesSection = activeSection === "All" || post.section === activeSection;

    return matchesQuery && matchesSection;
  });

  const displayPosts = [...filteredPosts].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
  });

  const featuredPost = displayPosts[0] ?? null;
  const totalAuthors = new Set(allPublicPosts.map((post) => post.author)).size;

  return (
    <main className={`relative min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

      <section className="mx-auto grid w-[80vw] max-w-none gap-7 px-1 py-7 md:grid-cols-12 md:py-10">
        <div className="md:col-span-8">
          <header className={`rounded-[32px] border p-6 md:p-8 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/92"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5d755f]"}`}>
              Community Timeline
            </p>
            <h1 className="mt-2 text-[36px] font-semibold leading-tight tracking-[-0.03em] md:text-[48px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
              Public Feed
            </h1>
            <p className={`mt-2 text-[15px] leading-relaxed ${isDark ? "text-white/68" : "text-[#4a5f4c]"}`}>
              Discover fresh writing, reflections, and verses from every section in one curated stream.
            </p>

            <div className={`mt-6 rounded-2xl border p-3.5 md:p-4 ${isDark ? "border-white/20 bg-[#1c2027]" : "border-black/10 bg-[#f4f8f0]"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`flex min-w-64 flex-1 items-center gap-2 rounded-full border px-4 py-2.5 ${isDark ? "border-white/20 bg-[#101318]" : "border-black/10 bg-[#fbfdf9]"}`}>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${isDark ? "text-white/45" : "text-[#7a8497]"}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.2-3.2" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by author, section or phrase"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent text-[14px] outline-none ${isDark ? "placeholder:text-white/35" : "placeholder:text-[#81907d]"}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"))}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] transition ${isDark ? "border-white/20 bg-[#1f2229] text-white/85 hover:bg-[#2a2f39]" : "border-black/10 bg-[#fbfdf9] text-[#2f4533] hover:bg-[#edf4ea]"}`}
                >
                  {sortOrder === "latest" ? "LATEST" : "OLDEST"}
                </button>

                <span className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] ${isDark ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]" : "border-[#0a8a5b]/30 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                  {displayPosts.length} POSTS
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {sections.map((section) => {
                  const active = activeSection === section;
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveSection(section)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition ${
                        active
                          ? isDark
                            ? "border-[#2ce88f]/45 bg-[#2ce88f] text-[#09130d]"
                            : "border-[#0a8a5b]/30 bg-[#0a8a5b] text-white"
                          : isDark
                            ? "border-white/12 bg-transparent text-white/72 hover:bg-white/8"
                          : "border-black/10 bg-transparent text-[#4f684f] hover:bg-[#edf4ea]"
                      }`}
                    >
                      {section}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {apiError ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {apiError}
            </div>
          ) : null}

          {featuredPost ? (
            <article className={`mt-5 rounded-[30px] border p-6 md:p-7 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/42" : "text-[#658169]"}`}>
                    Featured Post
                  </p>
                  <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                    {postPreview(featuredPost.content, 90)}
                  </h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${isDark ? "border-[#8cf8c1]/45 bg-[#2ce88f]/12 text-[#8cf8c1]" : "border-[#0a8a5b]/30 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                  {featuredPost.section}
                </span>
              </div>

              <p className={`mt-4 text-[15px] leading-7 ${isDark ? "text-white/82" : "text-[#2d4630]"}`}>
                {postPreview(featuredPost.content, 240)}
              </p>

              <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div>
                  <p className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#263a28]"}`}>{featuredPost.author}</p>
                  <p className={`text-[12px] ${isDark ? "text-white/45" : "text-[#71836f]"}`}>{formatPostDate(featuredPost.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {"Like,Comment,Share".split(",").map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.06em] transition ${isDark ? "border-white/15 bg-white/5 text-white/72 hover:bg-white/10" : "border-black/10 bg-[#f2f7ef] text-[#496249] hover:bg-[#e8f1e4]"}`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ) : null}

          <div className="mt-5 space-y-3.5">
            {displayPosts.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
                No public posts yet. Be the first to share.
              </div>
            ) : (
              displayPosts.slice(featuredPost ? 1 : 0).map((post) => (
                <article key={`public-${post.id}`} className={`rounded-2xl border p-4 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white/92"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold ${isDark ? "bg-white/10 text-white" : "bg-[#edf4ea] text-[#2f4732]"}`}>
                        {post.author.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#223726]"}`}>{post.author}</p>
                        <p className={`text-[12px] ${isDark ? "text-white/45" : "text-[#738770]"}`}>{formatPostDate(post.createdAt)}</p>
                      </div>
                    </div>

                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${isDark ? "border-white/15 text-white/70" : "border-black/10 text-[#5a715a]"}`}>
                      {post.section}
                    </span>
                  </div>

                  <p className={`mt-3 text-[15px] leading-7 ${isDark ? "text-white/84" : "text-[#2f4732]"}`}>
                    {post.content}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="md:col-span-4">
          <div className="space-y-4 md:sticky md:top-24">
            <section className={`rounded-[26px] border p-5 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/45" : "text-[#68748a]"}`}>
                Feed Stats
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <p className="text-2xl font-semibold">{allPublicPosts.length}</p>
                  <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#687c66]"}`}>Total posts</p>
                </div>
                <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <p className="text-2xl font-semibold">{totalAuthors}</p>
                  <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#687c66]"}`}>Writers active</p>
                </div>
                <div className={`col-span-2 rounded-2xl border p-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#687c66]"}`}>Current filter</p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">{activeSection}</p>
                </div>
              </div>
            </section>

            <section className={`rounded-[26px] border p-5 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/45" : "text-[#68748a]"}`}>
                Quick Access
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {QUICK_ACCESS_ITEMS.slice(0, 6).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`rounded-xl border px-3 py-2 text-[12px] font-semibold tracking-[0.06em] transition ${isDark ? "border-white/10 text-white/80 hover:bg-white/8" : "border-black/10 text-[#345236] hover:bg-[#edf4ea]"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className={`rounded-[26px] border p-5 ${isDark ? "border-[#2ce88f]/35 bg-[#123126]/65" : "border-[#0a8a5b]/20 bg-[#e8f7ef]/90"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-[#b5fbd5]" : "text-[#0d7a52]"}`}>
                Start Writing
              </p>
              <p className={`mt-2 text-[14px] leading-relaxed ${isDark ? "text-white/88" : "text-[#1f3a30]"}`}>
                Share a sher, a reflection, or a complete thought. Your next post can reach every reader in the feed.
              </p>
              <Link
                href={user ? "/my-profile" : "/login"}
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-[12px] font-bold tracking-[0.08em] transition ${isDark ? "bg-[#2ce88f] text-[#08120d] hover:bg-[#50f7a9]" : "bg-[#0a8a5b] text-white hover:bg-[#0d9d67]"}`}
              >
                {user ? "GO TO PROFILE" : "LOGIN TO POST"}
              </Link>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
