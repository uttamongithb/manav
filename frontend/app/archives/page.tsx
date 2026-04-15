"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";

export default function ArchivesPage() {
  return (
    <ContentPageShell
      activeHref="/archives"
      eyebrow="Archives"
      title="Literary Archives"
      subtitle="An indexed historical layer of writings, references, and curated records across the platform."
      sections={[
        {
          heading: "Classic Collections",
          body: "Explore enduring works organized for easy retrieval across poets, genres, and historical periods.",
        },
        {
          heading: "Thematic Index",
          body: "Navigate by motifs, emotions, and literary structures to discover contextually related writing.",
        },
        {
          heading: "Timeline View",
          body: "Trace movement across eras by following curated progression from foundational voices to modern expression.",
        },
        {
          heading: "Reference Utility",
          body: "Use archives for research, study, and rediscovery with a reading-first interface and stable organization.",
        },
      ]}
      ctaLabel="Explore More"
      ctaHref="/more"
    />
  );
}
