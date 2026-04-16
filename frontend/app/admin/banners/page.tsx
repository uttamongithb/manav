"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type BannerSlide = {
  title: string;
  subtitle: string;
  image: string;
  tag: string;
};

type BannerConfigResponse = {
  slides: BannerSlide[];
  updatedAt: string | null;
  updatedBy: string | null;
};

const EMPTY_BANNER: BannerSlide = {
  title: "",
  subtitle: "",
  image: "",
  tag: "",
};

export default function BannersPage() {
  const [slides, setSlides] = useState<BannerSlide[]>([EMPTY_BANNER]);
  const [meta, setMeta] = useState<BannerConfigResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadBanners = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/banners`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as BannerConfigResponse;
      setSlides(data.slides?.length > 0 ? data.slides : [EMPTY_BANNER]);
      setMeta(data);
    } catch {
      setApiError("Unable to load banner configuration.");
    }
  };

  useEffect(() => {
    void loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const updateSlide = (index: number, field: keyof BannerSlide, value: string) => {
    setSlides((current) =>
      current.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const addSlide = () => setSlides((c) => [...c, { ...EMPTY_BANNER }]);

  const removeSlide = (index: number) =>
    setSlides((c) => c.filter((_, i) => i !== index));

  const moveSlide = (index: number, dir: -1 | 1) => {
    setSlides((current) => {
      const target = index + dir;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (!moved) return current;
      next.splice(target, 0, moved);
      return next;
    });
  };

  const saveBanners = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      setSuccessMsg(null);
      setIsSaving(true);
      const res = await fetch(`${backendUrl}/admin/banners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ slides }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as BannerConfigResponse;
      setSlides(data.slides.length > 0 ? data.slides : [EMPTY_BANNER]);
      setMeta(data);
      setSuccessMsg("Banners saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to save banner slides.");
    } finally {
      setIsSaving(false);
    }
  };

  const lastSaved = meta?.updatedAt
    ? new Date(meta.updatedAt).toLocaleString()
    : "Not saved yet";

  return (
    <>
      <div className="admin-page-header">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="admin-page-subtitle">
              Manage homepage hero banner slides. Changes go live after saving.
            </p>
            <p className="admin-meta-line">Last saved: {lastSaved}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={addSlide}
            >
              + Add Slide
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={saveBanners}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save All"}
            </button>
          </div>
        </div>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      <div className="admin-grid admin-grid-2">
        {slides.map((slide, index) => (
          <div key={`slide-${index}`} className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ fontSize: 15 }}>
                Slide {index + 1}
              </h3>
              <div className="admin-banner-card-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === slides.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => removeSlide(index)}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="admin-card-body">
              {/* Image preview */}
              {slide.image && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 140,
                    borderRadius: 10,
                    overflow: "hidden",
                    marginBottom: 14,
                    background: "#f3f4f6",
                  }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title || "Banner preview"}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    unoptimized
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="admin-banner-fields">
                <input
                  className="admin-input"
                  value={slide.title}
                  onChange={(e) => updateSlide(index, "title", e.target.value)}
                  placeholder="Slide title"
                />
                <input
                  className="admin-input"
                  value={slide.subtitle}
                  onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                  placeholder="Slide subtitle"
                />
                <input
                  className="admin-input"
                  value={slide.image}
                  onChange={(e) => updateSlide(index, "image", e.target.value)}
                  placeholder="Image URL"
                />
                <input
                  className="admin-input"
                  value={slide.tag}
                  onChange={(e) => updateSlide(index, "tag", e.target.value)}
                  placeholder="Tag label"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
