"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getStoredAuthToken } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: "unread" | "read" | "archived";
  readAt: string | null;
  createdAt: string;
};

function formatDate(raw: string) {
  return new Date(raw).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );

  const loadMessages = async () => {
    if (!authHeaders) return;
    setIsLoading(true);
    try {
      setApiError(null);
      const res = await fetch(`${backendUrl}/admin/contact-messages`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error("fetch_failed");
      }

      const data = (await res.json()) as ContactMessage[];
      setMessages(data);
      setSelectedMessageId((current) => current ?? data[0]?.id ?? null);
    } catch {
      setApiError("Unable to load contact messages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const markAsRead = async (messageId: string) => {
    if (!authHeaders) return;
    setMarkingId(messageId);
    try {
      const res = await fetch(`${backendUrl}/admin/contact-messages/${messageId}/read`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error("mark_failed");
      }

      const updated = (await res.json()) as ContactMessage;
      setMessages((current) => current.map((message) => (message.id === updated.id ? updated : message)));
    } catch {
      setApiError("Unable to update message status.");
    } finally {
      setMarkingId(null);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      message.name.toLowerCase().includes(query) ||
      message.email.toLowerCase().includes(query) ||
      message.category.toLowerCase().includes(query) ||
      message.message.toLowerCase().includes(query)
    );
  });

  const unreadCount = messages.filter((message) => message.status === "unread").length;
  const selectedMessage =
    messages.find((message) => message.id === selectedMessageId) ?? filteredMessages[0] ?? null;

  return (
    <>
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Contact form submissions arrive here from the public site.
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
            placeholder="Search by name, email, category, or message…"
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={loadMessages}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
          <span className="admin-badge pending" style={{ alignSelf: "center" }}>
            <span className="admin-badge-dot" />
            {unreadCount} unread
          </span>
        </div>
      </div>

      <div className="admin-grid admin-grid-8-4">
        <div className="admin-card" style={{ minHeight: 560 }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Contact Inbox</h2>
            <span className="admin-badge pending">
              <span className="admin-badge-dot" />
              {filteredMessages.length} total
            </span>
          </div>

          <div style={{ padding: 24 }}>
            {isLoading ? (
              <div style={{ color: "#6c737f" }}>Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div style={{ color: "#6c737f" }}>
                {messages.length === 0 ? "No contact messages yet." : "No messages match your search."}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredMessages.map((message) => {
                  const selected = message.id === selectedMessageId;
                  const unread = message.status === "unread";
                  return (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => setSelectedMessageId(message.id)}
                      className="admin-card"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 16,
                        borderColor: selected ? "#2ce88f" : "#e6ece3",
                        background: selected ? "rgba(44,232,143,0.08)" : "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div className="admin-table-name" style={{ fontSize: 15 }}>{message.name}</div>
                          <div className="admin-table-sub" style={{ marginTop: 4 }}>{message.email}</div>
                        </div>
                        <span className={`admin-badge ${unread ? "pending" : "approved"}`}>
                          <span className="admin-badge-dot" />
                          {message.status}
                        </span>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span className="admin-badge pending">
                          <span className="admin-badge-dot" />
                          {message.category}
                        </span>
                        <span style={{ color: "#6c737f", fontSize: 13 }}>{formatDate(message.createdAt)}</span>
                      </div>

                      <p style={{ marginTop: 10, color: "#4f5968", fontSize: 14, lineHeight: 1.6 }}>
                        {message.message.length > 150 ? `${message.message.slice(0, 150).trim()}…` : message.message}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="admin-card" style={{ minHeight: 560 }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Message Details</h2>
            {selectedMessage ? (
              <span className={`admin-badge ${selectedMessage.status === "unread" ? "pending" : "approved"}`}>
                <span className="admin-badge-dot" />
                {selectedMessage.status}
              </span>
            ) : null}
          </div>

          <div style={{ padding: 24 }}>
            {!selectedMessage ? (
              <div style={{ color: "#6c737f" }}>Select a message to view the full conversation.</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div className="admin-table-name" style={{ fontSize: 20 }}>{selectedMessage.name}</div>
                    <div className="admin-table-sub" style={{ marginTop: 4 }}>{selectedMessage.email}</div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span className="admin-badge pending">
                      <span className="admin-badge-dot" />
                      {selectedMessage.category}
                    </span>
                    <span className="admin-badge approved">
                      <span className="admin-badge-dot" />
                      {formatDate(selectedMessage.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      borderRadius: 16,
                      border: "1px solid #e6ece3",
                      background: "#fbfcfa",
                      padding: 16,
                      color: "#24302c",
                      fontSize: 14,
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedMessage.message}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => markAsRead(selectedMessage.id)}
                    disabled={markingId === selectedMessage.id || selectedMessage.status === "read"}
                  >
                    {markingId === selectedMessage.id
                      ? "Updating…"
                      : selectedMessage.status === "read"
                        ? "Already Read"
                        : "Mark as Read"}
                  </button>
                  <Link href="/contact-us" className="admin-btn admin-btn-outline">
                    View Contact Page
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
