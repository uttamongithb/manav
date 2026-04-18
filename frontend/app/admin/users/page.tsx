"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  followersCount: number;
  followingCount: number;
  contentCount: number;
};

const ROLE_OPTIONS = ["superadmin", "admin", "editor", "publisher", "poet", "reader"];
const STATUS_OPTIONS = ["active", "inactive", "suspended", "pending_verification"];

function formatDate(raw: string | null) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadUsers = async () => {
    if (!authHeaders) return;
    setIsLoading(true);
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/users`, { headers: authHeaders });
      if (!res.ok) throw new Error("fetch_failed");
      setUsers((await res.json()) as AdminUser[]);
    } catch {
      setApiError("Unable to load user records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const updateField = async (userId: string, field: "role" | "status", value: string) => {
    if (!authHeaders) return;
    try {
      setSavingId(userId);
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, [field]: value } : user)),
      );
      const endpoint = field === "role" ? "role" : "status";
      const res = await fetch(`${backendUrl}/admin/users/${userId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("save_failed");
      const updated = (await res.json()) as AdminUser | null;
      if (updated) {
        setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
      }
    } catch {
      setApiError(`Unable to update ${field}.`);
      void loadUsers();
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [user.email, user.username, user.displayName, user.role, user.status]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <>
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Manage roles, visibility, and account status for platform members.
        </p>
      </div>

      {apiError && <div className="admin-alert error">{apiError}</div>}

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
            placeholder="Search by name, email, role, or status…"
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={loadUsers}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
          <span className="admin-badge pending" style={{ alignSelf: "center" }}>
            <span className="admin-badge-dot" />
            {filteredUsers.length} users
          </span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Activity</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#6c737f" }}>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#6c737f" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-table-user">
                        <div className="admin-table-avatar" style={{ background: "#e6f9ef", color: "#0a8a5b" }}>
                          {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-table-name">{user.displayName || user.username}</div>
                          <div className="admin-table-sub">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(event) => void updateField(user.id, "role", event.target.value)}
                        disabled={savingId === user.id}
                        className="admin-input"
                        style={{ minWidth: 130 }}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={user.status}
                        onChange={(event) => void updateField(user.id, "status", event.target.value)}
                        disabled={savingId === user.id}
                        className="admin-input"
                        style={{ minWidth: 150 }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`admin-badge ${user.isVerified ? "approved" : "pending"}`}>
                        <span className="admin-badge-dot" />
                        {user.isVerified ? "Verified" : "Not verified"}
                      </span>
                    </td>
                    <td style={{ color: "#6c737f" }}>
                      <div>{user.contentCount} posts</div>
                      <div style={{ marginTop: 2, fontSize: 12 }}>
                        {user.followersCount} followers • {user.followingCount} following
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "#6c737f" }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#6c737f" }}>{formatDate(user.lastLoginAt)}</span>
                      </div>
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
