"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInsaanShorts } from "@/app/lib/use-insaan-shorts";
import { useAuth } from "@/app/context/auth";

function ShortsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { shorts } = useInsaanShorts();
  const [showRestriction, setShowRestriction] = useState(false);

  useEffect(() => {
    if (showRestriction) {
      const timer = setTimeout(() => setShowRestriction(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showRestriction]);

  useEffect(() => {
    // Initial scroll based on search param
    const vParam = searchParams.get("v");
    if (vParam !== null) {
      const idx = parseInt(vParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < shorts.length) {
        // Timeout to ensure DOM is ready
        setTimeout(() => {
          const container = containerRef.current;
          if (container) {
            const child = container.children[idx + 1] as HTMLElement; // +1 because Link is the first child
            if (child) {
              container.scrollTop = child.offsetTop;
            }
          }
        }, 100);
      }
    }
  }, [searchParams, shorts.length]);

  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      rootMargin: "0px",
      threshold: 0.7, // Trigger when 70% of video is visible
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector("video");
        if (!video) return;

        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          video.muted = false; // Try with sound
          video.play().catch(() => {
            // Autoplay with audio was prevented, fallback to muted
            video.muted = true;
            void video.play().catch(console.error);
          });
        } else {
          video.pause();
          video.currentTime = 0; // Reset video when out of view
          video.muted = true; // Reset to muted for next entry
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const container = containerRef.current;
    if (container) {
      Array.from(container.children).forEach((child) => {
        observer.observe(child);
      });
    }

    return () => observer.disconnect();
  }, [shorts]);

  const togglePlayPause = (idx: number) => {
    const video = videoRefs.current[idx];
    if (!video) return;
    if (video.paused) {
      video.muted = false; // Unmute on manual play
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white sm:bg-[#121212] sm:flex sm:items-center sm:justify-center">
      {/* Mobile-optimized container */}
      <div 
        ref={containerRef}
        className="h-[100dvh] w-full max-w-[480px] overflow-y-scroll overflow-x-hidden snap-y snap-mandatory bg-black relative scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:h-[90vh] sm:rounded-[30px] sm:border sm:border-white/10"
      >
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-6 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 transition hover:bg-black/60"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        {shorts.map((card, idx) => (
          <div 
            key={card.id || card.title} 
            data-index={idx}
            className="h-[100dvh] w-full snap-start snap-always relative sm:h-full"
            onClick={() => togglePlayPause(idx)}
          >
            {card.video ? (
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={`${card.video}#t=0.1`}
                className="h-full w-full object-cover"
                loop
                playsInline
              />
            ) : (
              <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
                <p>No video source</p>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />
            
            {/* Mute toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const video = videoRefs.current[idx];
                if (video) video.muted = !video.muted;
                // Force a re-render or just let the native state handle it
              }}
              className="absolute top-6 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 transition hover:bg-black/60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            
            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 pointer-events-none">
              <h2 className="text-xl font-bold mb-2 shadow-sm drop-shadow-md" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                {card.title}
              </h2>
              <p className="text-white/80 text-sm mb-4 drop-shadow-md">
                Insaan Recent Shorts
              </p>
            </div>
            
            {/* Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center pointer-events-auto">
              <button 
                className="group flex flex-col items-center gap-1"
              >
                <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition group-hover:bg-white/20">
                  <span className="text-2xl leading-none">♡</span>
                </div>
                <span className="text-xs font-medium drop-shadow-md">Like</span>
              </button>
              
              <button 
                className="group flex flex-col items-center gap-1"
              >
                <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition group-hover:bg-white/20">
                  <span className="text-xl leading-none">💬</span>
                </div>
                <span className="text-xs font-medium drop-shadow-md">Comment</span>
              </button>
              
              <button className="group flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition group-hover:bg-white/20">
                  <span className="text-xl leading-none">↗</span>
                </div>
                <span className="text-xs font-medium drop-shadow-md">Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShortsPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ShortsContent />
    </Suspense>
  );
}