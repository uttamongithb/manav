"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";

export default function AboutUsPage() {
  return (
    <ContentPageShell
      activeHref="/about-us"
      eyebrow="About us"
      title="About Manav"
      subtitle="A literary platform designed to make poetry, prose, and thoughtful writing accessible, discoverable, and beautifully presented."
      sections={[
        {
          heading: "Who We Are",
          body: "Manav is a focused reading and writing space where classic voices and contemporary authors can be explored in one place. We blend editorial curation with a modern, distraction-light interface.",
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
      ]}
      ctaLabel="Explore Public Feed"
      ctaHref="/"
    />
  );
}
