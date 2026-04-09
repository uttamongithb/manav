"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/auth";

type SiteNavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  activeHref?: string;
};

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

          <Link
            href={user ? "/my-profile" : "/login"}
            className="rounded-full bg-[#2ce88f] px-4 py-2 text-[12px] font-bold tracking-[0.08em] text-[#0b1112] transition hover:bg-[#45f39f]"
          >
            {user ? "PROFILE" : "SIGN IN"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
