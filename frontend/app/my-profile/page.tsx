"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/auth";
import { useTheme } from "@/app/context/theme";
import { ProtectedRoute } from "@/app/components/protected-route";

type UserPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: "public";
  createdAt: string;
};

type UserProfile = {
  name: string;
  role: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Drake",
  role: "Writer",
  city: "Los Angeles",
  state: "California",
  country: "United States",
  timezone: "PST (UTC-08:00)",
  bio: "Urdu poetry enthusiast sharing verses and literary reflections.",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
};

const CACHE_KEY = "manav-profile-cache";

// Read profile from localStorage cache (client-side only)
const readCachedProfile = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  } catch {
    return null;
  }
};

// Save profile to localStorage cache
const saveCachedProfile = (profile: UserProfile): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

export function MyProfileContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [isPublic, setIsPublic] = useState(true);
  const [activeTab, setActiveTab] = useState("POETRY");

  const favoriteTabs = ["POETRY", "AAMOZISH", "WORD", "BOOKS", "POET", "SUFINAMA", "HINDWI"];
  const [draftByTab, setDraftByTab] = useState<Record<string, string>>(() =>
    Object.fromEntries(favoriteTabs.map((tab) => [tab, ""])) as Record<string, string>,
  );
  const [activePosts, setActivePosts] = useState<UserPost[]>([]);
  const [allPublicPosts, setAllPublicPosts] = useState<UserPost[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  // Use DEFAULT_PROFILE for initial render (server-side compatible)
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
  const activeDraft = draftByTab[activeTab] ?? "";

  const loadProfile = async () => {
    try {
      const res = await fetch(`${backendUrl}/profile`);
      if (!res.ok) {
        throw new Error("failed_response");
      }

      const data = (await res.json()) as UserProfile;
      setProfile(data);
      setDraftProfile(data);
      saveCachedProfile(data); // Save fetched profile to cache
    } catch {
      setApiError("Unable to load profile from backend.");
    }
  };

  const loadPosts = async (section: string) => {
    try {
      setApiError(null);

      const [sectionRes, publicRes] = await Promise.all([
        fetch(`${backendUrl}/posts?section=${encodeURIComponent(section)}`),
        fetch(`${backendUrl}/posts/public`),
      ]);

      if (!sectionRes.ok || !publicRes.ok) {
        throw new Error("failed_response");
      }

      const sectionData = (await sectionRes.json()) as UserPost[];
      const publicData = (await publicRes.json()) as UserPost[];

      setActivePosts(sectionData);
      setAllPublicPosts(publicData);
    } catch {
      setActivePosts([]);
      setAllPublicPosts([]);
      setApiError("Unable to reach post service. Start backend on port 3001.");
    }
  };

  useEffect(() => {
    void loadPosts(activeTab);
  }, [activeTab]);

  // Hydrate profile from cache and sync with backend
  useEffect(() => {
    const cachedProfile = readCachedProfile();
    if (cachedProfile) {
      setProfile(cachedProfile);
      setDraftProfile(cachedProfile);
    }
    // Background fetch to keep cache in sync with server
    void loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  const handleDraftChange = (tab: string, value: string) => {
    setDraftByTab((prev) => ({ ...prev, [tab]: value }));
  };

  const handleCreatePost = (tab: string) => {
    const content = (draftByTab[tab] ?? "").trim();

    if (!content) return;

    void (async () => {
      try {
        setApiError(null);
        setIsPosting(true);
        const res = await fetch(`${backendUrl}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: tab,
            content,
            author: profile.name || "User",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to publish");
        }

        setDraftByTab((prev) => ({ ...prev, [tab]: "" }));
        await loadPosts(tab);
      } catch {
        setApiError("Publish failed. Ensure backend is running and try again.");
      } finally {
        setIsPosting(false);
      }
    })();
  };

  const openEditProfile = () => {
    setDraftProfile(profile);
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
    setIsEditingProfile(true);
  };

  const uploadAvatar = async (file: File): Promise<UserProfile> => {
    setApiError(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${backendUrl}/profile/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "avatar_upload_failed");
      }

      const updated = (await res.json()) as UserProfile;
      setProfile(updated);
      setDraftProfile(updated);
      saveCachedProfile(updated); // Save updated profile to cache
      return updated;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveProfile = () => {
    void (async () => {
      try {
        setIsSavingProfile(true);
        setApiError(null);

        let avatarProfile = draftProfile;
        if (pendingAvatarFile) {
          avatarProfile = await uploadAvatar(pendingAvatarFile);
          setPendingAvatarFile(null);
          setPendingAvatarPreview(null);
        }

        const payload: UserProfile = {
          ...avatarProfile,
          name: draftProfile.name.trim() || "User",
          role: draftProfile.role.trim() || "Member",
          city: draftProfile.city.trim(),
          state: draftProfile.state.trim(),
          country: draftProfile.country.trim(),
          timezone: draftProfile.timezone.trim(),
          bio: draftProfile.bio.trim(),
          avatarUrl: avatarProfile.avatarUrl.trim(),
        };

        const res = await fetch(`${backendUrl}/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("failed_response");
        }

        const updated = (await res.json()) as UserProfile;
        setProfile(updated);
        setDraftProfile(updated);
        saveCachedProfile(updated); // Save updated profile to cache
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        setIsEditingProfile(false);
      } catch {
        setApiError("Unable to save profile. Ensure backend is running.");
      } finally {
        setIsSavingProfile(false);
      }
    })();
  };

  return (
    <main
      className={`relative isolate min-h-screen px-2 py-5 transition-colors duration-300 sm:px-4 md:h-screen md:overflow-hidden md:p-10 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}
    >
      <div className="relative z-10 h-full">
      <div className="flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center md:h-full md:min-h-0 md:items-start md:justify-start md:gap-14">
        <aside
          className={`flex w-full max-w-sm flex-col rounded-[38px] border px-6 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] transition-colors duration-300 md:h-full md:overflow-hidden md:px-7 md:py-6 ${
            isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"
          }`}
        >
          <div className="flex flex-col justify-start gap-4">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 h-24 w-24 overflow-hidden rounded-full border ring-4 ${
                  isDark ? "border-white/20 ring-white/5" : "border-black/10 ring-black/5"
                }`}
              >
                <img
                  src={profile.avatarUrl}
                  alt="User profile photo"
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">{profile.name}</h1>

              <p className={`mt-1 text-[16px] font-medium ${isDark ? "text-white/70" : "text-[#3f4656]"}`}>
                {profile.city}, {profile.state}, {profile.country}
              </p>
              <p className={`mt-1 text-[14px] ${isDark ? "text-white/50" : "text-[#636e84]"}`}>
                {profile.timezone} • Local time 09:45 AM
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-2.5 py-1 text-[13px] font-semibold text-emerald-300">
                  {profile.role}
                </span>
                <span className="rounded-full border border-sky-400/40 bg-sky-400/12 px-2.5 py-1 text-[13px] font-semibold text-sky-300">
                  Verified
                </span>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <div className={`mb-1.5 flex items-center justify-between text-[13px] ${isDark ? "text-white/75" : "text-[#505a6f]"}`}>
                <span>Profile completion</span>
                <span className="font-semibold">78%</span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full w-[78%] rounded-full bg-[#2ce88f]" />
              </div>
              <button
                type="button"
                className="mt-2.5 w-full rounded-full border border-[#2ce88f]/50 px-3 py-2 text-[13px] font-semibold text-[#8cf8c1] transition hover:bg-[#2ce88f]/15"
              >
                Complete Profile
              </button>
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <p className={`text-[13px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#657086]"}`}>Bio</p>
              <p className={`mt-1.5 text-[14px] leading-relaxed ${isDark ? "text-white/80" : "text-[#2f3644]"}`}>
                {profile.bio}
              </p>
              <button type="button" className="mt-1.5 text-[13px] font-semibold text-[#8cf8c1]">
                Read more
              </button>
            </div>

            <div
              className={`grid grid-cols-4 gap-2 rounded-2xl border p-2.5 text-center ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              {[
                { label: "Posts", value: "124" },
                { label: "Followers", value: "3.8K" },
                { label: "Following", value: "612" },
                { label: "Works", value: "41" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[17px] font-semibold">{item.value}</p>
                  <p className={`text-[12px] ${isDark ? "text-white/60" : "text-[#5f687b]"}`}>{item.label}</p>
                </div>
              ))}
            </div>

            <div
              className={`flex items-center justify-between rounded-2xl border p-3 ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <div>
                <p className={`text-[12px] uppercase tracking-[0.12em] ${isDark ? "text-white/45" : "text-[#657086]"}`}>
                  Profile visibility
                </p>
                <p className={`mt-1 text-[14px] font-medium ${isDark ? "text-white/90" : "text-[#202634]"}`}>
                  {isPublic ? "Public" : "Private"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((prev) => !prev)}
                className={`relative h-6 w-11 rounded-full transition ${isPublic ? "bg-[#2ce88f]" : "bg-white/25"}`}
                aria-label="Toggle profile visibility"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full transition ${
                    isDark ? "bg-[#0e1214]" : "bg-[#0f1319]"
                  }`}
                  style={{ left: isPublic ? "22px" : "2px" }}
                />
              </button>
            </div>

            <div
              className={`rounded-2xl border p-2 ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openEditProfile}
                  className="w-full rounded-full bg-[#2ce88f] px-4 py-2.5 text-[15px] font-bold text-[#0b1112] transition hover:bg-[#45f39f]"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className={`w-full rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${
                    isDark
                      ? "border-red-500/35 bg-white/5 text-red-300 hover:bg-red-500/12"
                      : "border-red-300/60 bg-white text-red-500 hover:bg-red-50"
                  }`}
                >
                  Logout
                </button>
              </div>
            </div>

          </div>
        </aside>

        <section className="hidden min-w-0 flex-1 self-stretch md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden">
          <div className="shrink-0 px-6 pb-4 pt-1">
            <div
              className={`mx-auto flex w-full max-w-7xl items-center gap-3 rounded-[28px] border p-2.5 shadow-sm ${
                isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-[#f8faf5]"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                {favoriteTabs.map((tab) => {
                  const isActive = tab === activeTab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-[0.11em] transition ${
                        isActive
                          ? "bg-[#2ce88f] text-[#0b1112] shadow-[0_8px_24px_rgba(44,232,143,0.24)]"
                          : isDark
                            ? "text-white/75 hover:bg-white/6"
                            : "text-[#3c4d42] hover:bg-white"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  className={`rounded-full border px-3 py-2 transition ${
                    isDark
                      ? "border-white/20 bg-[#1b1e24] text-white"
                      : "border-black/10 bg-white text-[#10131a]"
                  }`}
                  aria-label="Toggle light and dark mode"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-[0.08em]">
                      {isDark ? "DARK" : "LIGHT"}
                    </span>
                    <span
                      className={`relative h-5 w-9 rounded-full transition ${
                        isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full transition ${
                          isDark ? "bg-[#0b1112]" : "bg-[#10131a]"
                        }`}
                        style={{ left: isDark ? "18px" : "2px" }}
                      />
                    </span>
                  </span>
                </button>

                <Link
                  href="/"
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] transition ${
                    isDark
                      ? "border-[#2ce88f]/45 bg-[#2ce88f]/15 text-[#a4f9cf] hover:bg-[#2ce88f]/25"
                      : "border-[#0a8a5b]/35 bg-[#eaf7ef] text-[#0a8a5b] hover:bg-[#dff2e7]"
                  }`}
                >
                  VIEW FEED
                </Link>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pr-2 [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-2">
              <div
                className={`rounded-[28px] border p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] ${
                  isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[12px] uppercase tracking-[0.16em] ${isDark ? "text-white/55" : "text-[#748196]"}`}>
                      Composer
                    </p>
                    <h2 className={`mt-1 text-[28px] font-semibold leading-tight ${isDark ? "text-white/92" : "text-[#202634]"}`}>
                      Share in {activeTab}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                      isDark
                        ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                        : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                    }`}
                  >
                    Public
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div
                    className={`mt-1 h-11 w-11 shrink-0 overflow-hidden rounded-full border ${
                      isDark ? "border-white/15" : "border-black/10"
                    }`}
                  >
                    <img
                      src={profile.avatarUrl}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <textarea
                      value={activeDraft}
                      onChange={(e) => handleDraftChange(activeTab, e.target.value)}
                      placeholder={`Write something inspiring in ${activeTab.toLowerCase()}...`}
                      className={`min-h-44 w-full resize-none rounded-[22px] border px-4 py-4 text-[16px] leading-relaxed outline-none transition ${
                        isDark
                          ? "border-white/20 bg-[#101318] text-white/95 placeholder:text-white/40 focus:border-[#2ce88f]/70"
                          : "border-black/10 bg-white text-[#1f2633] placeholder:text-[#7f8799] focus:border-[#00a86b]/60"
                      }`}
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Poetry mood", "Draft saved", "Public visibility"].map((chip) => (
                        <span
                          key={chip}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            isDark
                              ? "border-white/18 bg-[#1f2229] text-white/78"
                              : "border-black/10 bg-[#ffffff] text-[#516074]"
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
                  <div className={`text-[13px] ${isDark ? "text-white/65" : "text-[#70798d]"}`}>
                    <p className="font-medium">Visible to everyone</p>
                    <p className="mt-0.5 text-[12px]">{activeDraft.length}/500 characters</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftByTab((prev) => ({ ...prev, [activeTab]: "" }))}
                      className={`rounded-full px-4 py-2 text-[14px] font-semibold transition ${
                        isDark
                          ? "border border-white/20 bg-[#1f2229] text-white/85 hover:bg-[#2a2f39]"
                          : "border border-black/10 bg-white text-[#334056] hover:bg-[#f2f4f8]"
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreatePost(activeTab)}
                      className="rounded-full bg-[#2ce88f] px-5 py-2 text-[14px] font-semibold text-[#0b1112] shadow-[0_12px_24px_rgba(44,232,143,0.25)] transition hover:bg-[#45f39f] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPosting || !activeDraft.trim()}
                    >
                      {isPosting ? "Publishing..." : "Publish post"}
                    </button>
                  </div>
                </div>

                {apiError ? (
                  <p className={`mt-2 text-[12px] ${isDark ? "text-rose-300" : "text-rose-600"}`}>
                    {apiError}
                  </p>
                ) : null}

              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h3 className={`text-[22px] font-semibold ${isDark ? "text-white/90" : "text-[#202634]"}`}>
                      Public Timeline
                    </h3>
                    <p className={`mt-1 text-[13px] ${isDark ? "text-white/62" : "text-[#70798d]"}`}>
                      Everything published from any section appears here.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        isDark
                          ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                          : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                      }`}
                    >
                      {allPublicPosts.length} posts
                    </span>
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        isDark
                          ? "border-white/20 bg-[#1f2229] text-white/85"
                          : "border-black/10 bg-white text-[#334056]"
                      }`}
                    >
                      Latest first
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {allPublicPosts.length === 0 ? (
                    <div
                      className={`rounded-xl border border-dashed p-6 text-center text-[15px] ${
                        isDark ? "border-white/25 text-white/62" : "border-black/20 text-[#6c7488]"
                      }`}
                    >
                      No public posts yet.
                    </div>
                  ) : (
                    allPublicPosts.map((post) => (
                      <article
                        key={`public-${post.id}`}
                        className={`rounded-2xl border p-4 ${
                          isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold ${
                                isDark ? "bg-white/15 text-white" : "bg-[#eef1f6] text-[#2b3343]"
                              }`}
                            >
                              {post.author.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#202634]"}`}>
                                {post.author}
                              </p>
                              <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#7b8498]"}`}>
                                {new Date(post.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isDark ? "bg-white/14 text-white/80" : "bg-black/6 text-[#475064]"
                              }`}
                            >
                              {post.section}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isDark ? "bg-[#2ce88f]/15 text-[#8cf8c1]" : "bg-[#00a86b]/12 text-[#0a8a5b]"
                              }`}
                            >
                              PUBLIC
                            </span>
                          </div>
                        </div>

                        <p className={`text-[15px] leading-relaxed ${isDark ? "text-white/90" : "text-[#313949]"}`}>
                          {post.content}
                        </p>

                        <div className="mt-4 flex items-center gap-2 border-t pt-3">
                          {[
                            "Like",
                            "Comment",
                            "Share",
                          ].map((action) => (
                            <button
                              key={action}
                              type="button"
                              className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                                isDark
                                  ? "border-white/20 bg-[#1f2229] text-white/80 hover:bg-[#2a2f39]"
                                  : "border-black/10 bg-[#f8f9fb] text-[#4a556b] hover:bg-[#eef1f6]"
                              }`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      </div>

      {isEditingProfile ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
          <div
            className={`w-full max-w-4xl rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${
              isDark ? "border-white/15 bg-[#1c1f25]" : "border-black/10 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[24px] font-semibold">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                  isDark ? "border-white/20 text-white/80" : "border-black/15 text-[#334056]"
                }`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-4 rounded-xl border border-dashed p-3">
                <div className="h-16 w-16 overflow-hidden rounded-full border">
                  <img
                    src={pendingAvatarPreview ?? draftProfile.avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">Profile picture</p>
                  <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#6e7890]"}`}>
                    JPG, PNG or WebP up to 5MB. Preview first, then save.
                  </p>
                  {pendingAvatarFile ? (
                    <p className={`mt-1 truncate text-[12px] ${isDark ? "text-white/45" : "text-[#7b8498]"}`}>
                      {pendingAvatarFile.name}
                    </p>
                  ) : null}
                </div>
                <label className="cursor-pointer rounded-full bg-[#2ce88f] px-4 py-2 text-[13px] font-semibold text-[#0b1112]">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!file.type.startsWith("image/")) {
                        setApiError("Please upload an image file.");
                        return;
                      }

                      if (file.size > 5 * 1024 * 1024) {
                        setApiError("Image is too large. Maximum allowed size is 5MB.");
                        return;
                      }

                      if (pendingAvatarPreview) {
                        URL.revokeObjectURL(pendingAvatarPreview);
                      }

                      setApiError(null);
                      setPendingAvatarFile(file);
                      setPendingAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              <input
                value={draftProfile.name}
                onChange={(e) => setDraftProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.role}
                onChange={(e) => setDraftProfile((p) => ({ ...p, role: e.target.value }))}
                placeholder="Role"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.city}
                onChange={(e) => setDraftProfile((p) => ({ ...p, city: e.target.value }))}
                placeholder="City"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.state}
                onChange={(e) => setDraftProfile((p) => ({ ...p, state: e.target.value }))}
                placeholder="State"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.country}
                onChange={(e) => setDraftProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder="Country"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.timezone}
                onChange={(e) => setDraftProfile((p) => ({ ...p, timezone: e.target.value }))}
                placeholder="Timezone"
                className={`rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <textarea
                value={draftProfile.bio}
                onChange={(e) => setDraftProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Bio"
                rows={4}
                className={`md:col-span-2 rounded-lg border px-3 py-2.5 text-[14px] outline-none ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-full bg-[#2ce88f] px-4 py-2 text-[13px] font-semibold text-[#0b1112] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingProfile || isUploadingAvatar}
              >
                {isSavingProfile ? "Saving..." : isUploadingAvatar ? "Uploading..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${
                  isDark ? "border-white/20 text-white/80" : "border-black/15 text-[#334056]"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function MyProfilePage() {
  return (
    <ProtectedRoute>
      <MyProfileContent />
    </ProtectedRoute>
  );
}
