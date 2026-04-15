"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteNavbar } from "@/app/components/site-navbar";
import { useAuth } from "@/app/context/auth";
import { useTheme } from "@/app/context/theme";
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
  { label: "HOME", href: "/" },
  { label: "ABOUT US", href: "/about-us" },
  { label: "CONTACT US", href: "/contact-us" },
  { label: "PRIVACY POLICY", href: "/privacy-policy" },
  { label: "LINKS", href: "/links" },
  { label: "EBOOK DOWNLOAD", href: "/ebook-download" },
  { label: "ARCHIVES", href: "/archives" },
];

const HERO_SLIDES = [
  {
    title: "A Living Library of Words",
    subtitle:
      "Move through poetry, essays, and reflections in one continuous reading experience.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=80",
    tag: "Editorial Collection",
  },
  {
    title: "Stories That Travel Across Eras",
    subtitle:
      "From classic voices to new writers, discover writing that stays with you long after reading.",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=80",
    tag: "Curated Timeline",
  },
  {
    title: "Designed for Reading Flow",
    subtitle:
      "Clean typography, focused rhythm, and thoughtful pacing built for desktop and mobile alike.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=80",
    tag: "Reader First",
  },
];

const MANAV_RECENT_CARDS = [
  {
    title: "Why Urdu Sounds Like Love | Guftugu with Javed Jaferi",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
  {
    title: "Kal Chaudhvin Ki Raat Thi | Papon Live",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
  {
    title: "Wasim Barelvi & Shakeel Azmi Mushaira | Best Moments",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
  {
    title: "Raj Babbar and Zeeshan Ayyub on Urdu Ishq and Cinema",
    image:
      "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
  {
    title: "Why Mirza Ghalib is Timeless | Javed Akhtar Special",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
  {
    title: "Rang-e-Ghazal: Voices That Shaped Modern Urdu",
    image:
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1000&q=80",
    href: "https://www.youtube.com/",
  },
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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const recentCarouselRef = useRef<HTMLDivElement | null>(null);

  const backendUrl = getApiBaseUrl();

  const loadPosts = async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/posts/public`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("failed_response");
      }

      const data = (await res.json()) as UserPost[];
      setAllPublicPosts(data);
    } catch {
      setAllPublicPosts([]);
      setApiError(null);
      console.warn("Public posts unavailable; rendering empty feed state.");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const jumpToSlide = (index: number) => {
    setActiveHeroSlide(index);
  };

  const showPrevSlide = () => {
    setActiveHeroSlide((prev) =>
      prev === 0 ? HERO_SLIDES.length - 1 : prev - 1,
    );
  };

  const showNextSlide = () => {
    setActiveHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const scrollRecentCards = (direction: "prev" | "next") => {
    const container = recentCarouselRef.current;
    if (!container) return;

    const step = Math.round(container.clientWidth * 0.78);
    container.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

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

      <section className="w-full px-0 pt-0">
        <div className="relative h-[48vh] min-h-80 w-full overflow-hidden md:h-[56vh] md:min-h-115">
          {HERO_SLIDES.map((slide, index) => {
            const active = activeHeroSlide === index;
            return (
              <article
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-hidden={!active}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.42)_45%,rgba(0,0,0,0.15)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 top-0 mx-auto flex w-[92vw] max-w-350 items-end pb-8 md:items-center md:pb-0">
                  <div className="max-w-xl rounded-[30px] border border-white/25 bg-black/30 p-5 text-white backdrop-blur-md md:p-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      {slide.tag}
                    </p>
                    <h2
                      className="mt-2 text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] md:text-[58px]"
                      style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                    >
                      {slide.title}
                    </h2>
                    <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/88 md:text-[16px]">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            aria-label="Previous slide"
            onClick={showPrevSlide}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 p-2.5 text-white transition hover:bg-black/55 md:left-6"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Next slide"
            onClick={showNextSlide}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 p-2.5 text-white transition hover:bg-black/55 md:right-6"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:bottom-6">
            {HERO_SLIDES.map((slide, index) => {
              const active = activeHeroSlide === index;
              return (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => jumpToSlide(index)}
                  className={`h-2.5 rounded-full transition ${active ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white/85"}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[80vw] max-w-none gap-7 px-1 py-7 md:grid-cols-12 md:py-10">
        <div className="md:col-span-8">
          <header className={`overflow-hidden rounded-[34px] border ${isDark ? "border-white/18 bg-[#17181d]" : "border-black/10 bg-white/92"}`}>
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.95fr]">
              <div className="relative p-6 md:p-8 lg:p-10">
                <div className={`absolute inset-0 ${isDark ? "bg-[radial-gradient(circle_at_top_left,rgba(44,232,143,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_42%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(10,138,91,0.13),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(10,138,91,0.06),transparent_42%)]"}`} />
                <div className="relative z-10">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5d755f]"}`}>
                    Community Timeline
                  </p>
                  <h1 className="mt-2 max-w-xl text-[36px] font-semibold leading-[0.98] tracking-[-0.04em] md:text-[56px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                    Public Feed
                  </h1>
                  <p className={`mt-3 max-w-lg text-[15px] leading-relaxed ${isDark ? "text-white/68" : "text-[#4a5f4c]"}`}>
                    Discover fresh writing, reflections, and verses from every section in one curated stream.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] ${isDark ? "border-[#8cf8c1]/35 bg-[#2ce88f]/10 text-[#8cf8c1]" : "border-[#0a8a5b]/25 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                      {displayPosts.length} POSTS
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] ${isDark ? "border-white/15 bg-white/5 text-white/75" : "border-black/10 bg-white/80 text-[#2f4533]"}`}>
                      {totalAuthors} WRITERS
                    </div>
                    <div className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] ${isDark ? "border-white/15 bg-white/5 text-white/75" : "border-black/10 bg-white/80 text-[#2f4533]"}`}>
                      {sortOrder === "latest" ? "LATEST" : "OLDEST"}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className={`flex min-w-0 items-center gap-2 rounded-full border px-4 py-2.5 ${isDark ? "border-white/20 bg-[#101318]" : "border-black/10 bg-[#fbfdf9]"}`}>
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${isDark ? "text-white/45" : "text-[#7a8497]"}`} fill="none" stroke="currentColor" strokeWidth="2">
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
                      className={`rounded-full border px-5 py-2 text-[12px] font-semibold tracking-[0.08em] transition ${isDark ? "border-white/20 bg-[#1f2229] text-white/85 hover:bg-[#2a2f39]" : "border-black/10 bg-[#fbfdf9] text-[#2f4533] hover:bg-[#edf4ea]"}`}
                    >
                      {sortOrder === "latest" ? "LATEST" : "OLDEST"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
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
              </div>

              <div className="relative min-h-80 lg:min-h-105">
                <img
                  src="https://picsum.photos/seed/public-feed-banner/1200/1200"
                  alt="Public feed banner"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/28 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                  <div className={`rounded-[26px] border p-4 backdrop-blur-md ${isDark ? "border-white/15 bg-black/25" : "border-white/20 bg-black/20"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      Featured Stream
                    </p>
                    <h2 className="mt-2 text-[24px] font-semibold leading-tight text-white md:text-[30px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                      Curated words from every corner of the platform.
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/82">
                      Search, filter, and switch between sections without losing the visual focus of the banner.
                    </p>
                  </div>
                </div>
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
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${isDark ? "border-[#8cf8c1]/45 bg-[#2ce88f]/12 text-[#8cf8c1]" : "border-[#0a8a5b]/30 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
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

                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${isDark ? "border-white/15 text-white/70" : "border-black/10 text-[#5a715a]"}`}>
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

      <section className={`mx-auto w-[92vw] max-w-350 px-1 pb-14 pt-4 ${isDark ? "text-white" : "text-[#0e2138]"}`}>
        <header className="text-center">
          <p className={`text-[22px] font-semibold tracking-[0.28em] md:text-[26px] ${isDark ? "text-white/88" : "text-[#24384f]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
            MANAV RECENT
          </p>
          <p className={`mt-2 text-[14px] md:text-[16px] ${isDark ? "text-white/72" : "text-[#31465e]"}`}>
            Watch. Share. Subscribe.
          </p>
        </header>

        <div className="relative mt-8 md:mt-10">
          <button
            type="button"
            onClick={() => scrollRecentCards("prev")}
            aria-label="Scroll previous cards"
            className={`absolute left-0 top-1/2 z-20 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border md:flex ${isDark ? "border-white/25 bg-[#0f131a]/85 text-white hover:bg-[#1b2331]" : "border-black/10 bg-white/90 text-[#4b5d74] hover:bg-white"}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div
            ref={recentCarouselRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MANAV_RECENT_CARDS.map((card) => (
              <article key={card.title} className="group w-[calc(50%-10px)] min-w-45 shrink-0 snap-start sm:w-60 sm:min-w-60">
                <a href={card.href} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-4/6 overflow-hidden rounded-3xl">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/58 text-white backdrop-blur-sm transition group-hover:scale-105">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <h3 className={`mt-3 line-clamp-2 text-[14px] font-semibold leading-snug md:text-[16px] ${isDark ? "text-white/92" : "text-[#0e2742]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                    {card.title}
                  </h3>
                </a>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollRecentCards("next")}
            aria-label="Scroll next cards"
            className={`absolute right-0 top-1/2 z-20 hidden h-14 w-14 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border md:flex ${isDark ? "border-white/25 bg-[#0f131a]/85 text-white hover:bg-[#1b2331]" : "border-black/10 bg-white/90 text-[#4b5d74] hover:bg-white"}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}
