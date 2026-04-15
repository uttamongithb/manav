"use client";

import { ContentPageShell } from "@/app/components/content-page-shell";

export default function ContactUsPage() {
  return (
    <ContentPageShell
      activeHref="/contact-us"
      eyebrow="Contact us"
      title="Get In Touch"
      subtitle="Whether you have feedback, collaboration ideas, or support questions, we would love to hear from you."
      sections={[
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
      ]}
      ctaLabel="Back to Home"
      ctaHref="/"
    />
  );
}
