"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";
import { usePageContent } from "@/app/lib/page-content";

export default function AboutUsPage() {
  const { content } = usePageContent("about-us");

  return (
    <ContentPageShell
      activeHref="/about-us"
      eyebrow="About us"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
      ctaLabel={content.ctaLabel || "Explore Public Feed"}
      ctaHref="/"
    />
  );
}

