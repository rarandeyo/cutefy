"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { loadSavedTracks } from "@/features/playlist-wizard/actions";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";

const fetchTracks = async (
  startTransition: React.TransitionStartFunction,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  onComplete?: () => void,
) => {
  startTransition(async () => {
    setError(null);
    const result = await loadSavedTracks();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    trackCache.set(result.tracks);
    onComplete?.();
  });
};

type SavedTracks = {
  allTracks: readonly TrackWithAddedAt[];
  isLoadingTracks: boolean;
  handleLoadTracks: (onComplete?: () => void) => void;
  error: string | null;
};

export const useSavedTracks = (onAutoFetchComplete?: () => void): SavedTracks => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const allTracks = cachedTracks ?? [];
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onAutoFetchCompleteRef = useRef(onAutoFetchComplete);
  onAutoFetchCompleteRef.current = onAutoFetchComplete;

  // キャッシュがない場合、マウント時に自動取得
  const autoFetchStarted = useRef(false);
  useEffect(() => {
    if (cachedTracks !== null || autoFetchStarted.current) return;
    autoFetchStarted.current = true;
    fetchTracks(startLoadingTransition, setError, () => onAutoFetchCompleteRef.current?.());
  }, [cachedTracks, startLoadingTransition]);

  const handleLoadTracks = (onComplete?: () => void) => {
    fetchTracks(startLoadingTransition, setError, onComplete);
  };

  return { allTracks, isLoadingTracks, handleLoadTracks, error };
};
