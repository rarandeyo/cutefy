"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { loadSavedTracks } from "@/features/playlist-wizard/actions";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import type { SavedTracksState } from "@/features/playlist-wizard/types";

type SavedTracks = {
  state: SavedTracksState;
  handleLoadTracks: () => void;
};

const USER_ERROR_MESSAGES = {
  unauthorized: "セッションが切れました。再ログインしてください",
  unknown: "曲の取得に失敗しました",
} as const satisfies Record<string, string>;

export const useSavedTracks = (initialTracks: readonly TrackWithAddedAt[]): SavedTracks => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const tracks = cachedTracks ?? initialTracks;
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleLoadTracks = (): void => {
    startLoadingTransition(async () => {
      try {
        setErrorState(null);
        const result = await loadSavedTracks();
        if (!result.ok) {
          setErrorState(USER_ERROR_MESSAGES[result.reason]);
          return;
        }
        trackCache.set(result.tracks);
      } catch {
        setErrorState("通信エラーが発生しました");
      }
    });
  };

  const state: SavedTracksState = errorState
    ? { status: "error", tracks, message: errorState }
    : isLoadingTracks
      ? { status: "loading", tracks }
      : { status: "ready", tracks };

  return { state, handleLoadTracks };
};
