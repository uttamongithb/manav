"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/context/theme";
import { getApiBaseUrl } from "@/app/lib/api-base";
import { SiteNavbar } from "@/app/components/site-navbar";
import { POETS, PoetGroup } from "@/app/lib/poets-data";

type GroupFilter = "All" | PoetGroup;

const GROUP_FILTERS: Array<{ label: string; value: GroupFilter }> = [
  { label: "All", value: "All" },
  { label: "Classical", value: "Classical" },
  { label: "Modern", value: "Modern" },
  { label: "Women", value: "Women" },
  { label: "Contemporary", value: "Contemporary" },
];

const createHeroFallback = (name: string) => {
  const safeName = name.replace(/[&<>"']/g, "");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1b2431"/><stop offset="100%" stop-color="#0f766e"/></linearGradient></defs><rect width="1200" height="850" fill="url(#g)"/><circle cx="980" cy="170" r="160" fill="rgba(255,255,255,0.08)"/><circle cx="220" cy="720" r="210" fill="rgba(255,255,255,0.06)"/><text x="70" y="730" fill="rgba(255,255,255,0.92)" font-family="Georgia, serif" font-size="64">${safeName}</text></svg>`
  )}`;
};

export default function PoetsPage() {
  const { isDark, setIsDark } = useTheme();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("All");
  const [poets, setPoets] = useState(POETS);

  const backendUrl = getApiBaseUrl();

  useEffect(() => {
    let isMounted = true;

    const loadPoets = async () => {
      try {
        const res = await fetch(`${backendUrl}/public/poets`);
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as typeof POETS;
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPoets(data);
        }
      } catch {
        // Keep local fallback poets.
      }
    };

    void loadPoets();

    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const filteredPoets = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return poets.filter((poet) => {
      const matchFilter = groupFilter === "All" || poet.group.includes(groupFilter);
      const matchQuery =
        normalized.length === 0 ||
        [poet.name, poet.location, poet.shortBio, poet.signatureLine]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchFilter && matchQuery;
    });
  }, [groupFilter, poets, query]);

  const featuredPoet = filteredPoets[0] ?? poets[0] ?? POETS[0];

  return (
    <main className={`relative min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} activeHref="/poets" />

      <section className="mx-auto grid w-[80vw] max-w-none gap-6 px-1 py-6 md:grid-cols-12 md:py-10">
        <div className="md:col-span-12">
          <section
            className={`rounded-[26px] border p-5 md:p-6 ${
              isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"
            } mb-6 md:mb-7`}
          >
            <div className="grid gap-5 md:grid-cols-[1.25fr_0.75fr] md:items-end">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-white/45" : "text-[#617860]"}`}>
                  Search Poets
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
                    placeholder="Search name, city, or line"
                    className={`w-full bg-transparent text-[14px] outline-none ${isDark ? "placeholder:text-white/35" : "placeholder:text-[#7e907d]"}`}
                  />
                </div>
                <p className={`mt-3 text-[12px] ${isDark ? "text-white/55" : "text-[#6a7f68]"}`}>
                  Showing {filteredPoets.length} poets
                </p>
              </div>

              <div className={`md:border-l md:pl-5 ${isDark ? "md:border-white/10" : "md:border-black/10"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-[#b8f7d8]" : "text-[#0b7a52]"}`}>
                  Poetry Journey
                </p>
                <p className={`mt-2 text-[14px] leading-relaxed ${isDark ? "text-white/85" : "text-[#2b4a3f]"}`}>
                  Start from classical masters, move to modern voices, and then read contemporary poets to trace how form and emotion evolve over time.
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

          <header className={`overflow-hidden rounded-4xl border ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
            <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
              <div className="p-6 md:p-8">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5e775f]"}`}>
                  Poets Archive
                </p>
                <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] md:text-[50px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  Explore Poets,
                  <br />
                  Voices, and Verse.
                </h1>
                <p className={`mt-3 text-[15px] leading-relaxed ${isDark ? "text-white/68" : "text-[#496048]"}`}>
                  A curated literary directory to discover poets by era, style, and influence. Read signature lines, browse representative forms, and move quickly across traditions.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {GROUP_FILTERS.map((item) => {
                    const active = item.value === groupFilter;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGroupFilter(item.value)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition ${
                          active
                            ? isDark
                              ? "border-[#8cf8c1]/45 bg-[#2ce88f] text-[#09120d]"
                              : "border-[#0a8a5b]/35 bg-[#0a8a5b] text-white"
                            : isDark
                              ? "border-white/12 bg-transparent text-white/75 hover:bg-white/8"
                              : "border-black/10 bg-transparent text-[#4f684f] hover:bg-[#ebf3e9]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative min-h-72">
                <img
                  src={featuredPoet.heroImage}
                  alt={featuredPoet.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = createHeroFallback(featuredPoet.name);
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">Featured Poet</p>
                  <h2 className="mt-1 text-[24px] font-semibold leading-tight">
                    <Link href={`/poets/${featuredPoet.id}`} className="hover:underline">
                      {featuredPoet.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-[12px] text-white/85">{featuredPoet.years} • {featuredPoet.location}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-5 space-y-4">
            {filteredPoets.map((poet) => (
              <article key={poet.id} className={`rounded-3xl border p-5 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white/94"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <Link href={`/poets/${poet.id}`}>
                        <img src={poet.avatarUrl} alt={poet.name} className="h-14 w-14 shrink-0 rounded-full border object-cover" />
                      </Link>
                      <div className="min-w-0">
                        <h3 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                          <Link href={`/poets/${poet.id}`} className="hover:underline">
                            {poet.name}
                          </Link>
                        </h3>
                        <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#6d836c]"}`}>{poet.years} • {poet.location}</p>
                      </div>
                    </div>

                    <p className={`mt-3 text-[14px] leading-6 ${isDark ? "text-white/78" : "text-[#355138]"}`}>{poet.shortBio}</p>

                    <blockquote className={`mt-3 border-l-2 pl-3 text-[13px] italic ${isDark ? "border-white/20 text-white/70" : "border-black/20 text-[#5c735c]"}`}>
                      {poet.signatureLine}
                    </blockquote>
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2 md:w-56">
                    <div className={`rounded-xl border px-2 py-2 text-center ${isDark ? "border-white/12" : "border-black/10"}`}>
                      <p className="text-[15px] font-semibold">{poet.stats.sher}</p>
                      <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/50" : "text-[#6f846e]"}`}>Sher</p>
                    </div>
                    <div className={`rounded-xl border px-2 py-2 text-center ${isDark ? "border-white/12" : "border-black/10"}`}>
                      <p className="text-[15px] font-semibold">{poet.stats.ghazal}</p>
                      <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/50" : "text-[#6f846e]"}`}>Ghazal</p>
                    </div>
                    <div className={`rounded-xl border px-2 py-2 text-center ${isDark ? "border-white/12" : "border-black/10"}`}>
                      <p className="text-[15px] font-semibold">{poet.stats.nazm}</p>
                      <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/50" : "text-[#6f846e]"}`}>Nazm</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
}
