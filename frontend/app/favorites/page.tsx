"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteNavbar } from "@/app/components/site-navbar";
import { SiteFooter } from "@/app/components/site-footer";
import { useTheme } from "@/app/context/theme";
import { useAuth } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type FavoritePost = {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: "public";
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByUser: boolean;
  favoritedByUser: boolean;
};

function formatPostDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function postPreview(content: string, max = 240) {
  if (content.length <= max) return content;
  return `${content.slice(0, max).trim()}...`;
}

export default function FavoritesPage() {
  const { isDark, setIsDark } = useTheme();
  const { user } = useAuth();
  const backendUrl = getApiBaseUrl();

  const [interactionAuthor, setInteractionAuthor] = useState("guest");
  const [posts, setPosts] = useState<FavoritePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${backendUrl}/posts/favorites?author=${encodeURIComponent(interactionAuthor)}`);
      if (!res.ok) {
        throw new Error("favorites_failed");
      }

      const data = (await res.json()) as FavoritePost[];
      setPosts(data);
    } catch {
      setError("Unable to load favorites right now.");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, interactionAuthor]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (postId: string) => {
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
        throw new Error("favorite_toggle_failed");
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch {
      setError("Unable to update favorites right now.");
    }
  };

  return (
    <main className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} activeHref="/favorites" />

      <section className="mx-auto w-[92vw] md:w-[80vw] max-w-none px-1 py-8 md:py-12">
        <header className={`rounded-[28px] border p-6 md:p-8 ${isDark ? "border-white/18 bg-[#151922]" : "border-black/10 bg-white"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/48" : "text-[#5d755f]"}`}>
            Personal Library
          </p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.03em] md:text-[50px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
            My Favorites
          </h1>
          <p className={`mt-3 text-[15px] ${isDark ? "text-white/68" : "text-[#4a5f4c]"}`}>
            Every post you mark as favorite appears here.
          </p>
        </header>

        {error ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {isLoading ? (
            <div className={`rounded-2xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
              Loading favorites...
            </div>
          ) : posts.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-6 text-center text-[15px] ${isDark ? "border-white/20 text-white/50" : "border-black/20 text-[#6c7488]"}`}>
              You have no favorite posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className={`rounded-[24px] border p-5 md:p-6 ${isDark ? "border-white/16 bg-[#131923]" : "border-black/10 bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-[#1d2f22]"}`}>
                    {post.author}
                  </p>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/15 text-white/75" : "border-black/10 text-[#566d58]"}`}>
                    {post.section}
                  </span>
                </div>

                <p className={`mt-3 text-[18px] leading-relaxed md:text-[22px] ${isDark ? "text-white/88" : "text-[#2c3338]"}`} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  {postPreview(post.content, 300)}
                </p>

                <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 ${isDark ? "border-white/12" : "border-black/10"}`}>
                  <p className={`text-[12px] ${isDark ? "text-white/45" : "text-[#6c7278]"}`}>
                    {formatPostDate(post.createdAt)}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-semibold ${isDark ? "text-white/70" : "text-[#4b5f4f]"}`}>
                      {post.likeCount} likes
                    </span>
                    <span className={`text-[12px] font-semibold ${isDark ? "text-white/70" : "text-[#4b5f4f]"}`}>
                      {post.commentCount} comments
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeFavorite(post.id)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.06em] transition ${isDark ? "border-white/20 bg-white/5 text-white/75 hover:bg-white/10" : "border-black/10 bg-[#f2f7ef] text-[#496249] hover:bg-[#e8f1e4]"}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  );
}
