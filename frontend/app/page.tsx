"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNavbar } from "@/app/components/site-navbar";
import { SiteFooter } from "@/app/components/site-footer";
import { useTheme } from "@/app/context/theme";
import { useAuth } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type UserPost = {
  id: string;
  section: string;
  author: string;
  avatarUrl?: string;
  content: string;
  visibility: "public";
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByUser: boolean;
  favoritedByUser: boolean;
};

type PostComment = {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
};

type HeroSlide = {
  title: string;
  subtitle: string;
  image: string;
  tag: string;
};

type HomeConfigResponse = {
  slides: HeroSlide[];
  updatedAt: string | null;
  updatedBy: string | null;
};

const DEFAULT_POSTS: UserPost[] = [];

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
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

const INSAAN_RECENT_CARDS = [
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

function postLineBreak(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 70) return [cleaned];

  const midpoint = Math.floor(cleaned.length / 2);
  const splitPoint = cleaned.indexOf(" ", midpoint);
  if (splitPoint === -1) return [cleaned];

  return [cleaned.slice(0, splitPoint).trim(), cleaned.slice(splitPoint + 1).trim()];
}

function buildAvatarFallbackDataUrl(name?: string) {
  const safeName = (name?.trim() || "User").slice(0, 40);
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><rect width='72' height='72' rx='36' fill='#2ce88f'/><text x='50%' y='54%' text-anchor='middle' dominant-baseline='middle' font-family='Georgia, serif' font-size='26' font-weight='700' fill='#0b1112'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PublicFeed() {
  const { isDark, setIsDark } = useTheme();
  const { user } = useAuth();
  const [allPublicPosts, setAllPublicPosts] = useState<UserPost[]>(DEFAULT_POSTS);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [interactionAuthor, setInteractionAuthor] = useState("guest");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [pendingAction, setPendingAction] = useState<Record<string, boolean>>({});
  const recentCarouselRef = useRef<HTMLDivElement | null>(null);
  const featuredPostsCarouselRef = useRef<HTMLDivElement | null>(null);

  const backendUrl = getApiBaseUrl();

  useEffect(() => {
    if (user?.username?.trim()) {
      setInteractionAuthor(user.username.trim());
      return;
    }

    if (typeof window === "undefined") return;

    const cacheKey = "INSAAN-guest-author";
    const existing = localStorage.getItem(cacheKey);
    if (existing?.trim()) {
      setInteractionAuthor(existing.trim());
      return;
    }

    const generated = `guest_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(cacheKey, generated);
    setInteractionAuthor(generated);
  }, [user?.username]);

  const loadPosts = useCallback(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/posts/public?author=${encodeURIComponent(interactionAuthor)}`, {
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
  }, [backendUrl, interactionAuthor]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const loadHomeConfig = async () => {
      try {
        const res = await fetch(`${backendUrl}/public/home-config`);
        if (!res.ok) return;

        const config = (await res.json()) as HomeConfigResponse;
        if (config.slides?.length > 0) {
          setHeroSlides(config.slides);
          setActiveHeroSlide(0);
        }
      } catch {
        // Keep the local fallback slides if the config endpoint is unavailable.
      }
    };

    void loadHomeConfig();
  }, [backendUrl]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  const jumpToSlide = (index: number) => {
    setActiveHeroSlide(index);
  };

  const showPrevSlide = () => {
    setActiveHeroSlide((prev) =>
      prev === 0 ? heroSlides.length - 1 : prev - 1,
    );
  };

  const showNextSlide = () => {
    setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
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

  const scrollFeaturedPosts = (direction: "prev" | "next") => {
    const container = featuredPostsCarouselRef.current;
    if (!container) return;

    const step = Math.round(container.clientWidth * 0.86);
    container.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  const setPostMetrics = useCallback((
    postId: string,
    updates: Partial<Pick<UserPost, "likeCount" | "commentCount" | "likedByUser" | "favoritedByUser">>,
  ) => {
    setAllPublicPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)),
    );
  }, []);

  const toggleFavorite = async (postId: string) => {
    const pendingKey = `favorite-${postId}`;
    if (pendingAction[pendingKey]) return;

    setPendingAction((prev) => ({ ...prev, [pendingKey]: true }));
    try {
      const res = await fetch(`${backendUrl}/posts/${postId}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: interactionAuthor,
        }),
      });

      if (!res.ok) {
        throw new Error("favorite_failed");
      }

      const data = (await res.json()) as { postId: string; favoritedByUser: boolean };
      setPostMetrics(data.postId, { favoritedByUser: data.favoritedByUser });
      setApiError(null);
    } catch {
      setApiError("Unable to update favorite right now.");
    } finally {
      setPendingAction((prev) => ({ ...prev, [pendingKey]: false }));
    }
  };

  const handleSharePost = async (post: UserPost) => {
    const shareText = `${post.author}: ${postPreview(post.content, 160)}`;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/#post-${post.id}` : "";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${post.author} - ${post.section}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`.trim());
      }
    } catch {
      setApiError("Unable to share this post right now.");
    }
  };

  const handleDownloadPost = (post: UserPost) => {
    if (typeof window === "undefined") return;
    const text = `${post.content}\n\n${post.author}\n${post.section}\n${formatPostDate(post.createdAt)}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `insaaan-post-${post.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleLikePost = async (postId: string) => {
    const pendingKey = `like-${postId}`;
    if (pendingAction[pendingKey]) return;

    setPendingAction((prev) => ({ ...prev, [pendingKey]: true }));
    try {
      const res = await fetch(`${backendUrl}/posts/${postId}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: interactionAuthor,
        }),
      });

      if (!res.ok) {
        throw new Error("like_failed");
      }

      const data = (await res.json()) as {
        postId: string;
        likeCount: number;
        commentCount: number;
        likedByUser: boolean;
      };
      setPostMetrics(data.postId, {
        likeCount: data.likeCount,
        commentCount: data.commentCount,
        likedByUser: data.likedByUser,
      });
      setApiError(null);
    } catch {
      setApiError("Unable to like this post right now.");
    } finally {
      setPendingAction((prev) => ({ ...prev, [pendingKey]: false }));
    }
  };

  const loadComments = useCallback(
    async (postId: string) => {
      const pendingKey = `comments-load-${postId}`;
      if (pendingAction[pendingKey]) return;

      setPendingAction((prev) => ({ ...prev, [pendingKey]: true }));
      try {
        const res = await fetch(`${backendUrl}/posts/${postId}/comments`);
        if (!res.ok) {
          throw new Error("comments_failed");
        }

        const data = (await res.json()) as PostComment[];
        setCommentsByPost((prev) => ({ ...prev, [postId]: data }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
      } finally {
        setPendingAction((prev) => ({ ...prev, [pendingKey]: false }));
      }
    },
    [backendUrl, pendingAction],
  );

  const toggleCommentsForPost = async (postId: string) => {
    const willOpen = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: willOpen }));

    if (willOpen && !commentsByPost[postId]) {
      await loadComments(postId);
    }
  };

  const handleAddComment = async (post: UserPost) => {
    const postId = post.id;
    const content = commentDrafts[postId]?.trim();
    if (!content) return;

    const pendingKey = `comment-submit-${postId}`;
    if (pendingAction[pendingKey]) return;

    setPendingAction((prev) => ({ ...prev, [pendingKey]: true }));
    try {
      const res = await fetch(`${backendUrl}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          author: interactionAuthor,
        }),
      });

      if (!res.ok) {
        throw new Error("comment_add_failed");
      }

      const data = (await res.json()) as { comment: PostComment; commentCount: number };
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [data.comment, ...(prev[postId] ?? [])],
      }));
      setPostMetrics(postId, { commentCount: data.commentCount });
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      setApiError(null);
    } catch {
      setApiError("Unable to add comment right now.");
    } finally {
      setPendingAction((prev) => ({ ...prev, [pendingKey]: false }));
    }
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
  const topFeaturedPosts = [...allPublicPosts]
    .sort((a, b) => {
      const aScore = a.likeCount + a.commentCount;
      const bScore = b.likeCount + b.commentCount;
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  return (
    <main className={`relative min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

      <section className="w-full px-0 pt-0">
        <div className="relative h-[48vh] min-h-80 w-full overflow-hidden md:h-[56vh] md:min-h-115">
          {heroSlides.map((slide, index) => {
            const active = activeHeroSlide === index;
            return (
              <article
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-hidden={!active}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  unoptimized
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
            {heroSlides.map((slide, index) => {
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

      <article
        className={`relative mx-auto mt-5 w-[80vw] max-w-none overflow-hidden rounded-[34px] border p-5 md:p-7 ${isDark ? "border-white/15 bg-[#151922]" : "border-black/10 bg-white"}`}
      >
            <div
              className={`pointer-events-none absolute inset-0 ${isDark ? "bg-[radial-gradient(circle_at_top_left,rgba(44,232,143,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(163,217,255,0.1),transparent_45%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(10,138,91,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(35,95,168,0.08),transparent_45%)]"}`}
            />

            <div className="relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.17em] ${isDark ? "text-white/55" : "text-[#5b7560]"}`}>
                    Featured Ranking
                  </p>
                  <h2
                    className="mt-2 text-[30px] font-semibold leading-[0.96] tracking-[-0.03em] md:text-[42px]"
                    style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                  >
                    Today's Top 5 
                  </h2>
                  <p className={`mt-3 max-w-2xl text-[14px] leading-relaxed md:text-[15px] ${isDark ? "text-white/70" : "text-[#49624d]"}`}>
                    These posts are trending now based on total engagement from likes and comments.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollFeaturedPosts("prev")}
                    aria-label="Scroll featured posts left"
                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${isDark ? "border-white/20 bg-[#0f131a]/80 text-white hover:bg-[#1b2331]" : "border-black/10 bg-white/90 text-[#2f4c33] hover:bg-[#f0f5ef]"}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollFeaturedPosts("next")}
                    aria-label="Scroll featured posts right"
                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${isDark ? "border-white/20 bg-[#0f131a]/80 text-white hover:bg-[#1b2331]" : "border-black/10 bg-white/90 text-[#2f4c33] hover:bg-[#f0f5ef]"}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {topFeaturedPosts.length === 0 ? (
                <div className={`mt-6 rounded-2xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/55" : "border-black/20 text-[#5f7062]"}`}>
                  Featured posts will appear here once engagement starts building.
                </div>
              ) : (
                <div
                  ref={featuredPostsCarouselRef}
                  className="mt-6 flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {topFeaturedPosts.map((post, index) => {
                    const totalEngagement = post.likeCount + post.commentCount;

                    return (
                      <article
                        key={`featured-top-${post.id}`}
                        className={`w-[78%] min-w-[78%] shrink-0 snap-start rounded-[26px] border p-5 md:w-[46%] md:min-w-[46%] xl:w-[30%] xl:min-w-[30%] ${isDark ? "border-white/18 bg-[#121722]" : "border-black/10 bg-[#fbfdfb]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.1em] ${isDark ? "border-[#8cf8c1]/45 bg-[#2ce88f]/14 text-[#9af9ca]" : "border-[#0a8a5b]/25 bg-[#0a8a5b]/10 text-[#0a8a5b]"}`}>
                            #{index + 1}
                          </span>

                          <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/15 text-white/75" : "border-black/10 text-[#566d58]"}`}>
                            {post.section}
                          </span>
                        </div>

                        <h3
                          className="mt-4 line-clamp-3 text-[23px] font-semibold leading-tight tracking-[-0.02em]"
                          style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                        >
                          {postPreview(post.content, 120)}
                        </h3>

                        <p className={`mt-3 line-clamp-3 text-[14px] leading-relaxed ${isDark ? "text-white/74" : "text-[#3f5542]"}`}>
                          {postPreview(post.content, 210)}
                        </p>

                        <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? "border-white/12" : "border-black/10"}`}>
                          <div>
                            <p className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#243b27]"}`}>{post.author}</p>
                            <p className={`text-[12px] ${isDark ? "text-white/45" : "text-[#68806b]"}`}>{formatPostDate(post.createdAt)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDark ? "border-white/14 bg-white/6 text-white/85" : "border-black/10 bg-white text-[#325036]"}`}>
                              {post.likeCount} Likes
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDark ? "border-white/14 bg-white/6 text-white/85" : "border-black/10 bg-white text-[#325036]"}`}>
                              {post.commentCount} Comments
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDark ? "border-[#2ce88f]/35 bg-[#2ce88f]/12 text-[#9af9ca]" : "border-[#0a8a5b]/20 bg-[#e8f5ee] text-[#0a8a5b]"}`}>
                              {totalEngagement} Total
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </article>

          {apiError ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {apiError}
            </div>
          ) : null}

          {featuredPost ? (
            <article className="mt-6 pb-8">
              <div className="mx-auto max-w-5xl px-3 text-center">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-[#8cf8c1]" : "text-[#2f7452]"}`}>
                  Featured Post
                </p>
                <div className="mt-4 space-y-2 md:space-y-3">
                  {postLineBreak(postPreview(featuredPost.content, 210)).map((line) => (
                    <p
                      key={`${featuredPost.id}-${line}`}
                      className={`text-[31px] leading-[1.35] italic tracking-[0.01em] md:text-[45px] ${isDark ? "text-white/90" : "text-[#212529]"}`}
                      style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-center gap-2.5">
                  <span className="relative h-8 w-8 overflow-hidden rounded-full border border-black/10">
                    <Image
                      src={featuredPost.avatarUrl?.trim() || buildAvatarFallbackDataUrl(featuredPost.author)}
                      alt={featuredPost.author}
                      fill
                      sizes="32px"
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <p className={`text-[22px] font-semibold leading-none ${isDark ? "text-white" : "text-[#171b1e]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                    {featuredPost.author.toUpperCase()}
                  </p>
                </div>

                <p className={`mt-1 text-[13px] ${isDark ? "text-white/45" : "text-[#6c7278]"}`}>
                  {formatPostDate(featuredPost.createdAt)} · {featuredPost.section}
                </p>

                <div className={`mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2.5 pt-5 ${isDark ? "border-t border-white/12" : "border-t border-black/10"}`}>
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(featuredPost.id)}
                    className={`inline-flex items-center gap-2 text-[15px] md:text-[17px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                  >
                    <span aria-hidden="true">{featuredPost.favoritedByUser ? "♥" : "♡"}</span>
                    <span className="text-[15px] md:text-[17px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Add To Favorites</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLikePost(featuredPost.id)}
                    className={`inline-flex items-center gap-2 text-[15px] md:text-[17px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                  >
                    <span aria-hidden="true">{featuredPost.likedByUser ? "💚" : "👍"}</span>
                    <span className="text-[15px] md:text-[17px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Like ({featuredPost.likeCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleCommentsForPost(featuredPost.id)}
                    className={`inline-flex items-center gap-2 text-[15px] md:text-[17px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                  >
                    <span aria-hidden="true">💬</span>
                    <span className="text-[15px] md:text-[17px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Comment ({featuredPost.commentCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSharePost(featuredPost)}
                    className={`inline-flex items-center gap-2 text-[15px] md:text-[17px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                  >
                    <span aria-hidden="true">↗</span>
                    <span className="text-[15px] md:text-[17px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Share this</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPost(featuredPost)}
                    className={`inline-flex items-center gap-2 text-[15px] md:text-[17px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                  >
                    <span aria-hidden="true">⬇</span>
                    <span className="text-[15px] md:text-[17px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Download</span>
                  </button>
                </div>

                {expandedComments[featuredPost.id] ? (
                  <div className={`mx-auto mt-6 max-w-3xl rounded-2xl border p-4 text-left ${isDark ? "border-white/16 bg-white/3" : "border-black/10 bg-white/75"}`}>
                    <div className="space-y-3">
                      {(commentsByPost[featuredPost.id] ?? []).map((comment) => (
                        <div key={comment.id} className={`rounded-xl px-3 py-2 ${isDark ? "bg-white/5" : "bg-[#f4f7f4]"}`}>
                          <p className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-[#243127]"}`}>{comment.author}</p>
                          <p className={`text-[14px] ${isDark ? "text-white/82" : "text-[#35453b]"}`}>{comment.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[featuredPost.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({ ...prev, [featuredPost.id]: event.target.value }))
                        }
                        placeholder="Write a comment"
                        className={`w-full rounded-full border px-4 py-2 text-[14px] outline-none ${isDark ? "border-white/16 bg-[#101318] text-white placeholder:text-white/35" : "border-black/10 bg-white text-[#1f2d23] placeholder:text-[#879488]"}`}
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddComment(featuredPost)}
                        className={`rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.06em] ${isDark ? "bg-[#2ce88f] text-[#07130d]" : "bg-[#0a8a5b] text-white"}`}
                      >
                        POST
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}

          <div className="mt-8 space-y-14 md:space-y-16">
            {displayPosts.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
                No public posts yet. Be the first to share.
              </div>
            ) : (
              displayPosts.slice(featuredPost ? 1 : 0).map((post) => (
                <article key={`public-${post.id}`} className="pb-12 md:pb-16">
                  <div className="mx-auto max-w-5xl px-3 text-center">
                    <div className="space-y-1.5 md:space-y-2">
                      {postLineBreak(postPreview(post.content, 180)).map((line) => (
                        <p
                          key={`${post.id}-${line}`}
                          className={`text-[29px] leading-[1.38] italic tracking-[0.01em] md:text-[41px] ${isDark ? "text-white/88" : "text-[#272b2e]"}`}
                          style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2.5">
                      <span className="relative h-8 w-8 overflow-hidden rounded-full border border-black/10">
                        <Image
                          src={post.avatarUrl?.trim() || buildAvatarFallbackDataUrl(post.author)}
                          alt={post.author}
                          fill
                          sizes="32px"
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <p className={`text-[20px] font-semibold leading-none ${isDark ? "text-white" : "text-[#171b1e]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                        {post.author.toUpperCase()}
                      </p>
                    </div>
                    <p className={`mt-1 text-[13px] ${isDark ? "text-white/45" : "text-[#6c7278]"}`}>
                      {formatPostDate(post.createdAt)} · {post.section}
                    </p>

                    <div className={`mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2.5 pt-4 ${isDark ? "border-t border-white/12" : "border-t border-black/10"}`}>
                      <button
                        type="button"
                        onClick={() => void toggleFavorite(post.id)}
                        className={`inline-flex items-center gap-2 text-[14px] md:text-[16px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                      >
                        <span aria-hidden="true">{post.favoritedByUser ? "♥" : "♡"}</span>
                        <span className="text-[14px] md:text-[16px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Add To Favorites</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleLikePost(post.id)}
                        className={`inline-flex items-center gap-2 text-[14px] md:text-[16px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                      >
                        <span aria-hidden="true">{post.likedByUser ? "💚" : "👍"}</span>
                        <span className="text-[14px] md:text-[16px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Like ({post.likeCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleCommentsForPost(post.id)}
                        className={`inline-flex items-center gap-2 text-[14px] md:text-[16px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                      >
                        <span aria-hidden="true">💬</span>
                        <span className="text-[14px] md:text-[16px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Comment ({post.commentCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSharePost(post)}
                        className={`inline-flex items-center gap-2 text-[14px] md:text-[16px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                      >
                        <span aria-hidden="true">↗</span>
                        <span className="text-[14px] md:text-[16px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Share this</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPost(post)}
                        className={`inline-flex items-center gap-2 text-[14px] md:text-[16px] ${isDark ? "text-white/68 hover:text-white" : "text-[#6d6d6d] hover:text-[#333]"}`}
                      >
                        <span aria-hidden="true">⬇</span>
                        <span className="text-[14px] md:text-[16px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Download</span>
                      </button>
                    </div>

                    {expandedComments[post.id] ? (
                      <div className={`mx-auto mt-5 max-w-3xl rounded-2xl border p-4 text-left ${isDark ? "border-white/16 bg-white/3" : "border-black/10 bg-white/75"}`}>
                        <div className="space-y-3">
                          {(commentsByPost[post.id] ?? []).map((comment) => (
                            <div key={comment.id} className={`rounded-xl px-3 py-2 ${isDark ? "bg-white/5" : "bg-[#f4f7f4]"}`}>
                              <p className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-[#243127]"}`}>{comment.author}</p>
                              <p className={`text-[14px] ${isDark ? "text-white/82" : "text-[#35453b]"}`}>{comment.content}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                            placeholder="Write a comment"
                            className={`w-full rounded-full border px-4 py-2 text-[14px] outline-none ${isDark ? "border-white/16 bg-[#101318] text-white placeholder:text-white/35" : "border-black/10 bg-white text-[#1f2d23] placeholder:text-[#879488]"}`}
                          />
                          <button
                            type="button"
                            onClick={() => void handleAddComment(post)}
                            className={`rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.06em] ${isDark ? "bg-[#2ce88f] text-[#07130d]" : "bg-[#0a8a5b] text-white"}`}
                          >
                            POST
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
      <section className={`mx-auto grid w-[80vw] max-w-none gap-6 px-1 py-6 md:grid-cols-12 md:py-10 ${isDark ? "text-white" : "text-[#0e2138]"}`}>
        <div className="md:col-span-12">
          <header className="text-center">
          <p className={`text-[22px] font-semibold tracking-[0.28em] md:text-[26px] ${isDark ? "text-white/88" : "text-[#24384f]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
            INSAAN RECENT
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
            {INSAAN_RECENT_CARDS.map((card) => (
              <article key={card.title} className="group w-[calc(50%-10px)] min-w-45 shrink-0 snap-start sm:w-60 sm:min-w-60">
                <a href={card.href} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-4/6 overflow-hidden rounded-3xl">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 640px) 240px, 50vw"
                      unoptimized
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
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  );
}

