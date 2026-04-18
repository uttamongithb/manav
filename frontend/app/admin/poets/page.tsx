"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type Poet = {
  id: string;
  name: string;
  years: string;
  location: string;
  avatarUrl: string;
  heroImage: string;
  group: string[];
  shortBio: string;
  signatureLine: string;
  stats: {
    sher: number;
    ghazal: number;
    nazm: number;
  };
};

const EMPTY_POET: Poet = {
  id: "",
  name: "",
  years: "",
  location: "",
  avatarUrl: "",
  heroImage: "",
  group: ["Contemporary"],
  shortBio: "",
  signatureLine: "",
  stats: { sher: 0, ghazal: 0, nazm: 0 },
};

function clonePoet(poet: Poet): Poet {
  return {
    ...poet,
    group: [...poet.group],
    stats: { ...poet.stats },
  };
}

export default function AdminPoetsPage() {
  const [poets, setPoets] = useState<Poet[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadPoets = async () => {
    if (!authHeaders) return;
    setIsLoading(true);
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/poets`, { headers: authHeaders });
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as Poet[];
      setPoets(data.length > 0 ? data : [clonePoet(EMPTY_POET)]);
      setActiveIndex(0);
    } catch {
      setApiError("Unable to load poet records.");
      setPoets([clonePoet(EMPTY_POET)]);
      setActiveIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPoets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const updateActivePoet = <K extends keyof Poet>(field: K, value: Poet[K]) => {
    setPoets((current) =>
      current.map((poet, index) => (index === activeIndex ? { ...poet, [field]: value } : poet)),
    );
  };

  const updateStat = (field: keyof Poet["stats"], value: string) => {
    const parsed = Number.parseInt(value || "0", 10);
    setPoets((current) =>
      current.map((poet, index) =>
        index === activeIndex
          ? {
              ...poet,
              stats: {
                ...poet.stats,
                [field]: Number.isFinite(parsed) ? parsed : 0,
              },
            }
          : poet,
      ),
    );
  };

  const updateGroups = (value: string) => {
    const groups = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setPoets((current) =>
      current.map((poet, index) =>
        index === activeIndex ? { ...poet, group: groups.length > 0 ? groups : ["Contemporary"] } : poet,
      ),
    );
  };

  const addPoet = () => {
    setPoets((current) => [...current, clonePoet({ ...EMPTY_POET })]);
    setActiveIndex(poets.length);
  };

  const removePoet = (index: number) => {
    setPoets((current) => {
      const next = current.filter((_, poetIndex) => poetIndex !== index);
      return next.length > 0 ? next : [clonePoet(EMPTY_POET)];
    });
    setActiveIndex((current) => Math.max(0, current - (current >= index ? 1 : 0)));
  };

  const savePoets = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      setSuccessMsg(null);
      setIsSaving(true);
      const res = await fetch(`${backendUrl}/admin/poets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ poets }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as Poet[];
      setPoets(data.length > 0 ? data : [clonePoet(EMPTY_POET)]);
      setActiveIndex(0);
      setSuccessMsg("Poet directory saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to save poet directory.");
    } finally {
      setIsSaving(false);
    }
  };

  const activePoet = poets[activeIndex] ?? poets[0] ?? EMPTY_POET;

  return (
    <>
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Manage the poets directory, featured profiles, and the public poet profile data.
        </p>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={addPoet}>
            + Add Poet
          </button>
          <button type="button" className="admin-btn admin-btn-outline" onClick={loadPoets}>
            Reload
          </button>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={savePoets} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Directory"}
        </button>
      </div>

      <div className="admin-grid admin-grid-8-4">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Poet List</h2>
            <span className="admin-badge pending">
              <span className="admin-badge-dot" />
              {poets.length} records
            </span>
          </div>

          <div className="admin-card-body" style={{ display: "grid", gap: 12 }}>
            {isLoading ? (
              <div style={{ color: "#6c737f" }}>Loading poets...</div>
            ) : null}
            {poets.map((poet, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={poet.id || `poet-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="admin-card"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderColor: selected ? "#2ce88f" : "#e6ece3",
                    background: selected ? "rgba(44,232,143,0.08)" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="admin-table-avatar" style={{ background: "#e6f9ef", color: "#0a8a5b" }}>
                      {(poet.name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="admin-table-name">{poet.name || "Untitled poet"}</div>
                      <div className="admin-table-sub" style={{ marginTop: 3 }}>
                        {poet.location || "No location"} • {poet.years || "No years"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Editor</h2>
            <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removePoet(activeIndex)} disabled={poets.length === 1}>
              Remove Poet
            </button>
          </div>

          <div className="admin-card-body" style={{ display: "grid", gap: 14 }}>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">ID</span>
              <input className="admin-input" value={activePoet.id} onChange={(e) => updateActivePoet("id", e.target.value)} placeholder="poet-id" />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Name</span>
              <input className="admin-input" value={activePoet.name} onChange={(e) => updateActivePoet("name", e.target.value)} placeholder="Poet name" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Years</span>
                <input className="admin-input" value={activePoet.years} onChange={(e) => updateActivePoet("years", e.target.value)} placeholder="Birth - Death" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Location</span>
                <input className="admin-input" value={activePoet.location} onChange={(e) => updateActivePoet("location", e.target.value)} placeholder="City" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Avatar URL</span>
                <input className="admin-input" value={activePoet.avatarUrl} onChange={(e) => updateActivePoet("avatarUrl", e.target.value)} placeholder="https://..." />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Hero Image URL</span>
                <input className="admin-input" value={activePoet.heroImage} onChange={(e) => updateActivePoet("heroImage", e.target.value)} placeholder="https://..." />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Groups</span>
              <input
                className="admin-input"
                value={activePoet.group.join(", ")}
                onChange={(e) => updateGroups(e.target.value)}
                placeholder="Classical, Modern"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Short Bio</span>
              <textarea className="admin-textarea" value={activePoet.shortBio} onChange={(e) => updateActivePoet("shortBio", e.target.value)} placeholder="Short bio" style={{ minHeight: 90 }} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Signature Line</span>
              <textarea className="admin-textarea" value={activePoet.signatureLine} onChange={(e) => updateActivePoet("signatureLine", e.target.value)} placeholder="Signature line" style={{ minHeight: 90 }} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Sher</span>
                <input className="admin-input" type="number" value={activePoet.stats.sher} onChange={(e) => updateStat("sher", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Ghazal</span>
                <input className="admin-input" type="number" value={activePoet.stats.ghazal} onChange={(e) => updateStat("ghazal", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Nazm</span>
                <input className="admin-input" type="number" value={activePoet.stats.nazm} onChange={(e) => updateStat("nazm", e.target.value)} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
