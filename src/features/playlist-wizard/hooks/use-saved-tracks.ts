"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { loadSavedTracks } from "@/features/playlist-wizard/actions";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import type { SavedTracksState } from "@/features/playlist-wizard/types";

type SavedTracks = {
  state: SavedTracksState;
  handleLoadTracks: () => Promise<void>;
};

export const useSavedTracks = (initialTracks: readonly TrackWithAddedAt[]): SavedTracks => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const tracks = cachedTracks ?? initialTracks;
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleLoadTracks = (): Promise<void> =>
    new Promise((resolve) => {
      startLoadingTransition(async () => {
        setErrorState(null);
        const result = await loadSavedTracks();
        if (!result.ok) {
          setErrorState(result.message);
          resolve();
          return;
        }
        trackCache.set(result.tracks);
        resolve();
      });
    });

  const state: SavedTracksState = errorState
    ? { status: "error", tracks, message: errorState }
    : isLoadingTracks
      ? { status: "loading", tracks }
      : { status: "ready", tracks };

  return { state, handleLoadTracks };
};
