"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/app/context/auth";
import { getApiBaseUrl } from "@/app/lib/api-base";
import { ContentPageShell } from "@/app/components/content-page-shell";
import { usePageContent } from "@/app/lib/page-content";

export default function ContactUsPage() {
  const { user } = useAuth();
  const backendUrl = getApiBaseUrl();
  const { content } = usePageContent("contact-us");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General Support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.displayName || user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${backendUrl}/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("submit_failed");
      }

      setMessage("");
      setSuccessMsg("Message sent successfully. Our team will review it from the admin inbox.");
    } catch {
      setErrorMsg("Unable to send your message right now. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentPageShell
      activeHref="/contact-us"
      eyebrow="Contact us"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
      ctaLabel={content.ctaLabel || "Back to Home"}
      ctaHref={content.ctaHref || "/"}
      children={
          <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[30px] border border-black/10 bg-white/95 p-6 md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5e775f]">Direct Inbox</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Send a message to INSAAN
              </h2>
              <p className="mt-3 text-[14px] leading-7 text-[#355138]">
                Share feedback, collaboration ideas, or support questions. Every submission is stored and reviewed in the admin panel.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Response Time", "24 to 48 hours"],
                  ["Visibility", "Admin inbox"],
                  ["Best For", "Support and feedback"],
                  ["Routing", "Categorized by topic"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-black/10 bg-[#f7faf5] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7f6b]">{label}</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#1f3722]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={submitMessage}
              className="rounded-[30px] border border-black/10 bg-white/95 p-6 md:p-7"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                    required
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                >
                  <option>General Support</option>
                  <option>Editorial & Partnerships</option>
                  <option>Feedback</option>
                  <option>Account Help</option>
                </select>
              </label>

              <label className="mt-3 block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Write your message here..."
                  className="w-full rounded-2xl border border-black/10 bg-[#fbfcfa] px-4 py-3 text-[14px] outline-none transition placeholder:text-[#8c9a8c] focus:border-[#0a8a5b]"
                  required
                />
              </label>

              {successMsg ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
                  {successMsg}
                </div>
              ) : null}

              {errorMsg ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
                  {errorMsg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#0a8a5b] px-6 text-[14px] font-semibold text-white transition hover:bg-[#0d9d67] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>
        }
    />
  );
}
