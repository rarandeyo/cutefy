import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { clientEnv } from "@/lib/env";
import {
  createSpotifyClient,
  fetchAllSavedTracks,
  type FetchProgress,
  type TrackWithAddedAt,
} from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";

export type SavedTracksState =
  | { status: "loading"; tracks: ReadonlyArray<TrackWithAddedAt>; progress: FetchProgress | null }
  | { status: "loaded"; tracks: ReadonlyArray<TrackWithAddedAt> }
  | { status: "error"; tracks: ReadonlyArray<TrackWithAddedAt>; message: string };

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
      const sdk = createSpotifyClient({
        clientId: clientEnv.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        accessToken: tokenResult.data.accessToken,
      });
      const tracks = await fetchAllSavedTracks(sdk, setProgress);
      trackCache.set(tracks);
      setProgress(null);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "曲の取得中にエラーが発生しました");
      setProgress(null);
    }
  });
};

const buildState = ({
  tracks,
  isLoading,
  progress,
  error,
}: {
  tracks: ReadonlyArray<TrackWithAddedAt>;
  isLoading: boolean;
  progress: FetchProgress | null;
  error: string | null;
}): SavedTracksState => {
  if (isLoading) return { status: "loading", tracks, progress };
  if (error !== null) return { status: "error", tracks, message: error };
  return { status: "loaded", tracks };
};

export const useSavedTracks = (onAutoFetchComplete?: () => void) => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const tracks: ReadonlyArray<TrackWithAddedAt> = cachedTracks ?? [];
  const [isLoading, startLoadingTransition] = useTransition();
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onAutoFetchCompleteRef = useRef(onAutoFetchComplete);
  onAutoFetchCompleteRef.current = onAutoFetchComplete;

  // localStorage キャッシュが空のときだけ初回マウントで自動取得する。
  // 外部システム (localStorage 経由のキャッシュ) との同期なので Effect で記述。
  const autoFetchStarted = useRef(false);
  useEffect(() => {
    if (cachedTracks !== null || autoFetchStarted.current) return;
    autoFetchStarted.current = true;
    fetchTracks(startLoadingTransition, setProgress, setError, () =>
      onAutoFetchCompleteRef.current?.(),
    );
  }, [cachedTracks, startLoadingTransition]);

  const handleLoadTracks = (onComplete?: () => void): void => {
    fetchTracks(startLoadingTransition, setProgress, setError, onComplete);
  };

  return {
    state: buildState({ tracks, isLoading, progress, error }),
    handleLoadTracks,
  };
};
