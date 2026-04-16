"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";
import { usePageContent } from "@/app/lib/page-content";

export default function EbookDownloadPage() {
  const { content } = usePageContent("ebook-download");

  return (
    <ContentPageShell
      activeHref="/ebook-download"
      eyebrow="EBook Download"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
      ctaLabel={content.ctaLabel || "Open E-Books Section"}
      ctaHref={content.ctaHref || "/e-books"}
    />
  );
}
