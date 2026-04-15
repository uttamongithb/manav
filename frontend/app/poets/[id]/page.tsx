"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/app/context/theme";
import { getPoetById } from "@/app/lib/poets-data";

type PoetWork = {
  id: string;
  type: "SHER" | "GHAZAL" | "NAZM";
  title: string;
  content: string;
  year: string;
};

function createWorks(name: string, signatureLine: string): PoetWork[] {
  return [
    {
      id: "w1",
      type: "SHER",
      title: `${name} - Signature Sher`,
      content: signatureLine,
      year: "Classic",
    },
    {
      id: "w2",
      type: "GHAZAL",
      title: `${name} - Ghazal Excerpt`,
      content: "Dil ki aawaz ko lafzon mein piro kar kehna, yahi us andaaz ki pehchan rahi.",
      year: "Selected Works",
    },
    {
      id: "w3",
      type: "NAZM",
      title: `${name} - Nazm Reflection`,
      content: "Lamho ko maani dena aur khamoshi ko alfaaz dena, isi safar ka hissa hai.",
      year: "Collected",
    },
    {
      id: "w4",
      type: "SHER",
      title: `${name} - Couplets`,
      content: "Har misre mein ek naya dariya, har soch mein ek nayi manzil milti hai.",
      year: "Archive",
    },
    {
      id: "w5",
      type: "GHAZAL",
      title: `${name} - Mehfil Piece`,
      content: "Jis bazm mein alfaaz chamke, wahi dilon ka aasra ban gayi.",
      year: "Archive",
    },
  ];
}

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

export default function PoetProfilePage() {
  const params = useParams<{ id: string }>();
  const poetId = String(params?.id ?? "").toLowerCase();
  const poet = getPoetById(poetId);
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"ALL" | "SHER" | "GHAZAL" | "NAZM">("ALL");

  if (!poet) {
    return (
      <main className={`min-h-screen px-4 py-10 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold">Poet not found</h1>
          <p className="mt-2 text-sm text-[#64748b]">This poet profile is not available.</p>
          <Link href="/poets" className="mt-5 inline-block rounded-full bg-[#2ce88f] px-5 py-2 text-sm font-semibold text-[#0b1112]">
            Back to Poets
          </Link>
        </div>
      </main>
    );
  }

  const works = createWorks(poet.name, poet.signatureLine);
  const filteredWorks = activeTab === "ALL" ? works : works.filter((work) => work.type === activeTab);
  const avatarSrc = poet.avatarUrl || buildAvatarFallbackDataUrl(poet.name);
  const completionPercent = 100;

  return (
    <main className={`relative isolate min-h-screen px-2 py-5 transition-colors duration-300 sm:px-4 md:h-screen md:overflow-hidden md:p-10 ${isDark ? "bg-[#0e1117] text-white" : "bg-[#f3f5f8] text-[#10131a]"}`}>
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
                  <img src={avatarSrc} alt={`${poet.name} profile photo`} className="h-full w-full object-cover" loading="eager" fetchPriority="high" />
                </div>

                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">{poet.name}</h1>

                <p className={`mt-1 text-[16px] font-medium ${isDark ? "text-white/70" : "text-[#3f4656]"}`}>
                  {poet.location}
                </p>
                <p className={`mt-1 text-[14px] ${isDark ? "text-white/50" : "text-[#636e84]"}`}>
                  {poet.years}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {poet.group.map((group) => (
                    <span key={group} className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-2.5 py-1 text-[13px] font-semibold text-emerald-300">
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-2xl border p-3 ${
                  isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                <div className={`mb-1.5 flex items-center justify-between text-[13px] ${isDark ? "text-white/75" : "text-[#505a6f]"}`}>
                  <span>Profile completion</span>
                  <span className="font-semibold">{completionPercent}%</span>
                </div>
                <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                  <div className="h-full rounded-full bg-[#2ce88f]" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div
                className={`rounded-2xl border p-3 ${
                  isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                <p className={`text-[13px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#657086]"}`}>Bio</p>
                <p className={`mt-1.5 text-[14px] leading-relaxed ${isDark ? "text-white/80" : "text-[#2f3644]"}`}>
                  {poet.shortBio}
                </p>
              </div>

              <div
                className={`grid grid-cols-3 gap-2 rounded-2xl border p-2.5 text-center ${
                  isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"
                }`}
              >
                {[
                  { label: "Sher", value: String(poet.stats.sher) },
                  { label: "Ghazal", value: String(poet.stats.ghazal) },
                  { label: "Nazm", value: String(poet.stats.nazm) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[17px] font-semibold">{item.value}</p>
                    <p className={`text-[12px] ${isDark ? "text-white/60" : "text-[#5f687b]"}`}>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-2xl border p-2 ${isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-[#f8f9fb]"}`}>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/poets"
                    className="w-full rounded-full bg-[#2ce88f] px-4 py-2.5 text-center text-[15px] font-bold text-[#0b1112] transition hover:bg-[#45f39f]"
                  >
                    Back to Poets
                  </Link>
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
                  {(["ALL", "SHER", "GHAZAL", "NAZM"] as const).map((tab) => {
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
                  <Link
                    href="/poets"
                    className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] transition ${
                      isDark
                        ? "border-[#2ce88f]/45 bg-[#2ce88f]/15 text-[#a4f9cf] hover:bg-[#2ce88f]/25"
                        : "border-[#0a8a5b]/35 bg-[#eaf7ef] text-[#0a8a5b] hover:bg-[#dff2e7]"
                    }`}
                  >
                    POETS ARCHIVE
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
                        Signature
                      </p>
                      <h2 className={`mt-1 text-[28px] font-semibold leading-tight ${isDark ? "text-white/92" : "text-[#202634]"}`}>
                        {poet.name}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                        isDark
                          ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                          : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                      }`}
                    >
                      Poet Profile
                    </span>
                  </div>

                  <blockquote className={`mt-4 border-l-2 pl-3 text-[16px] italic ${isDark ? "border-white/20 text-white/80" : "border-black/20 text-[#304831]"}`}>
                    {poet.signatureLine}
                  </blockquote>
                  <p className={`mt-4 text-[15px] leading-relaxed ${isDark ? "text-white/75" : "text-[#3b455a]"}`}>
                    {poet.shortBio}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    isDark ? "border-white/20 bg-[#17181d]" : "border-black/10 bg-[#f8f9fb]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                    <div>
                      <h3 className={`text-[22px] font-semibold ${isDark ? "text-white/90" : "text-[#202634]"}`}>
                        Literary Works
                      </h3>
                      <p className={`mt-1 text-[13px] ${isDark ? "text-white/62" : "text-[#70798d]"}`}>
                        Highlighted collection and reference pieces.
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        isDark
                          ? "border-[#8cf8c1]/45 bg-[#2ce88f]/10 text-[#8cf8c1]"
                          : "border-[#00a86b]/35 bg-[#00a86b]/10 text-[#0a8a5b]"
                      }`}
                    >
                      {filteredWorks.length} works
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredWorks.map((work) => (
                      <article
                        key={work.id}
                        className={`rounded-2xl border p-4 ${isDark ? "border-white/20 bg-[#1a1c22]" : "border-black/10 bg-white"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-[17px] font-semibold">{work.title}</h4>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white/10 text-white/80" : "bg-black/6 text-[#516751]"}`}>
                            {work.type} • {work.year}
                          </span>
                        </div>
                        <p className={`mt-2 text-[15px] leading-relaxed ${isDark ? "text-white/82" : "text-[#2f3644]"}`}>
                          {work.content}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
