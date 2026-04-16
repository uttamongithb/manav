"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteNavbar } from "@/app/components/site-navbar";
import { SiteFooter } from "@/app/components/site-footer";
import { useTheme } from "@/app/context/theme";
import type { ReactNode } from "react";

type PageSection = {
  heading: string;
  body: string;
};

type ContentPageShellProps = {
  activeHref: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: PageSection[];
  ctaLabel?: string;
  ctaHref?: string;
  children?: ReactNode;
};

const createHeroImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/850`;

const createHeroFallback = (title: string) => {
  const safeTitle = title.replace(/[&<>"']/g, "");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1b2431"/><stop offset="100%" stop-color="#0f766e"/></linearGradient></defs><rect width="1200" height="850" fill="url(#g)"/><circle cx="980" cy="170" r="160" fill="rgba(255,255,255,0.08)"/><circle cx="220" cy="720" r="210" fill="rgba(255,255,255,0.06)"/><text x="70" y="730" fill="rgba(255,255,255,0.92)" font-family="Georgia, serif" font-size="64">${safeTitle}</text></svg>`
  )}`;
};

export function ContentPageShell({
  activeHref,
  eyebrow,
  title,
  subtitle,
  sections,
  ctaLabel = "Back to Home",
  ctaHref = "/",
  children,
}: ContentPageShellProps) {
  const { isDark, setIsDark } = useTheme();
  const chips = sections.slice(0, 5).map((section) => section.heading);
  const heroImage = createHeroImage(`${activeHref}-${title}`);

  return (
    <main className={`relative min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} activeHref={activeHref} />

      <section className="mx-auto grid w-[80vw] max-w-none gap-6 px-1 py-6 md:grid-cols-12 md:py-10">
        <div className="md:col-span-12">
          <header className={`overflow-hidden rounded-4xl border ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
            <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
              <div className="p-6 md:p-8">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5e775f]"}`}>
                  {eyebrow}
                </p>
                <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] md:text-[50px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  {title}
                </h1>
                <p className={`mt-3 text-[15px] leading-relaxed ${isDark ? "text-white/68" : "text-[#496048]"}`}>
                  {subtitle}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {chips.map((chip, index) => {
                    const active = index === 0;
                    return (
                      <span
                        key={chip}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] ${
                          active
                            ? isDark
                              ? "border-[#8cf8c1]/45 bg-[#2ce88f] text-[#09120d]"
                              : "border-[#0a8a5b]/35 bg-[#0a8a5b] text-white"
                            : isDark
                              ? "border-white/12 bg-transparent text-white/75"
                              : "border-black/10 bg-transparent text-[#4f684f]"
                        }`}
                      >
                        {chip}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="relative min-h-72">
                <Image
                  src={heroImage}
                  alt={`${title} featured image`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  unoptimized
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = createHeroFallback(title);
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">Featured</p>
                  <h2 className="mt-1 text-[24px] font-semibold leading-tight">{title}</h2>
                  <Link
                    href={ctaHref}
                    className="mt-2 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-white transition hover:bg-white/20"
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.heading} className={`rounded-3xl border p-5 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white/94"}`}>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  {section.heading}
                </h2>
                <p className={`mt-3 text-[14px] leading-7 ${isDark ? "text-white/78" : "text-[#355138]"}`}>
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          {children ? <div className="mt-5">{children}</div> : null}
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  );
}
