import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { fetchAllSavedTracks, type FetchProgress } from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";

const fetchTracks = async (
  startTransition: React.TransitionStartFunction,
  setProgress: React.Dispatch<React.SetStateAction<FetchProgress | null>>,
  onComplete?: () => void,
) => {
  startTransition(async () => {
    const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
    if (tokenResult.error || !tokenResult.data) {
      console.error("Failed to get access token");
      return;
    }
    const tracks = await fetchAllSavedTracks(tokenResult.data.accessToken, setProgress);
    trackCache.set(tracks);
    setProgress(null);
    onComplete?.();
  });
};

export const useSavedTracks = (onAutoFetchComplete?: () => void) => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const allTracks = cachedTracks ?? [];
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [progress, setProgress] = useState<FetchProgress | null>(null);

  const onAutoFetchCompleteRef = useRef(onAutoFetchComplete);
  onAutoFetchCompleteRef.current = onAutoFetchComplete;

  // キャッシュがない場合、マウント時に自動取得
  const autoFetchStarted = useRef(false);
  useEffect(() => {
    if (cachedTracks !== null || autoFetchStarted.current) return;
    autoFetchStarted.current = true;
    fetchTracks(startLoadingTransition, setProgress, () => onAutoFetchCompleteRef.current?.());
  }, [cachedTracks, startLoadingTransition]);

  const handleLoadTracks = (onComplete?: () => void) => {
    fetchTracks(startLoadingTransition, setProgress, onComplete);
  };

  return { allTracks, isLoadingTracks, handleLoadTracks, progress };
};
