"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { loadSavedTracks } from "@/features/playlist-wizard/actions";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";
import type { SavedTracksState } from "@/features/playlist-wizard/types";

type SavedTracks = {
  state: SavedTracksState;
  handleLoadTracks: (onComplete?: () => void) => void;
};

export const useSavedTracks = (onAutoFetchComplete?: () => void): SavedTracks => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const tracks = cachedTracks ?? [];
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [errorState, setErrorState] = useState<string | null>(null);

  const onAutoFetchCompleteRef = useRef(onAutoFetchComplete);
  onAutoFetchCompleteRef.current = onAutoFetchComplete;

  const handleLoadTracks = (onComplete?: () => void): void => {
    startLoadingTransition(async () => {
      setErrorState(null);
      const result = await loadSavedTracks();
      if (!result.ok) {
        setErrorState(result.message);
        return;
      }
      trackCache.set(result.tracks);
      onComplete?.();
    });
  };

  // キャッシュがない場合、マウント時に自動取得 (commit 6 で SC 化により完全削除予定)
  const autoFetchStarted = useRef(false);
  useEffect(() => {
    if (cachedTracks !== null || autoFetchStarted.current) return;
    autoFetchStarted.current = true;
    startLoadingTransition(async () => {
      setErrorState(null);
      const result = await loadSavedTracks();
      if (!result.ok) {
        setErrorState(result.message);
        return;
      }
      trackCache.set(result.tracks);
      onAutoFetchCompleteRef.current?.();
    });
  }, [cachedTracks, startLoadingTransition]);

  const state: SavedTracksState = errorState
    ? { status: "error", tracks, message: errorState }
    : isLoadingTracks
      ? { status: "loading", tracks }
      : { status: "ready", tracks };

  return { state, handleLoadTracks };
};
