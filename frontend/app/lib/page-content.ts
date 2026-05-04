"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "./api-base";

export type PageSection = {
  heading: string;
  body: string;
  imageUrl?: string;
};

export type PageContent = {
  slug: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  sections: PageSection[];
  updatedAt?: string | null;
  updatedBy?: string | null;
};

const DEFAULT_PAGE_CONTENTS: Record<string, PageContent> = {
  "about-us": {
    slug: "about-us",
    title: "About INSAAN",
    subtitle:
      "A literary platform designed to make poetry, prose, and thoughtful writing accessible, discoverable, and beautifully presented.",
    sections: [
      {
        heading: "Who We Are",
        body: "INSAAN is a focused reading and writing space where classic voices and contemporary authors can be explored in one place. We blend editorial curation with a modern, distraction-light interface.",
      },
      {
        heading: "What We Build",
        body: "From short-form sher to long-form essays, our product experience is built around clarity, visual rhythm, and meaningful discovery so readers can move naturally across literary formats.",
      },
      {
        heading: "Our Design Ethos",
        body: "We prioritize elegance and readability. Typography, spacing, and color are tuned to support long reading sessions while keeping navigation quick and intuitive.",
      },
      {
        heading: "Community First",
        body: "Writers and readers grow this ecosystem together. Every section, profile, and timeline component is designed to celebrate voice, context, and literary depth.",
      },
    ],
  },
  "contact-us": {
    slug: "contact-us",
    title: "Get In Touch",
    subtitle:
      "Whether you have feedback, collaboration ideas, or support questions, we would love to hear from you.",
    sections: [
      {
        heading: "General Support",
        body: "For account help, sign-in issues, or profile-related questions, contact our support team with a short description and screenshots when possible.",
      },
      {
        heading: "Editorial & Partnerships",
        body: "If you are a publisher, literary group, or editor interested in collaboration, reach out with your proposal and publishing goals.",
      },
      {
        heading: "Response Time",
        body: "Most messages receive a response within 24 to 48 hours on business days. We prioritize critical account and platform access concerns first.",
      },
      {
        heading: "Best Contact Channel",
        body: "Use your registered email when contacting us so we can verify account context quickly and provide faster resolution.",
      },
    ],
    ctaLabel: "Back to Home",
    ctaHref: "/",
  },
  links: {
    slug: "links",
    title: "Platform Navigation",
    subtitle: "A quick jump table to major reading, writing, and profile areas across INSAAN.",
    sections: [
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
    ],
    ctaLabel: "Go to Profile",
    ctaHref: "/my-profile",
  },
  archives: {
    slug: "archives",
    title: "Literary Archives",
    subtitle: "An indexed historical layer of writings, references, and curated records across the platform.",
    sections: [
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
    ],
    ctaLabel: "Explore More",
    ctaHref: "/more",
  },
  "ebook-download": {
    slug: "ebook-download",
    title: "Digital Reading Library",
    subtitle: "Access downloadable reading formats, curated collections, and extended literary resources.",
    sections: [
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
    ],
    ctaLabel: "Open E-Books Section",
    ctaHref: "/e-books",
  },
};

export function getDefaultPageContent(slug: string): PageContent {
  const normalized = slug.trim().toLowerCase();
  return (
    DEFAULT_PAGE_CONTENTS[normalized] ?? {
      slug: normalized,
      title: "INSAAN Page",
      subtitle: "Editable content page.",
      sections: [],
    }
  );
}

export function usePageContent(slug: string) {
  const [content, setContent] = useState<PageContent>(() => getDefaultPageContent(slug));
  const [isLoading, setIsLoading] = useState(true);

  const backendUrl = getApiBaseUrl();

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${backendUrl}/public/page-content/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as PageContent;
        if (isMounted && data?.title) {
          setContent({
            ...getDefaultPageContent(slug),
            ...data,
            slug: data.slug || slug,
            sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : getDefaultPageContent(slug).sections,
          });
        }
      } catch {
        // Keep the fallback content when the backend is not reachable.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [backendUrl, slug]);

  return { content, isLoading };
}

export { DEFAULT_PAGE_CONTENTS };
