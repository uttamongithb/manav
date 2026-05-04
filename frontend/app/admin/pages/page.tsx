"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";
import { DEFAULT_PAGE_CONTENTS, getDefaultPageContent, type PageContent, type PageSection } from "@/app/lib/page-content";
import { Upload } from "lucide-react";

const PAGE_SLUGS = Object.keys(DEFAULT_PAGE_CONTENTS);

type EditablePage = PageContent & {
  updatedAt?: string | null;
  updatedBy?: string | null;
};

function createBlankSection(): PageSection {
  return { heading: "", body: "" };
}

export default function AdminPagesPage() {
  const [activeSlug, setActiveSlug] = useState(PAGE_SLUGS[0] ?? "about-us");
  const [draft, setDraft] = useState<EditablePage>(() => getDefaultPageContent(PAGE_SLUGS[0] ?? "about-us"));
  const [meta, setMeta] = useState<EditablePage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadPage = async (slug: string) => {
    if (!authHeaders) return;
    setIsLoading(true);
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/page-content/${encodeURIComponent(slug)}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as EditablePage;
      setDraft({
        ...getDefaultPageContent(slug),
        ...data,
        sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : getDefaultPageContent(slug).sections,
      });
      setMeta(data);
    } catch {
      const fallback = getDefaultPageContent(slug);
      setDraft(fallback);
      setMeta(null);
      setApiError("Unable to load page content.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(activeSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug, authToken]);

  const updateSection = (index: number, field: keyof PageSection, value: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const uploadSectionImage = async (index: number, file: File | null) => {
    if (!authHeaders || !file) return;
    try {
      setApiError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${backendUrl}/admin/pages/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) throw new Error("upload_failed");
      const data = await res.json();
      updateSection(index, "imageUrl", data.imageUrl);
    } catch {
      setApiError("Unable to upload image for section.");
    }
  };

  const addSection = () => {
    setDraft((current) => ({
      ...current,
      sections: [...current.sections, createBlankSection()],
    }));
  };

  const removeSection = (index: number) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }));
  };

  const savePage = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      setSuccessMsg(null);
      setIsSaving(true);
      const res = await fetch(`${backendUrl}/admin/page-content/${encodeURIComponent(activeSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title: draft.title,
          subtitle: draft.subtitle,
          ctaLabel: draft.ctaLabel,
          ctaHref: draft.ctaHref,
          sections: draft.sections,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as EditablePage;
      setDraft({
        ...getDefaultPageContent(activeSlug),
        ...data,
        sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : getDefaultPageContent(activeSlug).sections,
      });
      setMeta(data);
      setSuccessMsg("Page content saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to save page content.");
    } finally {
      setIsSaving(false);
    }
  };

  const lastSaved = meta?.updatedAt ? new Date(meta.updatedAt).toLocaleString() : "Never";

  return (
    <>
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Edit site pages from one place. These values drive the public About, Links, Archives, and Ebook screens.
        </p>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {PAGE_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setActiveSlug(slug)}
            className={`admin-btn ${activeSlug === slug ? "admin-btn-primary" : "admin-btn-outline"}`}
          >
            {slug.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      <div className="admin-grid admin-grid-8-4">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">{activeSlug.replace(/-/g, " ")}</h2>
            <span className="admin-badge pending">
              <span className="admin-badge-dot" />
              Last saved {lastSaved}
            </span>
          </div>

          <div className="admin-card-body" style={{ display: "grid", gap: 16 }}>
            {isLoading ? (
              <div style={{ color: "#6c737f" }}>Loading page...</div>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Title</span>
              <input
                className="admin-input"
                value={draft.title}
                onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                placeholder="Page title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Subtitle</span>
              <textarea
                className="admin-textarea"
                value={draft.subtitle}
                onChange={(e) => setDraft((current) => ({ ...current, subtitle: e.target.value }))}
                placeholder="Page subtitle"
                style={{ minHeight: 120 }}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">CTA Label</span>
                <input
                  className="admin-input"
                  value={draft.ctaLabel || ""}
                  onChange={(e) => setDraft((current) => ({ ...current, ctaLabel: e.target.value }))}
                  placeholder="Button label"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">CTA Link</span>
                <input
                  className="admin-input"
                  value={draft.ctaHref || ""}
                  onChange={(e) => setDraft((current) => ({ ...current, ctaHref: e.target.value }))}
                  placeholder="/path"
                />
              </label>
            </div>

            <div className="admin-card" style={{ padding: 0, border: "1px solid #e6ece3" }}>
              <div className="admin-card-header" style={{ borderBottom: "1px solid #e6ece3" }}>
                <h3 className="admin-card-title" style={{ fontSize: 15 }}>Sections</h3>
                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={addSection}>
                  + Add Section
                </button>
              </div>

              <div style={{ padding: 18, display: "grid", gap: 14 }}>
                {draft.sections.map((section, index) => (
                  <div key={`${activeSlug}-${index}`} className="admin-card" style={{ padding: 16 }}>
                    <div className="admin-card-header" style={{ marginBottom: 12 }}>
                      <h4 className="admin-card-title" style={{ fontSize: 14 }}>Section {index + 1}</h4>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => removeSection(index)}
                        disabled={draft.sections.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: 12 }}>
                      <input
                        className="admin-input"
                        value={section.heading}
                        onChange={(e) => updateSection(index, "heading", e.target.value)}
                        placeholder="Section heading"
                      />
                      <textarea
                        className="admin-textarea"
                        value={section.body}
                        onChange={(e) => updateSection(index, "body", e.target.value)}
                        placeholder="Section body"
                        style={{ minHeight: 110 }}
                      />
                      
                      {/* Image Upload for Section */}
                      <div style={{ borderTop: "1px solid #e6ece3", paddingTop: 12 }}>
                        <label className="block">
                          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Section Image</span>
                          {section.imageUrl && (
                            <div style={{ position: "relative", width: "100%", height: 120, borderRadius: 8, overflow: "hidden", marginBottom: 8, background: "#f3f4f6" }}>
                              <Image
                                src={section.imageUrl}
                                alt="Section preview"
                                fill
                                style={{ objectFit: "cover" }}
                                unoptimized
                              />
                            </div>
                          )}
                          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, border: "2px dashed #d0d5dd", borderRadius: 8, cursor: "pointer", background: "#fafbfc" }}>
                            <Upload style={{ width: 16, height: 16, color: "#6c737f" }} />
                            <span style={{ fontSize: 13, color: "#6c737f" }}>Click to upload image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => void uploadSectionImage(index, e.target.files?.[0] ?? null)}
                              style={{ display: "none" }}
                            />
                          </label>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title" style={{ fontSize: 15 }}>Live Preview</h2>
            </div>
            <div className="admin-card-body">
              <p className="admin-page-subtitle" style={{ marginBottom: 10 }}>{draft.subtitle}</p>
              <div style={{ display: "grid", gap: 10 }}>
                {draft.sections.map((section) => (
                  <div key={section.heading || Math.random().toString(36)} style={{ borderRadius: 16, border: "1px solid #e6ece3", padding: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: section.imageUrl ? "1fr 1fr" : "1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{section.heading || "Untitled section"}</div>
                        <div style={{ fontSize: 13, color: "#6c737f", lineHeight: 1.7 }}>{section.body || "Section text"}</div>
                      </div>
                      {section.imageUrl && (
                        <div style={{ position: "relative", height: 140, borderRadius: 8, overflow: "hidden", background: "#f3f4f6" }}>
                          <Image
                            src={section.imageUrl}
                            alt={section.heading}
                            fill
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title" style={{ fontSize: 15 }}>Actions</h2>
            </div>
            <div className="admin-card-body" style={{ display: "grid", gap: 12 }}>
              <button type="button" className="admin-btn admin-btn-primary" onClick={savePage} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Page"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => void loadPage(activeSlug)}
                disabled={isLoading}
              >
                Reload from Server
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
