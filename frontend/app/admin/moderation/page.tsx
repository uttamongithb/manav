"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type PendingPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  createdAt: string;
};

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ModerationPage() {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadPosts = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/posts/pending`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("fetch_failed");
      setPosts((await res.json()) as PendingPost[]);
    } catch {
      setApiError("Unable to load pending posts.");
    }
  };

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const approvePost = async (postId: string) => {
    if (!authHeaders) return;
    try {
      setApprovingId(postId);
      setSuccessMsg(null);
      const res = await fetch(`${backendUrl}/admin/posts/${postId}/approve`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("approve_failed");
      setPosts((c) => c.filter((p) => p.id !== postId));
      setSuccessMsg("Post approved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError("Unable to approve post.");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = posts.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.author.toLowerCase().includes(q) ||
      p.section.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Moderation</h1>
        <p className="admin-page-subtitle">
          Review and approve pending content before it goes live.
        </p>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}
      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div className="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by author, section, or content…"
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={loadPosts}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ width: 16, height: 16 }}
            >
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
          <span
            className="admin-badge pending"
            style={{ alignSelf: "center" }}
          >
            <span className="admin-badge-dot" />
            {filtered.length} pending
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input type="checkbox" style={{ width: 16, height: 16, cursor: "pointer" }} />
                </th>
                <th>Author</th>
                <th>Section</th>
                <th>Preview</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "48px 16px",
                      color: "#9da4ae",
                    }}
                  >
                    {posts.length === 0
                      ? "No pending posts — all clear!"
                      : "No results match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <input type="checkbox" style={{ width: 16, height: 16, cursor: "pointer" }} />
                    </td>
                    <td>
                      <div className="admin-table-user">
                        <div
                          className="admin-table-avatar"
                          style={{
                            background: "#ede9fe",
                            color: "#635bff",
                          }}
                        >
                          {post.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-table-name">{post.author}</div>
                          <div className="admin-table-sub">
                            {post.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge pending">
                        <span className="admin-badge-dot" />
                        {post.section}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6c737f",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.content.length > 120
                          ? `${post.content.slice(0, 120).trim()}…`
                          : post.content}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "#6c737f" }}>
                      {formatDate(post.createdAt)}
                    </td>
                    <td>
                      <span className="admin-badge pending">
                        <span className="admin-badge-dot" />
                        Pending
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => approvePost(post.id)}
                        disabled={approvingId === post.id}
                      >
                        {approvingId === post.id ? "Approving…" : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
