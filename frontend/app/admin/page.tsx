"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/app/components/site-navbar";
import { getStoredAuthToken, useAuth } from "@/app/context/auth";
import { useTheme } from "@/app/context/theme";
import { getApiBaseUrl } from "@/app/lib/api-base";

type PendingPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  createdAt: string;
};

type PrivacyPolicyState = {
  content: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoadingAuth } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [policy, setPolicy] = useState<PrivacyPolicyState>({
    content: "",
    updatedAt: null,
    updatedBy: null,
  });
  const [draftPolicy, setDraftPolicy] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const backendUrl = getApiBaseUrl();
  const authToken = getStoredAuthToken();
  const authHeaders = useMemo(
    () =>
      authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : undefined,
    [authToken],
  );

  useEffect(() => {
    if (isLoadingAuth) return;

    const role = user?.role?.toLowerCase?.() ?? "";
    if (!user || !["admin", "superadmin"].includes(role)) {
      router.replace("/");
    }
  }, [isLoadingAuth, user, router]);

  const loadAdminData = async () => {
    if (!authHeaders) {
      setApiError("Authentication token missing.");
      return;
    }

    try {
      setApiError(null);
      const [policyRes, pendingRes] = await Promise.all([
        fetch(`${backendUrl}/admin/privacy-policy`, { headers: authHeaders }),
        fetch(`${backendUrl}/admin/posts/pending`, { headers: authHeaders }),
      ]);

      if (!policyRes.ok || !pendingRes.ok) {
        throw new Error("admin_request_failed");
      }

      const policyData = (await policyRes.json()) as PrivacyPolicyState;
      const pendingData = (await pendingRes.json()) as PendingPost[];

      setPolicy(policyData);
      setDraftPolicy(policyData.content || "");
      setPendingPosts(pendingData);
    } catch {
      setApiError("Unable to load admin panel data. Ensure your account has admin role.");
    }
  };

  useEffect(() => {
    if (!authHeaders || isLoadingAuth) return;
    void loadAdminData();
  }, [authHeaders, isLoadingAuth]);

  const savePolicy = async () => {
    if (!authHeaders) return;

    try {
      setApiError(null);
      setIsSavingPolicy(true);
      const res = await fetch(`${backendUrl}/admin/privacy-policy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ content: draftPolicy.trim() }),
      });

      if (!res.ok) {
        throw new Error("policy_save_failed");
      }

      const next = (await res.json()) as PrivacyPolicyState;
      setPolicy(next);
      setDraftPolicy(next.content || "");
    } catch {
      setApiError("Unable to save privacy policy.");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const approvePost = async (postId: string) => {
    if (!authHeaders) return;

    try {
      setApiError(null);
      setApprovingId(postId);
      const res = await fetch(`${backendUrl}/admin/posts/${postId}/approve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error("approve_failed");
      }

      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch {
      setApiError("Unable to approve post.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} activeHref="/admin" />

      <section className="mx-auto grid w-[80vw] max-w-none gap-6 px-1 py-7 md:grid-cols-12 md:py-10">
        <div className="md:col-span-12">
          <header className={`overflow-hidden rounded-4xl border ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
            <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
              <div className="p-6 md:p-8">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5e775f]"}`}>
                  Admin Control Center
                </p>
                <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] md:text-[50px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  Manage Content,
                  <br />
                  Approvals, and Policy.
                </h1>
                <p className={`mt-3 text-[15px] leading-relaxed ${isDark ? "text-white/68" : "text-[#496048]"}`}>
                  Use this panel to update the platform privacy policy and approve user-submitted posts before publication.
                </p>
              </div>

              <div className="relative min-h-72">
                <img src="https://picsum.photos/seed/admin-panel/1200/850" alt="Admin panel cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">Moderation Queue</p>
                  <h2 className="mt-1 text-[24px] font-semibold leading-tight">{pendingPosts.length} Pending Posts</h2>
                  <p className="mt-1 text-[12px] text-white/85">Review and approve submissions for public visibility.</p>
                </div>
              </div>
            </div>
          </header>

          {apiError ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {apiError}
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <section className={`rounded-3xl border p-5 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white/94"}`}>
              <h3 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Privacy Policy Editor
              </h3>
              <p className={`mt-2 text-[13px] ${isDark ? "text-white/60" : "text-[#687c66]"}`}>
                Last updated: {policy.updatedAt ? new Date(policy.updatedAt).toLocaleString() : "Never"}
              </p>

              <textarea
                value={draftPolicy}
                onChange={(e) => setDraftPolicy(e.target.value)}
                className={`mt-4 min-h-72 w-full resize-y rounded-2xl border px-4 py-4 text-[14px] leading-relaxed outline-none transition ${
                  isDark
                    ? "border-white/20 bg-[#101318] text-white/95 placeholder:text-white/40 focus:border-[#2ce88f]/70"
                    : "border-black/10 bg-white text-[#1f2633] placeholder:text-[#7f8799] focus:border-[#00a86b]/60"
                }`}
                placeholder="Write the privacy policy content here..."
              />

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={savePolicy}
                  disabled={isSavingPolicy || !draftPolicy.trim()}
                  className="rounded-full bg-[#2ce88f] px-5 py-2 text-[14px] font-semibold text-[#0b1112] shadow-[0_12px_24px_rgba(44,232,143,0.25)] transition hover:bg-[#45f39f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPolicy ? "Saving..." : "Save Privacy Policy"}
                </button>
              </div>
            </section>

            <section className={`rounded-3xl border p-5 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white/94"}`}>
              <h3 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Pending Post Approvals
              </h3>

              <div className="mt-4 space-y-3">
                {pendingPosts.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed p-5 text-center text-[14px] ${isDark ? "border-white/20 text-white/55" : "border-black/20 text-[#5d6d5f]"}`}>
                    No pending posts. All submissions are up to date.
                  </div>
                ) : (
                  pendingPosts.map((post) => (
                    <article key={post.id} className={`rounded-2xl border p-4 ${isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold">{post.author}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${isDark ? "border-white/15 text-white/70" : "border-black/10 text-[#5a715a]"}`}>
                          {post.section}
                        </span>
                      </div>
                      <p className={`mt-2 text-[14px] leading-6 ${isDark ? "text-white/82" : "text-[#2f4732]"}`}>
                        {post.content.length > 180 ? `${post.content.slice(0, 180).trim()}...` : post.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className={`text-[12px] ${isDark ? "text-white/55" : "text-[#6d836c]"}`}>
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => approvePost(post.id)}
                          disabled={approvingId === post.id}
                          className="rounded-full bg-[#2ce88f] px-4 py-1.5 text-[12px] font-semibold text-[#0b1112] transition hover:bg-[#45f39f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approvingId === post.id ? "Approving..." : "Approve"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
