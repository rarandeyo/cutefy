import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { fetchAllSavedTracks, type FetchProgress } from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";

const fetchTracks = async (
  startTransition: React.TransitionStartFunction,
  setProgress: React.Dispatch<React.SetStateAction<FetchProgress | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  onComplete?: () => void,
) => {
  startTransition(async () => {
    try {
      setError(null);
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        setError("認証エラーが発生しました");
        return;
      }
      const tracks = await fetchAllSavedTracks(tokenResult.data.accessToken, setProgress);
      trackCache.set(tracks);
      setProgress(null);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "曲の取得中にエラーが発生しました");
      setProgress(null);
    }
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
  const [error, setError] = useState<string | null>(null);

  const onAutoFetchCompleteRef = useRef(onAutoFetchComplete);
  onAutoFetchCompleteRef.current = onAutoFetchComplete;

  // キャッシュがない場合、マウント時に自動取得
  const autoFetchStarted = useRef(false);
  useEffect(() => {
    if (cachedTracks !== null || autoFetchStarted.current) return;
    autoFetchStarted.current = true;
    fetchTracks(startLoadingTransition, setProgress, setError, () =>
      onAutoFetchCompleteRef.current?.(),
    );
  }, [cachedTracks, startLoadingTransition]);

  const handleLoadTracks = (onComplete?: () => void) => {
    fetchTracks(startLoadingTransition, setProgress, setError, onComplete);
  };

  return { allTracks, isLoadingTracks, handleLoadTracks, progress, error };
};
