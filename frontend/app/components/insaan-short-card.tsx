"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ShortCard = {
  id?: string;
  title: string;
  image: string;
  video: string;
};

interface InsaanShortCardProps {
  card: ShortCard;
  idx: number;
  total: number;
  isDark: boolean;
}

export function InsaanShortCard({ card, idx, total, isDark }: InsaanShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      void videoRef.current.play().catch((err) => {
        console.error("Video playback failed:", err);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <article
      className={`group relative shrink-0 snap-start 
        w-[140px] min-w-[140px] max-w-none 
        sm:w-[180px] sm:min-w-[180px]
        md:w-[220px] md:min-w-[220px]
        lg:w-[260px] lg:min-w-[260px]
        ${idx === 0 ? "ml-0" : ""}
        ${idx === total - 1 ? "mr-4 md:mr-0" : ""}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/shorts?v=${idx}`} className="block">
        <div className="relative aspect-[5/6] overflow-hidden rounded-2xl sm:aspect-[4/6] sm:rounded-3xl">
          <Image
            src={card.image}
            alt={card.title}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 768px) 220px, 140px"
            unoptimized
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
              isHovered ? "opacity-0" : "opacity-100"
            }`}
          />
          
          {card.video && (
            <video
              ref={videoRef}
              src={card.video}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              loop
              muted
              playsInline
            />
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />

          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/58 text-white backdrop-blur-sm transition group-hover:scale-105 sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7" fill="currentColor">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
              </svg>
            </span>
          </div>
        </div>

        <h3
          className={`mt-2 line-clamp-2 text-[13px] font-semibold leading-snug sm:mt-3 sm:text-[14px] md:text-[16px] ${
            isDark ? "text-white/92" : "text-[#0e2742]"
          }`}
          style={{ fontFamily: "Georgia, Times New Roman, serif" }}
        >
          {card.title}
        </h3>
      </Link>
    </article>
  );
}
