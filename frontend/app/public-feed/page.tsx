"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/context/theme";

type UserPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: "public";
  createdAt: string;
};

export default function PublicFeedPage() {
  const { isDark, setIsDark } = useTheme();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("All");

  const backendUrl = "http://localhost:3001";

  const sections = ["All", ...Array.from(new Set(posts.map((post) => post.section)))];
  const filteredPosts = posts.filter((post) => {
    const matchesQuery = [post.author, post.section, post.content]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesSection = activeSection === "All" || post.section === activeSection;

    return matchesQuery && matchesSection;
  });

  const totalAuthors = new Set(posts.map((post) => post.author)).size;
  const latestPost = posts[0];

  const featuredPost = filteredPosts[0] ?? latestPost;

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${backendUrl}/posts/public`);
        if (!res.ok) {
          throw new Error("failed_response");
        }

        const data = (await res.json()) as UserPost[];
        setPosts(data);
      } catch {
        setError("Unable to load public posts. Start backend on port 3001.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <main className={`relative isolate min-h-screen overflow-hidden px-4 py-4 transition-colors duration-300 md:px-6 lg:px-8 ${isDark ? "text-white" : "text-[#10131a]"}`}>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-300 flex-col gap-4">
        <header className={`rounded-[28px] border p-4 shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-5 ${isDark ? "border-white/10 bg-white/6" : "border-black/10 bg-white"}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#6c7488]"}`}>
                Public Feed
              </p>
              <h1 className={`mt-1 text-2xl font-semibold tracking-tight md:text-3xl ${isDark ? "text-white" : "text-[#10131a]"}`}>
                All Posts
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className={`group inline-flex items-center gap-3 rounded-full border px-3 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] ${isDark ? "border-white/10 bg-white/6 text-white/80 hover:bg-white/10" : "border-black/10 bg-white text-[#202634] hover:bg-[#f4f6fa]"}`}
                aria-label="Toggle light and dark mode"
                aria-pressed={!isDark}
              >
                <span className="pl-1 text-[12px] font-semibold tracking-[0.16em]">
                  {isDark ? "DARK" : "LIGHT"}
                </span>
                <span
                  className={`relative flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-200 ${isDark ? "bg-[#1c2028]" : "bg-[#e6e8ee]"}`}
                >
                  <span
                    className={`h-6 w-6 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ${isDark ? "translate-x-0 bg-[#ffffff]" : "translate-x-5 bg-[#1a1f28]"}`}
                  />
                </span>
              </button>
              <Link
                href="/"
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-[#2ce88f]/35 bg-[#2ce88f]/10 text-[#8cf8c1] hover:bg-[#2ce88f]/15" : "border-black/10 bg-white text-[#202634] hover:bg-[#f4f6fa]"}`}
              >
                Back
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-full border px-4 py-3 ${isDark ? "border-white/10 bg-[#0f1218]" : "border-black/10 bg-[#f8f9fb]"}`}>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${isDark ? "text-white/45" : "text-[#7a8395]"}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10.5" cy="10.5" r="6.5" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className={`w-full bg-transparent text-sm outline-none ${isDark ? "placeholder:text-white/35" : "placeholder:text-[#8a93a6]"}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveSection("All");
                }}
                className={`rounded-full border px-4 py-3 text-sm font-medium transition ${isDark ? "border-white/10 bg-white/6 text-white/78 hover:bg-white/10" : "border-black/10 bg-white text-[#202634] hover:bg-[#f4f6fa]"}`}
              >
                Reset
              </button>
              <div className={`rounded-full border px-4 py-3 text-sm font-semibold ${isDark ? "border-[#2ce88f]/30 bg-[#2ce88f]/10 text-[#8cf8c1]" : "border-[#0a8a5b]/20 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                {filteredPosts.length} posts
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((section) => {
              const isActive = activeSection === section;

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? isDark
                        ? "border-[#2ce88f]/45 bg-[#2ce88f] text-[#08110d]"
                        : "border-[#0a8a5b]/25 bg-[#0a8a5b] text-white"
                      : isDark
                        ? "border-white/10 bg-white/6 text-white/75 hover:bg-white/10"
                        : "border-black/10 bg-white text-[#334056] hover:bg-[#f4f6fa]"
                  }`}
                >
                  {section}
                </button>
              );
            })}
          </div>
        </header>

        {error ? (
          <div className={`rounded-[22px] border px-4 py-3 text-sm ${isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`h-56 animate-pulse rounded-[28px] ${isDark ? "bg-white/8" : "bg-white"}`} />
            <div className={`h-56 animate-pulse rounded-[28px] ${isDark ? "bg-white/8" : "bg-white"}`} />
          </div>
        ) : posts.length === 0 ? (
          <div className={`rounded-[28px] border p-8 text-sm ${isDark ? "border-white/10 bg-white/6 text-white/70" : "border-black/10 bg-white text-[#5d6678]"}`}>
            No public posts yet.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className={`rounded-[28px] border p-8 text-sm ${isDark ? "border-white/10 bg-white/6 text-white/70" : "border-black/10 bg-white text-[#5d6678]"}`}>
            No posts found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className={`w-full rounded-[28px] border p-5 shadow-[0_22px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-white/6" : "border-black/10 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${isDark ? "bg-white/10 text-white" : "bg-[#eef1f6] text-[#202634]"}`}>
                      {post.author.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#10131a]"}`}>{post.author}</p>
                      <p className={`text-xs ${isDark ? "text-white/45" : "text-[#7a8395]"}`}>
                        {new Date(post.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-[#2ce88f]/35 bg-[#2ce88f]/10 text-[#8cf8c1]" : "border-[#0a8a5b]/20 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                    {post.section}
                  </span>
                </div>

                <p className={`mt-4 text-[15px] leading-7 ${isDark ? "text-white/86" : "text-[#243041]"}`}>
                  {post.content}
                </p>

                <div className={`mt-4 flex items-center justify-between border-t pt-4 text-xs ${isDark ? "border-white/10 text-white/45" : "border-black/10 text-[#758197]"}`}>
                  <span>Public</span>
                  <span>{post.visibility.toUpperCase()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
