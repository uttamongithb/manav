"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { SiteNavbar } from "@/app/components/site-navbar";
import { SiteFooter } from "@/app/components/site-footer";
import { useTheme } from "@/app/context/theme";
import { getApiBaseUrl } from "@/app/lib/api-base";

type Frequency = "one-time" | "monthly";

const DONATION_PRESETS = [
  { amount: 250, impact: "Helps archive one short-form poem" },
  { amount: 500, impact: "Supports multilingual editing for one feature" },
  { amount: 1000, impact: "Funds one curated weekly reading collection" },
  { amount: 2500, impact: "Supports writer fellowship micro-grants" },
];

const IMPACT_SPLIT = [
  { label: "Writers and Editorial Grants", value: 46 },
  { label: "Archive and Digital Preservation", value: 28 },
  { label: "Community Programs and Events", value: 16 },
  { label: "Platform Operations", value: 10 },
];

export default function DonatePage() {
  const { isDark, setIsDark } = useTheme();
  const backendUrl = getApiBaseUrl();

  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [amount, setAmount] = useState(1000);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedImpact = useMemo(() => {
    const sorted = [...DONATION_PRESETS].sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount));
    return sorted[0]?.impact ?? "Supports literary preservation and creative work.";
  }, [amount]);

  const submitPledge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${backendUrl}/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donorName,
          email: donorEmail,
          category: "Donation Pledge",
          message: `Frequency: ${frequency}\nAmount: INR ${amount}\nNote: ${note || "No note provided."}`,
        }),
      });

      if (!res.ok) {
        throw new Error("submit_failed");
      }

      setSuccessMsg("Thank you. Your donation intent was received and our team will contact you with secure payment options.");
      setDonorName("");
      setDonorEmail("");
      setNote("");
      setAmount(1000);
      setFrequency("one-time");
    } catch {
      setErrorMsg("We could not submit your donation intent right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
      <SiteNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} activeHref="/donate" />

      <section className="mx-auto w-[92vw] md:w-[80vw] max-w-none px-1 py-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className={`overflow-hidden rounded-4xl border ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
            <div className="p-6 md:p-8">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#5e775f]"}`}>
                Support INSAAN
              </p>
              <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] md:text-[50px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Help Keep Literature
                <br />
                Open, Living, and Accessible.
              </h1>
              <p className={`mt-3 max-w-3xl text-[15px] leading-relaxed ${isDark ? "text-white/72" : "text-[#496048]"}`}>
                Your contribution supports poets, translators, archival efforts, and community initiatives. Built with inspiration from leading donation UX patterns, this flow keeps impact, trust, and action in one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] ${isDark ? "border-[#8cf8c1]/45 bg-[#2ce88f] text-[#09120d]" : "border-[#0a8a5b]/35 bg-[#0a8a5b] text-white"}`}>
                  100% Mission Focused
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] ${isDark ? "border-white/12 text-white/75" : "border-black/10 text-[#4f684f]"}`}>
                  Transparent Allocation
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] ${isDark ? "border-white/12 text-white/75" : "border-black/10 text-[#4f684f]"}`}>
                  Community-led Programs
                </span>
              </div>
            </div>

            <div className={`grid gap-3 border-t p-5 md:grid-cols-2 md:p-6 ${isDark ? "border-white/12" : "border-black/10"}`}>
              {DONATION_PRESETS.map((item) => {
                const selected = amount === item.amount;
                return (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => setAmount(item.amount)}
                    className={`rounded-2xl border p-4 text-left transition ${selected
                      ? isDark
                        ? "border-[#8cf8c1]/50 bg-[#2ce88f]/18"
                        : "border-[#0a8a5b]/40 bg-[#edf8f2]"
                      : isDark
                        ? "border-white/12 bg-[#101318] hover:bg-[#151a22]"
                        : "border-black/10 bg-[#f8fbf6] hover:bg-[#eef6eb]"}`}
                  >
                    <p className="text-[22px] font-semibold">INR {item.amount}</p>
                    <p className={`mt-1 text-[13px] ${isDark ? "text-white/68" : "text-[#597059]"}`}>{item.impact}</p>
                  </button>
                );
              })}
            </div>
          </article>

          <aside className={`rounded-3xl border p-5 md:p-6 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-[#b8f7d8]" : "text-[#0b7a52]"}`}>
              Transparency Snapshot
            </p>
            <div className="mt-3 space-y-3">
              {IMPACT_SPLIT.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-4 text-[12px]">
                    <span className={isDark ? "text-white/78" : "text-[#2f4b34]"}>{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/8"}`}>
                    <div className="h-full rounded-full bg-[#2ce88f]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${isDark ? "border-white/12 bg-[#11161d]" : "border-black/10 bg-[#f6faf4]"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a8a5b]">Estimated Impact</p>
              <p className={`mt-2 text-[14px] leading-relaxed ${isDark ? "text-white/85" : "text-[#2e4731]"}`}>
                Your selected amount of <strong>INR {amount}</strong> {frequency === "monthly" ? "every month" : "as a one-time donation"} {""}
                can: {selectedImpact}
              </p>
              <Link href="/contact-us" className="mt-3 inline-flex rounded-full border border-[#0a8a5b]/30 bg-[#effaf4] px-4 py-2 text-[12px] font-bold tracking-[0.08em] text-[#0a8a5b] transition hover:bg-[#e3f5eb]">
                TALK TO OUR TEAM
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className={`rounded-3xl border p-5 md:p-6 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white/94"}`}>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
              Why People Donate
            </h2>
            <div className="mt-4 space-y-3">
              {[
                "To preserve poetry and literary heritage.",
                "To support independent and emerging voices.",
                "To fund translation and multilingual access.",
                "To keep reading spaces free and open.",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#2ce88f]" />
                  <p className={`text-[14px] leading-7 ${isDark ? "text-white/75" : "text-[#355138]"}`}>{line}</p>
                </div>
              ))}
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${isDark ? "border-white/12 bg-[#101318]" : "border-black/10 bg-[#f7faf5]"}`}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0a8a5b]">Trust Note</p>
              <p className={`mt-2 text-[13px] leading-6 ${isDark ? "text-white/72" : "text-[#4e644e]"}`}>
                Donation intents are recorded instantly and reviewed by the INSAAN admin team for secure payment follow-up.
              </p>
            </div>
          </div>

          <form onSubmit={submitPledge} className={`rounded-3xl border p-5 md:p-6 ${isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-white"}`}>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
              Submit Donation Intent
            </h2>
            <p className={`mt-2 text-[14px] ${isDark ? "text-white/70" : "text-[#4f664f]"}`}>
              Share your preferred amount and contact details. We will send verified payment options.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFrequency("one-time")}
                className={`rounded-xl border px-4 py-3 text-[13px] font-semibold tracking-[0.06em] transition ${frequency === "one-time"
                  ? "border-[#0a8a5b]/35 bg-[#eaf8f0] text-[#0a8a5b]"
                  : isDark
                    ? "border-white/12 text-white/75"
                    : "border-black/10 text-[#486248]"}`}
              >
                ONE-TIME
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`rounded-xl border px-4 py-3 text-[13px] font-semibold tracking-[0.06em] transition ${frequency === "monthly"
                  ? "border-[#0a8a5b]/35 bg-[#eaf8f0] text-[#0a8a5b]"
                  : isDark
                    ? "border-white/12 text-white/75"
                    : "border-black/10 text-[#486248]"}`}
              >
                MONTHLY
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Amount (INR)</span>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(100, Number(e.target.value || 0)))}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Name</span>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                  placeholder="Your name"
                  required
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Email</span>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#fbfcfa] px-4 text-[14px] outline-none transition focus:border-[#0a8a5b]"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e775f]">Message (Optional)</span>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#fbfcfa] px-4 py-3 text-[14px] outline-none transition placeholder:text-[#8c9a8c] focus:border-[#0a8a5b]"
                placeholder="Tell us what you want to support most."
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
              {isSubmitting ? "Submitting..." : "Submit Donation Intent"}
            </button>
          </form>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  );
}
