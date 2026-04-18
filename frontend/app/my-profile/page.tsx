"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAuthToken, useAuth } from "@/app/context/auth";
import { useTheme } from "@/app/context/theme";
import { ProtectedRoute } from "@/app/components/protected-route";
import { getApiBaseUrl } from "@/app/lib/api-base";

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
  visibility: "public" | "private";
  city: string;
  state: string;
  country: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
};

function buildAvatarFallbackDataUrl(name: string): string {
  const safeName = (name.trim() || "User").slice(0, 40);
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'><rect width='192' height='192' rx='96' fill='#2ce88f'/><text x='50%' y='52%' text-anchor='middle' dominant-baseline='middle' font-family='Arial, sans-serif' font-size='72' font-weight='700' fill='#0b1112'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function compressAvatarImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = objectUrl;
    });

    const maxSize = 512;
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.82);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const nextName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".webp";
    return new File([blob], nextName, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function buildDefaultProfile(displayName?: string): UserProfile {
  return {
    name: displayName?.trim() || "User",
    role: "Member",
    visibility: "public",
    city: "",
    state: "",
    country: "",
    timezone: "",
    bio: "",
    avatarUrl: "",
    followersCount: 0,
    followingCount: 0,
  };
}

// Read profile from localStorage cache (client-side only)
const readCachedProfile = (cacheKey: string): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  } catch {
    return null;
  }
};

// Save profile to localStorage cache
const saveCachedProfile = (cacheKey: string, profile: UserProfile): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(profile));
    window.dispatchEvent(new Event("INSAAN-profile-updated"));
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

export function MyProfileContent() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("POETRY");

  const favoriteTabs = ["POETRY", "AAMOZISH", "WORD", "BOOKS", "POET", "SUFINAMA", "HINDWI"];
  const [draftByTab, setDraftByTab] = useState<Record<string, string>>(() =>
    Object.fromEntries(favoriteTabs.map((tab) => [tab, ""])) as Record<string, string>,
  );
  const [allPublicPosts, setAllPublicPosts] = useState<UserPost[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const cacheKey = `INSAAN-profile-cache:${user?.id ?? "guest"}`;
  const defaultProfile = useMemo(
    () => buildDefaultProfile(user?.displayName || user?.username),
    [user?.displayName, user?.username],
  );
  // Use DEFAULT_PROFILE for initial render (server-side compatible)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(defaultProfile);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();
  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
    [authToken],
  );
  const activeDraft = draftByTab[activeTab] ?? "";
  const isPublic = profile.visibility !== "private";
  const locationParts = [profile.city, profile.state, profile.country].map((v) => v.trim()).filter(Boolean);
  const localTimeText = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const myAuthorNames = useMemo(() => {
    const names = [profile.name, user?.displayName, user?.username]
      .map((value) => value?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value));

    return new Set(names);
  }, [profile.name, user?.displayName, user?.username]);

  const userPosts = useMemo(
    () => allPublicPosts.filter((post) => myAuthorNames.has(post.author.trim().toLowerCase())),
    [allPublicPosts, myAuthorNames],
  );
  const authoredPostsCount = userPosts.length;
  const profileFields = [
    profile.name,
    profile.role,
    profile.city,
    profile.state,
    profile.country,
    profile.timezone,
    profile.bio,
    profile.avatarUrl,
  ];
  const completionPercent = Math.round((profileFields.filter((field) => field.trim().length > 0).length / profileFields.length) * 100);
  const avatarSrc = profile.avatarUrl.trim() || buildAvatarFallbackDataUrl(profile.name || "User");

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/profile`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        throw new Error("failed_response");
      }

      const data = (await res.json()) as UserProfile;
      setProfile(data);
      setDraftProfile(data);
      saveCachedProfile(cacheKey, data); // Save fetched profile to cache
    } catch {
      setApiError("Unable to load profile from backend.");
    }
  }, [authHeaders, backendUrl, cacheKey]);

  const toggleProfileVisibility = () => {
    void (async () => {
      try {
        setApiError(null);
        const res = await fetch(`${backendUrl}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders ?? {}),
          },
          body: JSON.stringify({
            visibility: isPublic ? "private" : "public",
          }),
        });

        if (!res.ok) {
          throw new Error("failed_response");
        }

        const updated = (await res.json()) as UserProfile;
        setProfile(updated);
        setDraftProfile(updated);
        saveCachedProfile(cacheKey, updated);
      } catch {
        setApiError("Unable to update profile visibility.");
      }
    })();
  };

  const loadPosts = useCallback(async () => {
    try {
      setApiError(null);

      const publicRes = await fetch(`${backendUrl}/posts/public`);

      if (!publicRes.ok) {
        throw new Error("failed_response");
      }

      const publicData = (await publicRes.json()) as UserPost[];

      setAllPublicPosts(publicData);
    } catch {
      setAllPublicPosts([]);
      setApiError("Unable to reach post service. Start backend on port 3001.");
    }
  }, [backendUrl]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // Hydrate profile from cache and sync with backend
  useEffect(() => {
    const cachedProfile = readCachedProfile(cacheKey);
    if (cachedProfile) {
      setProfile(cachedProfile);
      setDraftProfile(cachedProfile);
    } else {
      setProfile(defaultProfile);
      setDraftProfile(defaultProfile);
    }
    // Background fetch to keep cache in sync with server
    void loadProfile();
  }, [cacheKey, defaultProfile, loadProfile, user?.id]);

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
          const errorText = await res.text();
          throw new Error(errorText || `Failed to publish (${res.status})`);
        }

        setDraftByTab((prev) => ({ ...prev, [tab]: "" }));
        await loadPosts();
      } catch (error) {
        const message = error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to publish post right now. Please try again.";

        setApiError(message);
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
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "avatar_upload_failed");
      }

      const updated = (await res.json()) as UserProfile;
      setProfile(updated);
      setDraftProfile(updated);
      saveCachedProfile(cacheKey, updated); // Save updated profile to cache
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
          visibility: draftProfile.visibility,
          city: draftProfile.city.trim(),
          state: draftProfile.state.trim(),
          country: draftProfile.country.trim(),
          timezone: draftProfile.timezone.trim(),
          bio: draftProfile.bio.trim(),
          avatarUrl: avatarProfile.avatarUrl.trim(),
        };

        const res = await fetch(`${backendUrl}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders ?? {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("failed_response");
        }

        const updated = (await res.json()) as UserProfile;
        setProfile(updated);
        setDraftProfile(updated);
        saveCachedProfile(cacheKey, updated); // Save updated profile to cache
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
      <div className="flex min-h-[calc(100vh-2.5rem)] w-full flex-col items-stretch justify-start gap-4 md:h-full md:min-h-0 md:flex-row md:items-start md:justify-start md:gap-14">
        <aside
          className={`flex w-full max-w-none flex-col rounded-none border px-5 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] transition-colors duration-300 sm:max-w-sm sm:px-6 md:h-full md:overflow-hidden md:rounded-[38px] md:px-7 md:py-6 ${
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
                <NextImage
                  src={avatarSrc}
                  alt="User profile photo"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-full w-full object-cover"
                  loading="eager"
                  priority
                />
              </div>

              <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">{profile.name}</h1>

              {locationParts.length > 0 ? (
                <p className={`mt-1 text-[16px] font-medium ${isDark ? "text-white/70" : "text-[#3f4656]"}`}>
                  {locationParts.join(", ")}
                </p>
              ) : null}
              {profile.timezone.trim() ? (
                <p className={`mt-1 text-[14px] ${isDark ? "text-white/50" : "text-[#636e84]"}`}>
                  {profile.timezone} â€¢ Local time {localTimeText}
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-none border border-emerald-400/40 bg-emerald-400/12 px-2.5 py-1 text-[13px] font-semibold text-emerald-300 md:rounded-full">
                  {profile.role}
                </span>
                <span className="rounded-none border border-sky-400/40 bg-sky-400/12 px-2.5 py-1 text-[13px] font-semibold text-sky-300 md:rounded-full">
                  Verified
                </span>
              </div>
            </div>

            <div
              className={`rounded-none border p-3 md:rounded-2xl ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <div className={`mb-1.5 flex items-center justify-between text-[13px] ${isDark ? "text-white/75" : "text-[#505a6f]"}`}>
                <span>Profile completion</span>
                <span className="font-semibold">{completionPercent}%</span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-none md:rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full rounded-none bg-[#2ce88f] md:rounded-full" style={{ width: `${completionPercent}%` }} />
              </div>
              <button
                type="button"
                className="mt-2.5 w-full rounded-none border border-[#2ce88f]/50 px-3 py-2 text-[13px] font-semibold text-[#8cf8c1] transition hover:bg-[#2ce88f]/15 md:rounded-full"
              >
                Complete Profile
              </button>
            </div>

            <div
              className={`rounded-none border p-3 md:rounded-2xl ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <p className={`text-[13px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#657086]"}`}>Bio</p>
              <p className={`mt-1.5 text-[14px] leading-relaxed ${isDark ? "text-white/80" : "text-[#2f3644]"}`}>
                {profile.bio.trim() || "No bio added yet."}
              </p>
            </div>

            <div
              className={`grid grid-cols-4 gap-2 rounded-none border p-2.5 text-center md:rounded-2xl ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              {[
                { label: "Posts", value: String(authoredPostsCount) },
                { label: "Followers", value: String(profile.followersCount) },
                { label: "Following", value: String(profile.followingCount) },
                { label: "Works", value: String(authoredPostsCount) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[17px] font-semibold">{item.value}</p>
                  <p className={`text-[12px] ${isDark ? "text-white/60" : "text-[#5f687b]"}`}>{item.label}</p>
                </div>
              ))}
            </div>

            <div
              className={`flex items-center justify-between rounded-none border p-3 md:rounded-2xl ${
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
                onClick={toggleProfileVisibility}
                className={`relative h-6 w-11 rounded-none transition md:rounded-full ${isPublic ? "bg-[#2ce88f]" : "bg-white/25"}`}
                aria-label="Toggle profile visibility"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-none transition md:rounded-full ${
                    isDark ? "bg-[#0e1214]" : "bg-[#0f1319]"
                  }`}
                  style={{ left: isPublic ? "22px" : "2px" }}
                />
              </button>
            </div>

            <div
              className={`rounded-none border p-2 md:rounded-2xl ${
                isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
              }`}
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openEditProfile}
                  className="w-full rounded-none bg-[#2ce88f] px-4 py-2.5 text-[15px] font-bold text-[#0b1112] transition hover:bg-[#45f39f] md:rounded-full"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className={`w-full rounded-none border px-4 py-2.5 text-[13px] font-semibold transition md:rounded-full ${
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

        <section className="min-w-0 w-full self-stretch md:flex md:flex-1 md:h-full md:min-h-0 md:flex-col md:overflow-hidden">
          <div className="shrink-0 px-1 pb-3 pt-0 md:px-6 md:pb-4 md:pt-1">
            <div
              className={`mx-auto flex w-full max-w-7xl flex-col items-stretch gap-2.5 rounded-none border p-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 md:rounded-[28px] ${
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
                      className={`shrink-0 rounded-none px-4 py-2.5 text-[13px] font-semibold tracking-[0.11em] transition md:rounded-full ${
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

              <div className="shrink-0 flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  className={`rounded-none border px-3 py-2 transition md:rounded-full ${
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
                      className={`relative h-5 w-9 rounded-none transition md:rounded-full ${
                        isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-none transition md:rounded-full ${
                          isDark ? "bg-[#0b1112]" : "bg-[#10131a]"
                        }`}
                        style={{ left: isDark ? "18px" : "2px" }}
                      />
                    </span>
                  </span>
                </button>

                <Link
                  href="/"
                  className={`rounded-none border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] transition md:rounded-full ${
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

          <div className="overflow-visible px-1 pb-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:px-6 md:pb-10 md:pr-2 md:[scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-2">
              <div
                className={`rounded-none border p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] md:rounded-[28px] ${
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
                    className={`rounded-none border px-3 py-1.5 text-[12px] font-semibold md:rounded-full ${
                      isDark
                        ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                        : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                    }`}
                  >
                    Public
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={activeDraft}
                      onChange={(e) => handleDraftChange(activeTab, e.target.value)}
                      placeholder={`Write something inspiring in ${activeTab.toLowerCase()}...`}
                      className={`min-h-44 w-full resize-none rounded-none border px-4 py-4 text-[16px] leading-relaxed outline-none transition md:rounded-[22px] ${
                        isDark
                          ? "border-white/20 bg-[#101318] text-white/95 placeholder:text-white/40 focus:border-[#2ce88f]/70"
                          : "border-black/10 bg-white text-[#1f2633] placeholder:text-[#7f8799] focus:border-[#00a86b]/60"
                      }`}
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Poetry mood", "Draft saved", "Public visibility"].map((chip) => (
                        <span
                          key={chip}
                          className={`rounded-none border px-3 py-1 text-[11px] font-semibold md:rounded-full ${
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

                <div className="mt-4 flex flex-col items-stretch justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                  <div className={`text-[13px] ${isDark ? "text-white/65" : "text-[#70798d]"}`}>
                    <p className="font-medium">Visible to everyone</p>
                    <p className="mt-0.5 text-[12px]">{activeDraft.length}/500 characters</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftByTab((prev) => ({ ...prev, [activeTab]: "" }))}
                      className={`rounded-none px-4 py-2 text-[14px] font-semibold transition md:rounded-full ${
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
                      className="rounded-none bg-[#2ce88f] px-5 py-2 text-[14px] font-semibold text-[#0b1112] shadow-[0_12px_24px_rgba(44,232,143,0.25)] transition hover:bg-[#45f39f] disabled:cursor-not-allowed disabled:opacity-60 md:rounded-full"
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
                className={`rounded-none border p-4 md:rounded-2xl ${
                  isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h3 className={`text-[22px] font-semibold ${isDark ? "text-white/90" : "text-[#202634]"}`}>
                      My Timeline
                    </h3>
                    <p className={`mt-1 text-[13px] ${isDark ? "text-white/62" : "text-[#70798d]"}`}>
                      Only your published posts are shown here.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-none border px-3 py-1 text-[12px] font-semibold md:rounded-full ${
                        isDark
                          ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                          : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                      }`}
                    >
                      {userPosts.length} posts
                    </span>
                    <button
                      type="button"
                      className={`rounded-none border px-3 py-1 text-[12px] font-semibold md:rounded-full ${
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
                  {userPosts.length === 0 ? (
                    <div
                      className={`rounded-none border border-dashed p-6 text-center text-[15px] md:rounded-xl ${
                        isDark ? "border-white/25 text-white/62" : "border-black/20 text-[#6c7488]"
                      }`}
                    >
                      You have not published any posts yet.
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <article
                        key={`public-${post.id}`}
                        className={`rounded-none border p-4 md:rounded-2xl ${
                          isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-none text-[13px] font-semibold md:rounded-full ${
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
                              className={`rounded-none px-2 py-0.5 text-[11px] font-semibold md:rounded-full ${
                                isDark ? "bg-white/14 text-white/80" : "bg-black/6 text-[#475064]"
                              }`}
                            >
                              {post.section}
                            </span>
                            <span
                              className={`rounded-none px-2 py-0.5 text-[11px] font-semibold md:rounded-full ${
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
                              className={`rounded-none border px-3 py-1 text-[12px] font-semibold transition md:rounded-full ${
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
            className={`w-full max-w-4xl rounded-none border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:rounded-2xl ${
              isDark ? "border-white/15 bg-[#1c1f25]" : "border-black/10 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[24px] font-semibold">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className={`rounded-none border px-3 py-1 text-[12px] font-semibold md:rounded-full ${
                  isDark ? "border-white/20 text-white/80" : "border-black/15 text-[#334056]"
                }`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-4 rounded-none border border-dashed p-3 md:rounded-xl">
                <div className="h-16 w-16 overflow-hidden rounded-none border md:rounded-full">
                    <NextImage
                    src={pendingAvatarPreview ?? (draftProfile.avatarUrl || buildAvatarFallbackDataUrl(draftProfile.name || "User"))}
                    alt="Avatar preview"
                      width={64}
                      height={64}
                      unoptimized
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
                <label className="cursor-pointer rounded-none bg-[#2ce88f] px-4 py-2 text-[13px] font-semibold text-[#0b1112] md:rounded-full">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      void (async () => {
                        if (!file.type.startsWith("image/")) {
                          setApiError("Please upload an image file.");
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setApiError("Image is too large. Maximum allowed size is 5MB.");
                          return;
                        }

                        const optimizedFile = await compressAvatarImage(file);

                        if (pendingAvatarPreview) {
                          URL.revokeObjectURL(pendingAvatarPreview);
                        }

                        setApiError(null);
                        setPendingAvatarFile(optimizedFile);
                        setPendingAvatarPreview(URL.createObjectURL(optimizedFile));
                      })();
                    }}
                  />
                </label>
              </div>

              <input
                value={draftProfile.name}
                onChange={(e) => setDraftProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.role}
                onChange={(e) => setDraftProfile((p) => ({ ...p, role: e.target.value }))}
                placeholder="Role"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.city}
                onChange={(e) => setDraftProfile((p) => ({ ...p, city: e.target.value }))}
                placeholder="City"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.state}
                onChange={(e) => setDraftProfile((p) => ({ ...p, state: e.target.value }))}
                placeholder="State"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.country}
                onChange={(e) => setDraftProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder="Country"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
                  isDark
                    ? "border-white/15 bg-black/20 text-white"
                    : "border-black/10 bg-[#f8f9fb] text-[#202634]"
                }`}
              />
              <input
                value={draftProfile.timezone}
                onChange={(e) => setDraftProfile((p) => ({ ...p, timezone: e.target.value }))}
                placeholder="Timezone"
                className={`rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
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
                className={`md:col-span-2 rounded-none border px-3 py-2.5 text-[14px] outline-none md:rounded-lg ${
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
                className="rounded-none bg-[#2ce88f] px-4 py-2 text-[13px] font-semibold text-[#0b1112] disabled:cursor-not-allowed disabled:opacity-60 md:rounded-full"
                disabled={isSavingProfile || isUploadingAvatar}
              >
                {isSavingProfile ? "Saving..." : isUploadingAvatar ? "Uploading..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className={`rounded-none border px-4 py-2 text-[13px] font-semibold md:rounded-full ${
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

