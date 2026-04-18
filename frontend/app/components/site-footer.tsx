import Link from "next/link";

type SiteFooterProps = {
  isDark?: boolean;
};

const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Poets", href: "/poets" },
  { label: "Public Feed", href: "/public-feed" },
  { label: "Donate", href: "/donate" },
  { label: "Archives", href: "/archives" },
  { label: "EBook Download", href: "/ebook-download" },
];

const COMMUNITY_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Links", href: "/links" },
  { label: "My Profile", href: "/my-profile" },
  { label: "Login", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/links" },
  { label: "Copyright", href: "/about-us" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "X", href: "https://x.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "Telegram", href: "https://t.me" },
];

export function SiteFooter({ isDark = false }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const sectionTitleClass = `text-[11px] font-bold uppercase tracking-[0.16em] ${
    isDark ? "text-[#84efbc]" : "text-[#0a8a5b]"
  }`;
  const navLinkClass = `text-[15px] leading-tight transition-colors ${
    isDark ? "text-white/84 hover:text-[#8efcc7]" : "text-[#234633] hover:text-[#0a8a5b]"
  }`;

  return (
    <footer
      className={`relative mt-10 overflow-hidden border-t ${
        isDark
          ? "border-white/10 bg-[radial-gradient(120%_120%_at_10%_0%,#23342c_0%,#15201b_48%,#0d1411_100%)] text-[#e8f5ef]"
          : "border-[#0a8a5b]/20 bg-[radial-gradient(120%_120%_at_10%_0%,#f3fbf5_0%,#e4efe6_52%,#d5e6d8_100%)] text-[#1d3728]"
      }`}
    >
      <div className="mx-auto w-[92vw] max-w-350 px-3 pb-10 pt-12 md:px-2 md:pt-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-8 lg:grid-cols-12">
          <section className="col-span-2 md:col-span-2 lg:col-span-5">
            <p className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${isDark ? "text-[#8efcc7]" : "text-[#0a8a5b]"}`}>
              INSAAN Foundation
            </p>
            <h2 className={`mt-4 max-w-[28ch] text-[25px] font-semibold leading-[1.25] md:text-[29px] ${isDark ? "text-white" : "text-[#173222]"}`}>
              Literature that connects voices, stories, and communities.
            </h2>
            <p className={`mt-4 max-w-[42ch] text-[15px] leading-relaxed ${isDark ? "text-white/72" : "text-[#315442]"}`}>
              Discover poets, read public submissions, and support a growing literary ecosystem through INSAAN.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/poets"
                className={`inline-flex h-10 items-center border px-5 text-[13px] font-semibold uppercase tracking-[0.08em] transition ${
                  isDark
                    ? "border-[#74ebb7]/40 bg-[#182822] text-[#e7fff2] hover:bg-[#1f3129]"
                    : "border-[#0a8a5b]/25 bg-white text-[#214130] hover:bg-[#ebf6ee]"
                }`}
              >
                Explore Poets
              </Link>
              <Link
                href="/donate"
                className={`inline-flex h-10 items-center border px-5 text-[13px] font-semibold uppercase tracking-[0.08em] transition ${
                  isDark
                    ? "border-[#74ebb7]/40 text-[#cbf8de] hover:bg-[#1d2d26]"
                    : "border-[#0a8a5b]/30 text-[#0a8a5b] hover:bg-[#e8f4eb]"
                }`}
              >
                Support INSAAN
              </Link>
            </div>
          </section>

          <section className="min-w-0 lg:col-span-2">
            <h3 className={sectionTitleClass}>Explore</h3>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2.5">
              {PRIMARY_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="min-w-0 lg:col-span-2">
            <h3 className={sectionTitleClass}>Community</h3>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2.5">
              {COMMUNITY_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="col-span-2 space-y-7 md:col-span-2 lg:col-span-3">
            <div>
              <h3 className={sectionTitleClass}>Connect</h3>
              <p className={`mt-4 text-[15px] leading-relaxed ${isDark ? "text-white/74" : "text-[#2f523f]"}`}>
                Have a question or collaboration idea?
              </p>
              <Link
                href="/contact-us"
                className={`mt-3 inline-flex h-10 items-center border px-5 text-[13px] font-semibold uppercase tracking-[0.08em] transition ${
                  isDark
                    ? "border-[#74ebb7]/40 text-[#cbf8de] hover:bg-[#1d2d26]"
                    : "border-[#0a8a5b]/30 text-[#0a8a5b] hover:bg-[#e8f4eb]"
                }`}
              >
                Contact Team
              </Link>
            </div>

            <div>
              <h3 className={sectionTitleClass}>Social</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-9 items-center border px-3 text-[12px] font-semibold uppercase tracking-[0.07em] transition ${
                      isDark
                        ? "border-white/14 text-white/84 hover:border-[#8efcc7]/45 hover:text-[#8efcc7]"
                        : "border-[#0a8a5b]/20 text-[#2a4c39] hover:border-[#0a8a5b]/45 hover:text-[#0a8a5b]"
                    }`}
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className={`${isDark ? "bg-[#0d1511]" : "bg-[#d8e8db]"}`}>
        <div className="mx-auto flex w-[92vw] max-w-350 flex-col gap-3 px-3 py-4 md:flex-row md:items-center md:justify-between md:px-2">
          <p className={`text-[14px] ${isDark ? "text-white/84" : "text-[#224634]"}`}>
            © {year} INSAAN Foundation. All rights reserved.{" "}
            <span className={isDark ? "text-white/60" : "text-[#315442]"}>•</span> Developed by{" "}
            <a
              href="https://www.uttambhartiya.in/"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold transition ${
                isDark ? "text-[#8efcc7] hover:text-[#74ebb7]" : "text-[#0a8a5b] hover:text-[#068149]"
              }`}
            >
              Uttam Bhartiya
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[13px] font-semibold uppercase tracking-[0.06em] transition ${
                  isDark ? "text-white/80 hover:text-[#8efcc7]" : "text-[#234633] hover:text-[#0a8a5b]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
