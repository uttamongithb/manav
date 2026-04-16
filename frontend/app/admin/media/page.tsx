"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type MediaAsset = {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  updatedAt: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadMedia = async () => {
    if (!authHeaders) return;
    setIsLoading(true);
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/media`, { headers: authHeaders });
      if (!res.ok) throw new Error("fetch_failed");
      setAssets((await res.json()) as MediaAsset[]);
    } catch {
      setApiError("Unable to load media library.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const uploadFile = async (file: File | null) => {
    if (!authHeaders || !file) return;
    try {
      setIsUploading(true);
      setApiError(null);
      setSuccessMsg(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${backendUrl}/admin/media/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) throw new Error("upload_failed");
      setAssets((await res.json()) as MediaAsset[]);
      setSuccessMsg("Media uploaded successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to upload media.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAsset = async (filename: string) => {
    if (!authHeaders) return;
    try {
      setDeletingName(filename);
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/media/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("delete_failed");
      setAssets((await res.json()) as MediaAsset[]);
    } catch {
      setApiError("Unable to delete media file.");
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Upload and manage reusable media files for banners, profiles, and content pages.
        </p>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Upload Media</h2>
          <button type="button" className="admin-btn admin-btn-outline" onClick={loadMedia} disabled={isLoading}>
            Refresh
          </button>
        </div>
        <div className="admin-card-body" style={{ display: "grid", gap: 12 }}>
          <input
            type="file"
            accept="image/*,.pdf,.mp4,.webm,.svg"
            className="admin-input"
            onChange={(e) => void uploadFile(e.target.files?.[0] ?? null)}
            disabled={isUploading}
          />
          <p style={{ fontSize: 13, color: "#6c737f" }}>
            Upload images, PDFs, and video files. They are stored under the backend uploads folder.
          </p>
        </div>
      </div>

      <div className="admin-grid admin-grid-4">
        {isLoading ? (
          <div className="admin-card" style={{ padding: 24, color: "#6c737f" }}>
            Loading media...
          </div>
        ) : assets.length === 0 ? (
          <div className="admin-card" style={{ padding: 24, color: "#6c737f" }}>
            No media files uploaded yet.
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.filename} className="admin-card" style={{ overflow: "hidden" }}>
              {isImage(asset.mimeType) ? (
                <div style={{ height: 160, background: "#f3f4f6" }}>
                  <img
                    src={`${backendUrl}${asset.path}`}
                    alt={asset.filename}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", color: "#6c737f", fontWeight: 700 }}>
                  {asset.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                </div>
              )}
              <div className="admin-card-body" style={{ display: "grid", gap: 8 }}>
                <div>
                  <div className="admin-table-name" style={{ fontSize: 14 }}>{asset.filename}</div>
                  <div className="admin-table-sub" style={{ marginTop: 4 }}>{asset.mimeType}</div>
                </div>
                <div style={{ fontSize: 13, color: "#6c737f" }}>
                  {formatSize(asset.size)} • {new Date(asset.updatedAt).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a className="admin-btn admin-btn-outline admin-btn-sm" href={`${backendUrl}${asset.path}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => deleteAsset(asset.filename)}
                    disabled={deletingName === asset.filename}
                  >
                    {deletingName === asset.filename ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
