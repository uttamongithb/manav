"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  { label: "Home", href: "/" },
  { label: "About us", href: "/about-us" },
  { label: "Contact us", href: "/contact-us" },
  { label: "Donate", href: "/donate" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "My Favorites", href: "/favorites" },
  {
    label: "Links",
    href: "/links",
    dropdownItems: [
      { label: "Home Page", href: "/links?topic=Home%20Page" },
      { label: "News", href: "/links?topic=News" },
      { label: "Literature", href: "/links?topic=Literature" },
      { label: "Activities", href: "/links?topic=Activities" },
      { label: "Special report", href: "/links?topic=Special%20report" },
      { label: "Health", href: "/links?topic=Health" },
      { label: "Interesting", href: "/links?topic=Interesting" },
      { label: "Sport", href: "/links?topic=Sport" },
      { label: "Entertainment", href: "/links?topic=Entertainment" },
      { label: "Donate", href: "/donate" },
    ],
  },
  { label: "EBook Download", href: "/ebook-download" },
  { label: "Archives", href: "/archives" },
];

export function SiteNavbar({ isDark, onToggleTheme, activeHref }: SiteNavbarProps) {
  const { user } = useAuth();
  const [cachedAvatarUrl, setCachedAvatarUrl] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = ["admin", "superadmin"].includes(user?.role?.toLowerCase?.() ?? "");
  const visibleNavItems = isAdmin
    ? [...NAV_ITEMS, { label: "Admin", href: "/admin" }]
    : NAV_ITEMS;
  const mobileExploreItems = [
    { label: "Home", href: "/" },
    { label: "Poets", href: "/poets" },
    { label: "Public Feed", href: "/public-feed" },
    { label: "Donate", href: "/donate" },
    { label: "Archives", href: "/archives" },
    { label: "EBook Download", href: "/ebook-download" },
  ];
  const mobileCommunityItems = [
    { label: "About Us", href: "/about-us" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Links", href: "/links" },
    { label: "My Profile", href: "/my-profile" },
    { label: "Login", href: "/login" },
  ];

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") {
      return;
    }

    const cacheKey = `INSAAN-profile-cache:${user.id}`;
    const loadAvatar = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) {
          setCachedAvatarUrl("");
          return;
        }

        const parsed = JSON.parse(raw) as { avatarUrl?: string };
        setCachedAvatarUrl(parsed.avatarUrl?.trim() || "");
      } catch {
        setCachedAvatarUrl("");
      }
    };

    loadAvatar();
    window.addEventListener("storage", loadAvatar);
    window.addEventListener("INSAAN-profile-updated", loadAvatar);

    return () => {
      window.removeEventListener("storage", loadAvatar);
      window.removeEventListener("INSAAN-profile-updated", loadAvatar);
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const avatarSrc =
    cachedAvatarUrl ||
    user?.avatarUrl?.trim() ||
    buildAvatarFallbackDataUrl(user?.displayName || user?.username || "User");

  return (
    <nav
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? "border-white/15 bg-[#17181d]/88" : "border-black/10 bg-[#f3f7ef]/86"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[24px] font-bold tracking-[-0.02em]">INSAAN</span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {visibleNavItems.map((item) => {
            const isActive = activeHref === item.href || (item.href === "/links" && activeHref?.startsWith("/links"));

            if (item.dropdownItems?.length) {
              return (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 text-[14px] font-semibold tracking-[0.08em] transition hover:opacity-70 ${
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
                    <span className="inline-flex items-center" aria-hidden="true">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M5.6 7.5L10 11.9l4.4-4.4 1 1L10 14 4.6 8.5l1-1z" />
                      </svg>
                    </span>
                  </Link>

                  <div
                    className={`invisible absolute left-0 top-full z-50 mt-2 w-52 translate-y-1 rounded-2xl border p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
                      isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"
                    }`}
                  >
                    {item.dropdownItems.map((entry) => (
                      <Link
                        key={entry.label}
                        href={entry.href}
                        className={`block rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          isDark
                            ? "text-white/80 hover:bg-white/8"
                            : "text-[#203022] hover:bg-[#edf4ea]"
                        }`}
                      >
                        {entry.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[14px] font-semibold tracking-[0.08em] transition hover:opacity-70 ${
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:font-semibold sm:tracking-[0.08em] ${
              isDark ? "border-white/20 bg-[#1b1e24]" : "border-black/10 bg-white"
            }`}
            aria-label="Toggle theme"
          >
            <span className="hidden sm:inline">{isDark ? "DARK" : "LIGHT"}</span>
            <span className={`relative h-4 w-8 rounded-full transition ${isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full transition ${isDark ? "left-4 bg-[#0b1112]" : "left-0.5 bg-[#10131a]"}`} />
            </span>
          </button>

          <div className="lg:hidden">
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
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  fill
                  sizes="40px"
                  unoptimized
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.04]"
                />
              </Link>
            ) : (
              <Link
                href="/login"
                aria-label="Open login"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isDark
                    ? "border-[#2ce88f]/35 bg-[#2ce88f]/10 text-[#8cf8c1] hover:bg-[#2ce88f]/20"
                    : "border-[#0a8a5b]/25 bg-[#0a8a5b]/10 text-[#0a8a5b] hover:bg-[#0a8a5b]/15"
                }`}
                title="Sign in"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M4.5 20c1.2-3.6 3.9-5.5 7.5-5.5S18.3 16.4 19.5 20" strokeLinecap="round" />
                </svg>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${
              isDark ? "border-white/20 bg-[#1b1e24] text-white" : "border-black/10 bg-white text-[#10131a]"
            }`}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="site-mobile-navigation"
          >
            <span className="relative block h-4 w-4">
              <span
                className={`absolute left-0 top-0 h-0.5 w-4 rounded-full bg-current transition-transform duration-200 ${
                  isMenuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-4 rounded-full bg-current transition-opacity duration-200 ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-4 rounded-full bg-current transition-transform duration-200 ${
                  isMenuOpen ? "translate-y-[-7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          <div className="hidden lg:block">
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
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  fill
                  sizes="40px"
                  unoptimized
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
      </div>

      <div
        id="site-mobile-navigation"
        className={`lg:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <div className={`border-t px-4 py-4 ${isDark ? "border-white/15 bg-[#13161c]" : "border-black/10 bg-[#f8faf5]"}`}>
          <div className="grid gap-3">
            <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
              <button
                type="button"
                onClick={onToggleTheme}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.08em] transition ${
                  isDark ? "border-white/20 bg-[#1b1e24] text-white" : "border-black/10 bg-white text-[#10131a]"
                }`}
              >
                <span>{isDark ? "DARK" : "LIGHT"}</span>
                <span className={`relative h-4 w-8 rounded-full transition ${isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"}`}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full transition ${isDark ? "left-4 bg-[#0b1112]" : "left-0.5 bg-[#10131a]"}`} />
                </span>
              </button>

              {user ? (
                <Link
                  href="/my-profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.08em] transition ${
                    isDark ? "border-[#2ce88f]/35 bg-[#2ce88f]/10 text-[#8cf8c1]" : "border-[#0a8a5b]/20 bg-[#0a8a5b]/10 text-[#0a8a5b]"
                  }`}
                >
                  PROFILE
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2ce88f] px-3 py-2 text-[11px] font-bold tracking-[0.08em] text-[#0b1112]"
                >
                  SIGN IN
                </Link>
              )}
            </div>

            <div className={`rounded-3xl border p-4 ${isDark ? "border-white/10 bg-[#151922]" : "border-black/10 bg-white"}`}>
              <div className="grid w-full items-start gap-4 sm:gap-5" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
                <div className="min-w-0 w-full">
                  <p className={`text-[12px] font-bold tracking-[0.2em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>
                    EXPLORE
                  </p>
                  <div className="mt-3 grid min-w-0 gap-2">
                    {mobileExploreItems.map((item) => {
                      const isActive = activeHref === item.href || (item.href === "/public-feed" && activeHref?.startsWith("/public-feed"));

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`rounded-xl px-2.5 py-2 text-[13px] font-semibold transition ${
                            isActive
                              ? isDark
                                ? "bg-[#2ce88f]/12 text-[#8cf8c1]"
                                : "bg-[#0a8a5b]/10 text-[#0a8a5b]"
                              : isDark
                                ? "text-white/82 hover:bg-white/8"
                                : "text-[#203022] hover:bg-[#f2f6ef]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0 w-full">
                  <p className={`text-[12px] font-bold tracking-[0.2em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>
                    COMMUNITY
                  </p>
                  <div className="mt-3 grid min-w-0 gap-2">
                    {mobileCommunityItems.map((item) => {
                      const isHiddenByAuth = (item.href === "/login" && !!user) || (item.href === "/my-profile" && !user);
                      if (isHiddenByAuth) return null;

                      const isActive = activeHref === item.href || (item.href === "/links" && activeHref?.startsWith("/links"));

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`rounded-xl px-2.5 py-2 text-[13px] font-semibold transition ${
                            isActive
                              ? isDark
                                ? "bg-[#2ce88f]/12 text-[#8cf8c1]"
                                : "bg-[#0a8a5b]/10 text-[#0a8a5b]"
                              : isDark
                                ? "text-white/82 hover:bg-white/8"
                                : "text-[#203022] hover:bg-[#f2f6ef]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

