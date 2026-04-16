"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";
import { usePageContent } from "@/app/lib/page-content";

export default function ArchivesPage() {
  const { content } = usePageContent("archives");

  return (
    <ContentPageShell
      activeHref="/archives"
      eyebrow="Archives"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
      ctaLabel={content.ctaLabel || "Explore More"}
      ctaHref={content.ctaHref || "/more"}
    />
  );
}
