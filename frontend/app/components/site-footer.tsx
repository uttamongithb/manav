"use client";

import Link from "next/link";

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

  return (
    <footer
      className={`mt-8 border-t ${
        isDark
          ? "border-white/10 bg-[#4f4f52] text-white"
          : "border-black/10 bg-[#555557] text-white"
      }`}
    >
      <div className="mx-auto w-[92vw] max-w-350 px-3 py-8 md:px-2 md:py-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:gap-x-7">
          <div className="space-y-10">
            <section>
              <h3 className="text-[27px] font-semibold tracking-[0.05em] text-[#f8d88f]">QUICK LINKS</h3>
              <ul className="mt-4 space-y-2.5">
                {QUICK_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[16px] leading-snug text-white transition hover:text-[#10c4ff]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-[27px] font-semibold tracking-[0.05em] text-[#f8d88f]">FOLLOW US</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-7 min-w-7 items-center justify-center text-[23px] font-semibold text-white transition hover:text-[#10c4ff]"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h3 className="text-[27px] font-semibold tracking-[0.05em] text-[#f8d88f]">SITE INFO</h3>
            <ul className="mt-4 space-y-2.5">
              {SITE_INFO_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[16px] leading-snug text-white transition hover:text-[#10c4ff]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-10">
            <section>
              <h3 className="text-[27px] font-semibold tracking-[0.05em] text-[#f8d88f]">OUR PLATFORM</h3>
              <ul className="mt-4 space-y-2.5">
                {PLATFORM_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[16px] leading-snug text-white transition hover:text-[#10c4ff]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="whitespace-nowrap text-[25px] font-semibold tracking-[0.04em] text-[#f8d88f]">
                DOWNLOAD INSAAN APP
              </h3>
              <div className="mt-3 flex flex-nowrap gap-2.5">
                <a
                  href="#"
                  className="inline-flex h-10 shrink-0 items-center justify-center border border-white/20 bg-black/45 px-3.5 text-[13px] font-semibold text-white whitespace-nowrap"
                >
                  Get it on Google Play
                </a>
                <a
                  href="#"
                  className="inline-flex h-10 shrink-0 items-center justify-center border border-white/20 bg-black/45 px-3.5 text-[13px] font-semibold text-white whitespace-nowrap"
                >
                  Download on App Store
                </a>
              </div>
            </section>
          </div>

          <section>
            <h3 className="text-[27px] font-semibold tracking-[0.05em] text-[#f8d88f]">WRITE TO US</h3>
            <form className="mt-4 space-y-2.5" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="NAME"
                className="h-9 w-full rounded-none border border-transparent bg-white/88 px-3 text-[14px] text-[#10131a] outline-none placeholder:text-[#87909a] focus:border-[#10c4ff]"
              />
              <input
                type="email"
                placeholder="E-MAIL"
                className="h-9 w-full rounded-none border border-transparent bg-white/88 px-3 text-[14px] text-[#10131a] outline-none placeholder:text-[#87909a] focus:border-[#10c4ff]"
              />
              <select
                defaultValue=""
                className="h-9 w-full rounded-none border border-transparent bg-white/88 px-3 text-[14px] text-[#10131a] outline-none focus:border-[#10c4ff]"
              >
                <option value="" disabled>
                  SELECT CATEGORY
                </option>
                <option>General</option>
                <option>Support</option>
                <option>Feedback</option>
              </select>
              <textarea
                rows={5}
                placeholder="MESSAGE"
                className="w-full resize-none rounded-none border border-transparent bg-white/88 px-3 py-2 text-[14px] text-[#10131a] outline-none placeholder:text-[#87909a] focus:border-[#10c4ff]"
              />

              <label className="flex items-start gap-2 text-[14px] leading-snug text-white/92">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/60 bg-transparent" />
                <span>
                  I have read and I agree to INSAAN <Link href="/privacy-policy" className="text-[#10c4ff]">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 bg-[#10c4ff] px-6 text-[14px] font-semibold tracking-[0.06em] text-white transition hover:bg-[#35d1ff]"
              >
                <span>SEND MESSAGE</span>
              </button>
            </form>
          </section>
        </div>
      </div>

      <div className="border-t border-black/20 bg-[#2f3033]">
        <div className="mx-auto flex w-[92vw] max-w-350 flex-col items-center justify-between gap-2 px-3 py-3 md:flex-row md:px-2">
          <div className="flex items-center gap-4 text-[14px] font-semibold uppercase tracking-[0.03em] text-white">
            <Link href="/privacy-policy" className="transition hover:text-[#10c4ff]">
              Privacy Policy
            </Link>
            <Link href="/links" className="transition hover:text-[#10c4ff]">
              Terms of Use
            </Link>
            <Link href="/about-us" className="transition hover:text-[#10c4ff]">
              Copyright
            </Link>
          </div>
          <p className="text-[14px] text-white">© {year} INSAAN Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
