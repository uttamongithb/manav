"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/auth";
import Link from "next/link";
import "./admin.css";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
        <path d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
        <path d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
        <path d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Moderation",
    href: "/admin/moderation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    label: "Banner Studio",
    href: "/admin/banners",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM8.25 8.25h.008v.008H8.25V8.25z" />
      </svg>
    ),
  },
  {
    label: "Privacy Policy",
    href: "/admin/policy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoadingAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role?.toLowerCase?.() ?? "";
  const isAdmin = !!user && ["admin", "superadmin"].includes(role);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("manav-admin-theme");
    setIsDarkMode(saved === "dark");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("manav-admin-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isLoadingAuth, user, router]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoadingAuth) {
    return (
      <div className={`admin-shell ${isDarkMode ? "admin-theme-dark" : "admin-theme-light"}`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "100vh",
            color: "#6c737f",
            fontSize: "15px",
            fontWeight: 500,
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className={`admin-shell ${isDarkMode ? "admin-theme-dark" : "admin-theme-light"}`}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(240,68,56,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f04438"
              strokeWidth={1.5}
              style={{ width: 32, height: 32 }}
            >
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#111927",
              marginBottom: 8,
            }}
          >
            Access Denied
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6c737f",
              maxWidth: 360,
            }}
          >
            Your account does not have admin privileges. Contact a superadmin to
            request access.
          </p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const currentSectionLabel =
    NAV_ITEMS.find((item) => {
      if (item.href === "/admin") return pathname === "/admin";
      return pathname.startsWith(item.href);
    })?.label || "Overview";

  return (
    <div className={`admin-shell ${isDarkMode ? "admin-theme-dark" : "admin-theme-light"}`}>
      {/* Sidebar overlay for mobile */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">M</div>
            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-brand-name">Manav</span>
              <span className="admin-sidebar-brand-sub">Literary Platform</span>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-nav-section">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                <span className="admin-nav-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navigation */}
        <header className="admin-topnav">
          <div className="admin-topnav-left">
            <button
              type="button"
              className="admin-topnav-hamburger"
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label="Toggle sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="admin-topnav-section">
              <span className="admin-topnav-section-value">{currentSectionLabel}</span>
            </div>
          </div>

          <div className="admin-topnav-right">
            <Link href="/" className="admin-topnav-home-link">
              Home
            </Link>

            <button
              type="button"
              className={`admin-topnav-theme-toggle ${isDarkMode ? "is-dark" : ""}`}
              onClick={() => setIsDarkMode((prev) => !prev)}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              <span>{isDarkMode ? "DARK" : "LIGHT"}</span>
              <span className="admin-topnav-theme-track">
                <span className="admin-topnav-theme-knob" />
              </span>
            </button>

            <button type="button" className="admin-topnav-icon-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM7.5 9.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </button>

            <button type="button" className="admin-topnav-icon-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="admin-topnav-badge" />
            </button>

            <button
              type="button"
              className="admin-topnav-avatar"
              title={user?.displayName || user?.username || "Admin"}
            >
              {(user?.displayName || user?.username || "A")
                .charAt(0)
                .toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
