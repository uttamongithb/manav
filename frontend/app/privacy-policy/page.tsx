"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentPageShell } from "@/app/components/content-page-shell";
import { getApiBaseUrl } from "@/app/lib/api-base";

type PrivacyPolicyResponse = {
  content: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function PrivacyPolicyPage() {
  const [policyText, setPolicyText] = useState(
    "Privacy policy has not been set yet.",
  );
  const backendUrl = getApiBaseUrl();

  useEffect(() => {
    let isMounted = true;

    const loadPolicy = async () => {
      try {
        const res = await fetch(`${backendUrl}/public/privacy-policy`);
        if (!res.ok) return;
        const data = (await res.json()) as PrivacyPolicyResponse;
        if (isMounted && data.content?.trim()) {
          setPolicyText(data.content.trim());
        }
      } catch {
        // Keep fallback copy when endpoint is unavailable.
      }
    };

    void loadPolicy();
    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const policySections = useMemo(() => {
    const chunks = policyText
      .split(/\n\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (chunks.length === 0) {
      return [
        {
          heading: "Policy",
          body: "Privacy policy has not been set yet.",
        },
      ];
    }

    return chunks.map((chunk, index) => ({
      heading: `Policy Section ${index + 1}`,
      body: chunk,
    }));
  }, [policyText]);

  return (
    <ContentPageShell
      activeHref="/privacy-policy"
      eyebrow="Privacy Policy"
      title="Your Data, Your Control"
      subtitle="This overview explains what information we store, why we store it, and how it is used to improve your literary experience."
      sections={policySections}
      ctaLabel="Read About Us"
      ctaHref="/about-us"
    />
  );
}
