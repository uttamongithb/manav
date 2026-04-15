"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type PrivacyPolicyState = {
  content: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function PolicyPage() {
  const [policy, setPolicy] = useState<PrivacyPolicyState>({
    content: "",
    updatedAt: null,
    updatedBy: null,
  });
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadPolicy = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/privacy-policy`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as PrivacyPolicyState;
      setPolicy(data);
      setDraft(data.content || "");
    } catch {
      setApiError("Unable to load privacy policy.");
    }
  };

  useEffect(() => {
    void loadPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const savePolicy = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      setSuccessMsg(null);
      setIsSaving(true);
      const res = await fetch(`${backendUrl}/admin/privacy-policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ content: draft.trim() }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as PrivacyPolicyState;
      setPolicy(data);
      setDraft(data.content || "");
      setSuccessMsg("Privacy policy saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to save privacy policy.");
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;
  const lastSaved = policy.updatedAt
    ? new Date(policy.updatedAt).toLocaleString()
    : "Never";
  const hasChanges = draft !== (policy.content || "");

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
            <h1 className="admin-page-title">Privacy Policy</h1>
            <p className="admin-page-subtitle">
              Edit the site-wide privacy policy. Content is publicly visible at
              /privacy-policy.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={savePolicy}
            disabled={isSaving || !draft.trim()}
          >
            {isSaving ? "Saving…" : "Save Policy"}
          </button>
        </div>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      <div className="admin-grid admin-grid-8-4">
        {/* Editor */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Content Editor</h2>
            {hasChanges && (
              <span
                className="admin-badge pending"
                style={{ fontSize: 11 }}
              >
                <span className="admin-badge-dot" />
                Unsaved changes
              </span>
            )}
          </div>
          <div className="admin-card-body">
            <textarea
              className="admin-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write privacy policy content here…"
              style={{ minHeight: 420 }}
            />
          </div>
        </div>

        {/* Meta / Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title" style={{ fontSize: 15 }}>
                Document Info
              </h2>
            </div>
            <div className="admin-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6c737f",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    Last Saved
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111927",
                    }}
                  >
                    {lastSaved}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6c737f",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    Updated By
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111927",
                    }}
                  >
                    {policy.updatedBy || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title" style={{ fontSize: 15 }}>
                Statistics
              </h2>
            </div>
            <div className="admin-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6c737f",
                      fontWeight: 500,
                    }}
                  >
                    Word count
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111927",
                    }}
                  >
                    {wordCount}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6c737f",
                      fontWeight: 500,
                    }}
                  >
                    Characters
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111927",
                    }}
                  >
                    {charCount}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6c737f",
                      fontWeight: 500,
                    }}
                  >
                    Status
                  </span>
                  <span
                    className={`admin-badge ${hasChanges ? "pending" : "approved"}`}
                  >
                    <span className="admin-badge-dot" />
                    {hasChanges ? "Modified" : "Saved"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
