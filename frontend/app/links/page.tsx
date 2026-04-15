"use client";

import Link from "next/link";
import { ContentPageShell } from "@/app/components/content-page-shell";

export default function LinksPage() {
  return (
    <>
      <ContentPageShell
        activeHref="/links"
        eyebrow="Links"
        title="Platform Navigation"
        subtitle="A quick jump table to major reading, writing, and profile areas across Manav."
        sections={[
          {
            heading: "Reading",
            body: "Browse Public Feed, Poets, and thematic sections to discover new voices and revisit timeless works.",
          },
          {
            heading: "Writing",
            body: "Use your profile composer to publish pieces across supported categories and manage visibility settings.",
          },
          {
            heading: "Community",
            body: "Follow writers, explore profile pages, and engage with contributions in section timelines.",
          },
          {
            heading: "Account",
            body: "Manage sign-in, profile updates, avatar settings, and personal information controls.",
          },
        ]}
        ctaLabel="Go to Profile"
        ctaHref="/my-profile"
      />

      <div className="mx-auto -mt-10 mb-10 w-[80vw] max-w-none px-1">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Home", href: "/" },
            { label: "Poets", href: "/poets" },
            { label: "Public Feed", href: "/public-feed" },
            { label: "Login", href: "/login" },
            { label: "My Profile", href: "/my-profile" },
            { label: "Archives", href: "/archives" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-[13px] font-semibold text-[#274129] transition hover:bg-[#edf4ea]">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
