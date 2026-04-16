"use client";

import Link from "next/link";
import { ContentPageShell } from "@/app/components/content-page-shell";
import { usePageContent } from "@/app/lib/page-content";

export default function LinksPage() {
  const { content } = usePageContent("links");

  return (
    <ContentPageShell
      activeHref="/links"
      eyebrow="Links"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
      ctaLabel={content.ctaLabel || "Go to Profile"}
      ctaHref={content.ctaHref || "/my-profile"}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Home", href: "/" },
          { label: "Poets", href: "/poets" },
          { label: "Public Feed", href: "/public-feed" },
          { label: "Donate", href: "/donate" },
          { label: "Login", href: "/login" },
          { label: "My Profile", href: "/my-profile" },
          { label: "Archives", href: "/archives" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-[13px] font-semibold text-[#274129] transition hover:bg-[#edf4ea]">
            {item.label}
          </Link>
        ))}
      </div>
    </ContentPageShell>
  );
}

