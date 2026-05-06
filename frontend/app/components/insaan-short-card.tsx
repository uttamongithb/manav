"use client";

import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (window.innerWidth < 768) { // Only for mobile/small screens
            if (entry.isIntersecting) {
              handlePlay(true); // Muted for mobile auto-play
            } else {
              handleStop();
            }
          }
        });
      },
      { threshold: 0.6 } // Trigger when 60% of card is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePlay = (muted: boolean) => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      setIsMuted(muted);
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => {
          // Fallback to muted if unmuted was blocked
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            void videoRef.current.play().then(() => setIsPlaying(true));
          }
        });
      }
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsMuted(true);
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      setIsHovered(true);
      handlePlay(false); // Try to play with sound on desktop hover
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setIsHovered(false);
      handleStop();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  return (
    <article
      ref={containerRef}
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
        <div className="relative aspect-[5/6] overflow-hidden rounded-2xl bg-[#0a0a0a] sm:aspect-[4/6] sm:rounded-3xl">
          {card.video ? (
            <video
              ref={videoRef}
              src={`${card.video}#t=0.1`}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <span className="text-white/20">No Video</span>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

          {/* Mute/Unmute toggle (only visible when playing) */}
          {isPlaying && (
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 transition hover:bg-black/60 sm:h-10 sm:w-10"
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.38.28-.79.51-1.25.66v2.02c1 .21 1.92-.12 2.72-.61l2.01 2.01L21 21l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor">
                  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>
          )}

          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isHovered || isPlaying ? "opacity-0" : "opacity-100"}`}>
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
