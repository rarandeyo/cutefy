import { useSyncExternalStore, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { fetchAllSavedTracks } from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";

export const useSavedTracks = () => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const allTracks = cachedTracks ?? [];
  const [isLoadingTracks, startLoadingTransition] = useTransition();

  const handleLoadTracks = (onComplete?: () => void) => {
    startLoadingTransition(async () => {
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        console.error("Failed to get access token");
        return;
      }
      const tracks = await fetchAllSavedTracks(tokenResult.data.accessToken);
      trackCache.set(tracks);
      onComplete?.();
    });
  };

  return { allTracks, isLoadingTracks, handleLoadTracks };
};
