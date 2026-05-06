"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "./api-base";

export type ShortCard = {
  id?: string;
  title: string;
  image: string;
  video: string;
};

export function useInsaanShorts() {
  const [shorts, setShorts] = useState<ShortCard[]>([]);
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
            image: "", // We use the video itself as the thumbnail now
            video: post.videoUrl,
          })).filter((card) => !!card.video); // Only include posts with a video URL

          setShorts(dbShorts);
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
