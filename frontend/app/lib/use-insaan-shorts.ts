"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "./api-base";
import { INSAAN_RECENT_CARDS } from "./insaan-recent-cards";

export type ShortCard = {
  id?: string;
  title: string;
  image: string;
  video: string;
};

export function useInsaanShorts() {
  const [shorts, setShorts] = useState<ShortCard[]>(INSAAN_RECENT_CARDS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchShorts = async () => {
      try {
        const backendUrl = getApiBaseUrl();
        const res = await fetch(`${backendUrl}/posts/public?section=INSAAN_RECENT`);
        if (!res.ok) throw new Error("Failed to fetch shorts");
        
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          const dbShorts: ShortCard[] = data.map((post: any) => ({
            id: post.id,
            title: post.content || "Untitled Short",
            image: post.avatarUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80",
            video: post.videoUrl,
          })).filter((card) => !!card.video); // Only include posts with a video URL

          setShorts([...dbShorts, ...INSAAN_RECENT_CARDS]);
        }
      } catch (err) {
        console.error("Failed to load Insaan shorts:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchShorts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { shorts, isLoading };
}
