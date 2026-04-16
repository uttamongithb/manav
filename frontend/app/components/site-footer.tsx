"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiBaseUrl } from "@/app/lib/api-base";

type SiteFooterProps = {
  isDark?: boolean;
};

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Poets", href: "/poets" },
  { label: "Public Feed", href: "/public-feed" },
  { label: "Donate", href: "/donate" },
  { label: "Links", href: "/links" },
  { label: "EBook Download", href: "/ebook-download" },
];

const SITE_INFO_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Archives", href: "/archives" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Login", href: "/login" },
];

const PLATFORM_LINKS = [
  { label: "INSAAN Home", href: "/" },
  { label: "Poets Directory", href: "/poets" },
  { label: "Public Feed", href: "/public-feed" },
  { label: "My Profile", href: "/my-profile" },
  { label: "Links Page", href: "/links" },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: "f",
  },
  {
    label: "X",
    href: "https://x.com",
    icon: "X",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: ">",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: "o",
  },
  {
    label: "Telegram",
    href: "https://t.me",
    icon: ">>",
  },
];

export function SiteFooter({ isDark = false }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const backendUrl = getApiBaseUrl();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!agreed) {
      setSuccessMsg(null);
      setErrorMsg("Please accept the privacy policy before submitting.");
      return;
    }

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

      setName("");
      setEmail("");
      setCategory("");
      setMessage("");
      setAgreed(false);
      setSuccessMsg("Message sent successfully. Our team will review it shortly.");
    } catch {
      setErrorMsg("Unable to send message right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer
      className={`mt-8 border-t ${
        isDark
          ? "border-white/10 bg-[#111a16] text-[#e7f4ee]"
          : "border-black/10 bg-[#eaf3ea] text-[#1c3527]"
      }`}
    >
      <div className="mx-auto w-[92vw] max-w-350 px-3 py-8 md:px-2 md:py-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:gap-x-7">
          <div className="space-y-10">
            <section>
              <h3 className={`text-[27px] font-semibold tracking-[0.05em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>QUICK LINKS</h3>
              <ul className="mt-4 space-y-2.5">
                {QUICK_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={`text-[16px] leading-snug transition ${isDark ? "text-white/86 hover:text-[#8cf8c1]" : "text-[#2b4634] hover:text-[#0a8a5b]"}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className={`text-[27px] font-semibold tracking-[0.05em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>FOLLOW US</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className={`inline-flex h-7 min-w-7 items-center justify-center text-[23px] font-semibold transition ${isDark ? "text-white/86 hover:text-[#8cf8c1]" : "text-[#2b4634] hover:text-[#0a8a5b]"}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h3 className={`text-[27px] font-semibold tracking-[0.05em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>SITE INFO</h3>
            <ul className="mt-4 space-y-2.5">
              {SITE_INFO_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={`text-[16px] leading-snug transition ${isDark ? "text-white/86 hover:text-[#8cf8c1]" : "text-[#2b4634] hover:text-[#0a8a5b]"}`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-10">
            <section>
              <h3 className={`text-[27px] font-semibold tracking-[0.05em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>OUR PLATFORM</h3>
              <ul className="mt-4 space-y-2.5">
                {PLATFORM_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={`text-[16px] leading-snug transition ${isDark ? "text-white/86 hover:text-[#8cf8c1]" : "text-[#2b4634] hover:text-[#0a8a5b]"}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className={`whitespace-nowrap text-[25px] font-semibold tracking-[0.04em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>
                DOWNLOAD INSAAN APP
              </h3>
              <div className="mt-3 flex flex-nowrap gap-2.5">
                <Link
                  href="/contact-us"
                  className={`inline-flex h-10 shrink-0 items-center justify-center border px-3.5 text-[13px] font-semibold whitespace-nowrap transition ${isDark ? "border-[#2ce88f]/35 bg-[#15231b] text-[#dff7ea] hover:bg-[#1a2b21]" : "border-[#0a8a5b]/25 bg-white text-[#1f3a2a] hover:bg-[#e4f3ea]"}`}
                >
                  Get it on Google Play
                </Link>
                <Link
                  href="/contact-us"
                  className={`inline-flex h-10 shrink-0 items-center justify-center border px-3.5 text-[13px] font-semibold whitespace-nowrap transition ${isDark ? "border-[#2ce88f]/35 bg-[#15231b] text-[#dff7ea] hover:bg-[#1a2b21]" : "border-[#0a8a5b]/25 bg-white text-[#1f3a2a] hover:bg-[#e4f3ea]"}`}
                >
                  Download on App Store
                </Link>
              </div>
            </section>
          </div>

          <section>
            <h3 className={`text-[27px] font-semibold tracking-[0.05em] ${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>WRITE TO US</h3>
            <form className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NAME"
                className={`h-9 w-full rounded-none border px-3 text-[14px] outline-none transition placeholder:text-[#87909a] ${isDark ? "border-white/12 bg-white/92 text-[#10131a] focus:border-[#2ce88f]" : "border-[#0a8a5b]/15 bg-white text-[#10131a] focus:border-[#0a8a5b]"}`}
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-MAIL"
                className={`h-9 w-full rounded-none border px-3 text-[14px] outline-none transition placeholder:text-[#87909a] ${isDark ? "border-white/12 bg-white/92 text-[#10131a] focus:border-[#2ce88f]" : "border-[#0a8a5b]/15 bg-white text-[#10131a] focus:border-[#0a8a5b]"}`}
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`h-9 w-full rounded-none border px-3 text-[14px] outline-none transition ${isDark ? "border-white/12 bg-white/92 text-[#10131a] focus:border-[#2ce88f]" : "border-[#0a8a5b]/15 bg-white text-[#10131a] focus:border-[#0a8a5b]"}`}
                required
              >
                <option value="" disabled>
                  SELECT CATEGORY
                </option>
                <option value="General">General</option>
                <option value="Support">Support</option>
                <option value="Feedback">Feedback</option>
              </select>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="MESSAGE"
                className={`w-full resize-none rounded-none border px-3 py-2 text-[14px] outline-none transition placeholder:text-[#87909a] ${isDark ? "border-white/12 bg-white/92 text-[#10131a] focus:border-[#2ce88f]" : "border-[#0a8a5b]/15 bg-white text-[#10131a] focus:border-[#0a8a5b]"}`}
                required
              />

              <label className={`flex items-start gap-2 text-[14px] leading-snug ${isDark ? "text-white/92" : "text-[#2b4634]"}`}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={`mt-1 h-4 w-4 rounded ${isDark ? "border-white/60 bg-transparent" : "border-[#0a8a5b]/40 bg-white"}`}
                  required
                />
                <span>
                  I have read and I agree to INSAAN <Link href="/privacy-policy" className={`${isDark ? "text-[#8cf8c1]" : "text-[#0a8a5b]"}`}>Privacy Policy</Link>
                </span>
              </label>

              {successMsg ? <p className="text-[13px] font-medium text-[#8cf8c1]">{successMsg}</p> : null}
              {errorMsg ? <p className="text-[13px] font-medium text-[#ffd1d1]">{errorMsg}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex h-10 items-center justify-center gap-2 px-6 text-[14px] font-semibold tracking-[0.06em] transition ${isDark ? "bg-[#2ce88f] text-[#0b1112] hover:bg-[#45f39f]" : "bg-[#0a8a5b] text-white hover:bg-[#0d9d67]"}`}
              >
                <span>{isSubmitting ? "SENDING..." : "SEND MESSAGE"}</span>
              </button>
            </form>
          </section>
        </div>
      </div>

      <div className={`border-t ${isDark ? "border-white/10 bg-[#0d1411]" : "border-[#0a8a5b]/15 bg-[#dcebdc]"}`}>
        <div className="mx-auto flex w-[92vw] max-w-350 flex-col items-center justify-between gap-2 px-3 py-3 md:flex-row md:px-2">
          <div className={`flex items-center gap-4 text-[14px] font-semibold uppercase tracking-[0.03em] ${isDark ? "text-white" : "text-[#23452f]"}`}>
            <Link href="/privacy-policy" className={`transition ${isDark ? "hover:text-[#8cf8c1]" : "hover:text-[#0a8a5b]"}`}>
              Privacy Policy
            </Link>
            <Link href="/links" className={`transition ${isDark ? "hover:text-[#8cf8c1]" : "hover:text-[#0a8a5b]"}`}>
              Terms of Use
            </Link>
            <Link href="/about-us" className={`transition ${isDark ? "hover:text-[#8cf8c1]" : "hover:text-[#0a8a5b]"}`}>
              Copyright
            </Link>
          </div>
          <p className={`text-[14px] ${isDark ? "text-white" : "text-[#23452f]"}`}>© {year} INSAAN Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
