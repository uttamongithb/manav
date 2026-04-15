"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";

export default function EbookDownloadPage() {
  return (
    <ContentPageShell
      activeHref="/ebook-download"
      eyebrow="EBook Download"
      title="Digital Reading Library"
      subtitle="Access downloadable reading formats, curated collections, and extended literary resources."
      sections={[
        {
          heading: "Curated Packs",
          body: "Discover editor-picked bundles organized by style, era, and theme for a structured reading journey.",
        },
        {
          heading: "Format Access",
          body: "Support for reader-friendly digital formats is designed to keep typography, spacing, and chapter rhythm intact.",
        },
        {
          heading: "Offline Experience",
          body: "Use downloadable content for uninterrupted reading and revisit your library without network dependency.",
        },
        {
          heading: "Collections",
          body: "Move from short-form selections to full anthologies with coherent classification and discoverability.",
        },
      ]}
      ctaLabel="Open E-Books Section"
      ctaHref="/e-books"
    />
  );
}
