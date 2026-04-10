"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/auth";

type SiteNavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  activeHref?: string;
};

function buildAvatarFallbackDataUrl(name?: string) {
  const safeName = (name?.trim() || "User").slice(0, 40);
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='#2ce88f'/><text x='50%' y='53%' text-anchor='middle' dominant-baseline='middle' font-family='Arial, sans-serif' font-size='34' font-weight='700' fill='#0b1112'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const NAV_ITEMS = [
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

export function SiteNavbar({ isDark, onToggleTheme, activeHref }: SiteNavbarProps) {
  const { user } = useAuth();
  const avatarSrc =
    user?.avatarUrl?.trim() || buildAvatarFallbackDataUrl(user?.displayName || user?.username || "User");

  return (
    <nav
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? "border-white/15 bg-[#17181d]/88" : "border-black/10 bg-[#f3f7ef]/86"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[24px] font-bold tracking-[-0.02em]">Manav</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[13px] font-semibold tracking-[0.08em] transition hover:opacity-70 ${
                  isActive
                    ? isDark
                      ? "text-[#8cf8c1]"
                      : "text-[#0a8a5b]"
                    : isDark
                      ? "text-white/80"
                      : "text-[#203022]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition ${
              isDark ? "border-white/20 bg-[#1b1e24]" : "border-black/10 bg-white"
            }`}
            aria-label="Toggle theme"
          >
            <span>{isDark ? "DARK" : "LIGHT"}</span>
            <span className={`relative h-4 w-8 rounded-full transition ${isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full transition ${isDark ? "left-4 bg-[#0b1112]" : "left-0.5 bg-[#10131a]"}`} />
            </span>
          </button>

          {user ? (
            <Link
              href="/my-profile"
              aria-label="Open profile"
              className={`group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition ${
                isDark
                  ? "border-[#2ce88f]/45 bg-[#11161d] hover:border-[#2ce88f]/75"
                  : "border-[#0a8a5b]/30 bg-white hover:border-[#0a8a5b]/55"
              }`}
              title="Profile"
            >
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.04]"
              />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#2ce88f] px-4 py-2 text-[12px] font-bold tracking-[0.08em] text-[#0b1112] transition hover:bg-[#45f39f]"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
