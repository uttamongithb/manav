"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";
import { useTheme } from "@/app/context/theme";

type LoginResponse = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  token: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, login } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  // Login state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Register state
  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const backendUrl = getApiBaseUrl();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      if (!loginForm.email && !loginForm.password) {
        throw new Error("Please enter credentials");
      }

      const res = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email || undefined,
          username: loginForm.email,
          password: loginForm.password,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Login failed");
      }

      const user = (await res.json()) as LoginResponse;

      // Update shared auth state immediately so protected routes recognize the session
      login(user, user.token);

      // Reset form
      setLoginForm({ email: "", password: "" });

      // Redirect to home
      router.replace("/");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      if (!registerForm.email || !registerForm.username || !registerForm.password) {
        throw new Error("Please fill all required fields");
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (registerForm.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const res = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          username: registerForm.username,
          password: registerForm.password,
          displayName: registerForm.displayName || registerForm.username,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Registration failed");
      }

      const user = (await res.json()) as LoginResponse;

      // Update shared auth state immediately so protected routes recognize the session
      login(user, user.token);

      // Reset form
      setRegisterForm({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        displayName: "",
      });

      // Redirect to home
      router.replace("/");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className={`relative isolate min-h-screen overflow-hidden px-2 py-5 transition-colors duration-300 sm:px-4 md:p-10 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${isDark ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-[#2ce88f]/10 blur-3xl" />
        <div className="absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-[#3c8cff]/10 blur-3xl" />
      </div>
      <div className="relative z-10">
      {/* Theme Toggle */}
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        className={`fixed right-4 top-4 z-20 flex items-center gap-3 rounded-full border px-3 py-2 shadow-lg transition md:right-8 md:top-8 ${
          isDark
            ? "border-white/20 bg-[#1b1e24] text-white"
            : "border-black/10 bg-white text-[#10131a]"
        }`}
        aria-label="Toggle light and dark mode"
      >
        <span className="text-[11px] font-semibold tracking-[0.08em]">
          {isDark ? "DARK" : "LIGHT"}
        </span>
        <span
          className={`relative h-6 w-11 rounded-full transition ${
            isDark ? "bg-[#2ce88f]" : "bg-[#d9dde5]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full transition ${
              isDark ? "bg-[#0b1112]" : "bg-[#10131a]"
            }`}
            style={{ left: isDark ? "22px" : "2px" }}
          />
        </span>
      </button>

      {/* Main Container */}
      <div className="flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center md:min-h-[calc(100vh-5rem)]">
        <div
          className={`w-full max-w-sm border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] transition-colors duration-300 sm:p-8 ${
            isDark ? "border-white/20 bg-[#16191f]" : "border-black/10 bg-white"
          }`}
          style={{ borderRadius: "32px" }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-lg ${
                isDark ? "text-[#0b1112]" : "text-white"
              }`}
              style={{
                backgroundImage: "linear-gradient(135deg, #2ce88f 0%, #1ab370 100%)",
              }}
            >
              M
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em]">INSAAN</h1>
            <p
              className={`mt-1 text-[14px] ${
                isDark ? "text-white/60" : "text-[#636e84]"
              }`}
            >
              {activeTab === "login"
                ? "Welcome back to the literary platform"
                : "Join our community of writers and poets"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            className={`mb-6 flex rounded-full border p-1 ${
              isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                activeTab === "login"
                  ? "bg-[#2ce88f] text-[#0b1112]"
                  : isDark
                    ? "text-white/70 hover:text-white"
                    : "text-[#636e84] hover:text-[#10131a]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                activeTab === "register"
                  ? "bg-[#2ce88f] text-[#0b1112]"
                  : isDark
                    ? "text-white/70 hover:text-white"
                    : "text-[#636e84] hover:text-[#10131a]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-[13px] font-medium text-red-400">{apiError}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Email or Username
                </label>
                <input
                  id="login-email"
                  type="text"
                  placeholder="you@example.com or username"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 accent-[#2ce88f]"
                  />
                  <span className={`text-[13px] ${isDark ? "text-white/70" : "text-[#636e84]"}`}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-[13px] font-semibold text-[#2ce88f] transition hover:text-[#45f39f]"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full rounded-full border border-transparent bg-[#2ce88f] px-4 py-3 text-[14px] font-bold text-[#0b1112] transition hover:bg-[#45f39f] disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="register-email"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="register-username"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="username"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="register-displayname"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Display Name (Optional)
                </label>
                <input
                  id="register-displayname"
                  type="text"
                  placeholder="Your full name"
                  value={registerForm.displayName}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className={`block text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    isDark ? "text-white/70" : "text-[#596680]"
                  }`}
                >
                  Confirm Password
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${
                    isDark
                      ? "border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-[#2ce88f]/50 focus:bg-white/10"
                      : "border-black/10 bg-[#f8f9fb] text-[#10131a] placeholder-[#a0aac3] focus:border-[#2ce88f] focus:bg-white"
                  }`}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full rounded-full border border-transparent bg-[#2ce88f] px-4 py-3 text-[14px] font-bold text-[#0b1112] transition hover:bg-[#45f39f] disabled:opacity-50"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div
              className={`flex-1 h-px ${isDark ? "bg-white/15" : "bg-black/10"}`}
            />
            <span className={`text-[12px] ${isDark ? "text-white/50" : "text-[#a0aac3]"}`}>
              or continue with
            </span>
            <div
              className={`flex-1 h-px ${isDark ? "bg-white/15" : "bg-black/10"}`}
            />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              className={`rounded-xl border px-4 py-3 text-[13px] font-semibold transition ${
                isDark
                  ? "border-white/15 hover:border-white/25 hover:bg-white/5"
                  : "border-black/10 hover:border-black/20 hover:bg-black/5"
              }`}
            >
              Google
            </button>
          </div>

          {/* Footer */}
          <p
            className={`mt-6 text-center text-[12px] ${
              isDark ? "text-white/60" : "text-[#a0aac3]"
            }`}
          >
            {activeTab === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="font-semibold text-[#2ce88f] transition hover:text-[#45f39f]"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="font-semibold text-[#2ce88f] transition hover:text-[#45f39f]"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
      </div>
    </main>
  );
}

