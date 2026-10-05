"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { loadSavedTracks } from "@/features/playlist-wizard/actions";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import type { SavedTracksState } from "@/features/playlist-wizard/types/saved-tracks-state";

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
        switch (result.kind) {
          case "success":
            trackCache.set(result.tracks);
            return;
          case "rate_limited":
            setErrorState(
              `曲の再取得は ${Math.ceil(result.cooldownMs / 60_000)} 分に 1 回までです。少し待ってからお試しください`,
            );
            return;
          case "unauthorized":
          case "unknown":
            setErrorState(USER_ERROR_MESSAGES[result.kind]);
            return;
        }
      } catch {
        setErrorState("通信エラーが発生しました");
      }
    });
  };

  const state: SavedTracksState = errorState
    ? { kind: "error", tracks, message: errorState }
    : isLoadingTracks
      ? { kind: "loading", tracks }
      : { kind: "ready", tracks };

  return { state, handleLoadTracks };
};
