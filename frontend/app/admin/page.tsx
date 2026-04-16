"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";
import Link from "next/link";

type DashboardSummary = {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  publishedPosts: number;
  bannerSlides: number;
  unreadMessages: number;
  totalPoets: number;
  totalPages: number;
};

type PendingPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  createdAt: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SECTION_COLORS = [
  "#635bff",
  "#2ce88f",
  "#f79009",
  "#06aed4",
  "#f04438",
  "#9c27b0",
  "#ff5722",
  "#607d8b",
];

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function postPreview(content: string, max = 60) {
  if (content.length <= max) return content;
  return `${content.slice(0, max).trim()}…`;
}

export default function AdminOverview() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () =>
      authToken
        ? { Authorization: `Bearer ${authToken}` }
        : undefined,
    [authToken],
  );

  const loadData = async () => {
    if (!authHeaders) return;
    try {
      setApiError(null);
      const [dashRes, pendingRes] = await Promise.all([
        fetch(`${backendUrl}/admin/dashboard`, { headers: authHeaders }),
        fetch(`${backendUrl}/admin/posts/pending`, { headers: authHeaders }),
      ]);

      if (!dashRes.ok || !pendingRes.ok) throw new Error("fetch_failed");

      setDashboard((await dashRes.json()) as DashboardSummary);
      setPendingPosts((await pendingRes.json()) as PendingPost[]);
    } catch {
      setApiError("Unable to load dashboard data. Ensure your account has admin role.");
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const approvePost = async (postId: string) => {
    if (!authHeaders) return;
    try {
      setApprovingId(postId);
      const res = await fetch(`${backendUrl}/admin/posts/${postId}/approve`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("approve_failed");
      setPendingPosts((c) => c.filter((p) => p.id !== postId));
      setDashboard((c) =>
        c
          ? {
              ...c,
              pendingPosts: Math.max(0, c.pendingPosts - 1),
              publishedPosts: c.publishedPosts + 1,
            }
          : c,
      );
    } catch {
      setApiError("Unable to approve post.");
    } finally {
      setApprovingId(null);
    }
  };

  // Build section distribution for donut chart
  const sectionMap = useMemo(() => {
    const map: Record<string, number> = {};
    pendingPosts.forEach((post) => {
      map[post.section] = (map[post.section] || 0) + 1;
    });
    return map;
  }, [pendingPosts]);

  const sectionEntries = Object.entries(sectionMap);
  const sectionTotal = sectionEntries.reduce((sum, [, count]) => sum + count, 0) || 1;

  // Build conic gradient for donut
  let gradientAngle = 0;
  const conicStops = sectionEntries.map(([, count], i) => {
    const pct = (count / sectionTotal) * 100;
    const color = SECTION_COLORS[i % SECTION_COLORS.length];
    const stop = `${color} ${gradientAngle}% ${gradientAngle + pct}%`;
    gradientAngle += pct;
    return stop;
  });
  const conicGradient =
    conicStops.length > 0
      ? `conic-gradient(${conicStops.join(", ")})`
      : "conic-gradient(#e5e7eb 0% 100%)";

  // Bar chart mock data (month-based counts)
  const monthlyData = useMemo(() => {
    const thisYear = MONTHS.map(() => Math.floor(Math.random() * 20) + 5);
    const lastYear = MONTHS.map(() => Math.floor(Math.random() * 15) + 3);

    // If we have real pending data, use it to populate current month
    if (dashboard) {
      const currentMonth = new Date().getMonth();
      thisYear[currentMonth] = dashboard.totalPosts || thisYear[currentMonth]!;
    }

    return { thisYear, lastYear };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.totalPosts]);

  const maxBarVal = Math.max(
    ...monthlyData.thisYear,
    ...monthlyData.lastYear,
    1,
  );

  const stats = [
    {
      label: "Total Users",
      value: dashboard?.totalUsers ?? "—",
      color: "green" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: "Total Posts",
      value: dashboard?.totalPosts ?? "—",
      color: "blue" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Pending Review",
      value: dashboard?.pendingPosts ?? "—",
      color: "orange" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Published",
      value: dashboard?.publishedPosts ?? "—",
      color: "purple" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Unread Messages",
      value: dashboard?.unreadMessages ?? "—",
      color: "orange" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H11.5l-5 3.75v-3.75H6.75A2.25 2.25 0 014.5 13.5v-6.75z" />
        </svg>
      ),
    },
    {
      label: "Poets",
      value: dashboard?.totalPoets ?? "—",
      color: "green" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6.75l4.5 2.625v5.25L12 17.25l-4.5-2.625v-5.25L12 6.75z" />
          <path d="M3.75 8.25L12 3.75l8.25 4.5M3.75 15.75L12 20.25l8.25-4.5" />
        </svg>
      ),
    },
    {
      label: "Editable Pages",
      value: dashboard?.totalPages ?? "—",
      color: "blue" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
  ];

  // Recent (latest approved) - for demo, reverse & slice pending
  const recentPublished = [...pendingPosts].reverse().slice(0, 5);

  return (
    <>
      {apiError && (
        <div className="admin-alert error">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ width: 20, height: 20, flexShrink: 0 }}
          >
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {apiError}
        </div>
      )}

      {/* ── Row 1: Stat Cards ────────────────────────────────── */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div>
              <p className="admin-stat-label">{s.label}</p>
              <p className="admin-stat-value">{s.value}</p>
              <div className="admin-stat-trend up">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: 16, height: 16 }}
                >
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                </svg>
                <span className="admin-stat-trend-text">Since last month</span>
              </div>
            </div>
            <div className={`admin-stat-icon ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Charts ────────────────────────────────────── */}
      <div className="admin-grid admin-grid-8-4" style={{ marginBottom: 24 }}>
        {/* Bar Chart — Posts Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Posts Activity</h2>
            <button
              type="button"
              className="admin-card-action"
              onClick={loadData}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Sync
            </button>
          </div>
          <div className="admin-card-body">
            <div className="admin-chart-bars">
              {MONTHS.map((m, i) => (
                <div key={m} className="admin-chart-bar-group">
                  <div
                    className="admin-chart-bar primary"
                    style={{
                      height: `${((monthlyData.thisYear[i] ?? 0) / maxBarVal) * 100}%`,
                    }}
                  />
                  <div
                    className="admin-chart-bar secondary"
                    style={{
                      height: `${((monthlyData.lastYear[i] ?? 0) / maxBarVal) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="admin-chart-labels">
              {MONTHS.map((m) => (
                <span key={m} className="admin-chart-label">
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="admin-card-footer">
            <Link href="/admin/moderation" className="admin-card-footer-link">
              Overview
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Donut Chart — Content Sections */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Content Sections</h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-donut-wrapper">
              <div
                className="admin-donut"
                style={{ background: conicGradient }}
              >
                <div className="admin-donut-hole" />
              </div>
              <div className="admin-donut-legend">
                {sectionEntries.length > 0 ? (
                  sectionEntries.map(([section, count], i) => (
                    <div key={section} className="admin-donut-legend-item">
                      <div
                        className="admin-donut-legend-icon"
                        style={{
                          background: `${SECTION_COLORS[i % SECTION_COLORS.length]}1a`,
                          color: SECTION_COLORS[i % SECTION_COLORS.length],
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="6" />
                        </svg>
                      </div>
                      <span className="admin-donut-legend-label">{section}</span>
                      <span className="admin-donut-legend-value">
                        {Math.round((count / sectionTotal) * 100)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <span
                    style={{ fontSize: 13, color: "#9da4ae", fontWeight: 500 }}
                  >
                    No section data yet
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent + Moderation ───────────────────────── */}
      <div className="admin-grid admin-grid-4-8">
        {/* Recent Posts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Recent Posts</h2>
          </div>
          <div className="admin-card-body">
            {recentPublished.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty-icon">📄</div>
                <div className="admin-empty-text">No recent posts</div>
              </div>
            ) : (
              <ul className="admin-recent-list">
                {recentPublished.map((post) => (
                  <li key={post.id} className="admin-recent-item">
                    <div className="admin-recent-thumb">📝</div>
                    <div className="admin-recent-info">
                      <div className="admin-recent-title">
                        {postPreview(post.content, 50)}
                      </div>
                      <div className="admin-recent-meta">
                        By {post.author} · {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="admin-card-footer">
            <Link href="/admin/moderation" className="admin-card-footer-link">
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Pending Moderation Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Pending Moderation</h2>
            <span className="admin-badge pending">
              <span className="admin-badge-dot" />
              {pendingPosts.length} pending
            </span>
          </div>
          <div className="admin-card-body" style={{ padding: "0" }}>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Section</th>
                    <th>Preview</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "32px 16px",
                          color: "#9da4ae",
                        }}
                      >
                        No pending posts — all clear!
                      </td>
                    </tr>
                  ) : (
                    pendingPosts.slice(0, 6).map((post) => (
                      <tr key={post.id}>
                        <td>
                          <div className="admin-table-user">
                            <div
                              className="admin-table-avatar"
                              style={{
                                background: "#f3f4f6",
                                color: "#374151",
                              }}
                            >
                              {post.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="admin-table-name">
                                {post.author}
                              </div>
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
                        <td style={{ maxWidth: 200 }}>
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
                            {postPreview(post.content, 80)}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap", color: "#6c737f" }}>
                          {formatDate(post.createdAt)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            onClick={() => approvePost(post.id)}
                            disabled={approvingId === post.id}
                          >
                            {approvingId === post.id
                              ? "Approving…"
                              : "Approve"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-card-footer">
            <Link href="/admin/moderation" className="admin-card-footer-link">
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
