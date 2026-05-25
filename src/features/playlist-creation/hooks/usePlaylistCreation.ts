import { useState, useTransition } from "react";
import type { CalendarDate } from "@internationalized/date";
import { authClient } from "@/lib/auth-client";
import { clientEnv } from "@/lib/env";
import type { CalendarDateRange } from "@/features/playlist-creation/hooks/useDateFilter";
import {
  createPlaylistFromTracks,
  createSpotifyClient,
  type TrackWithAddedAt,
} from "@/lib/spotify";
import { INITIAL_PLAYLIST_STATE, type PlaylistState } from "@/features/playlist-creation/types";

const formatCalendarDate = (d: CalendarDate) => `${d.year}/${String(d.month).padStart(2, "0")}`;

const generateDefaultName = (start: CalendarDate, end: CalendarDate): string =>
  `お気に入り ${formatCalendarDate(start)} - ${formatCalendarDate(end)}`;

export const usePlaylistCreation = (
  filteredTracks: ReadonlyArray<TrackWithAddedAt>,
  dateRange: CalendarDateRange,
) => {
  const [manualName, setManualName] = useState("");
  const [isNameManuallySet, setIsNameManuallySet] = useState(false);
  const [playlistState, setPlaylistState] = useState<PlaylistState>(INITIAL_PLAYLIST_STATE);
  const [isCreatingPlaylist, startCreatingTransition] = useTransition();

  const playlistName = isNameManuallySet
    ? manualName
    : generateDefaultName(dateRange.startDate, dateRange.endDate);

  const handlePlaylistNameChange = (name: string) => {
    setManualName(name);
    setIsNameManuallySet(true);
  };

  const handleCreatePlaylist = () => {
    if (!playlistName.trim() || filteredTracks.length === 0) return;

    startCreatingTransition(async () => {
      try {
        const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
        if (tokenResult.error || !tokenResult.data) {
          setPlaylistState({ status: "error", message: "認証エラーが発生しました" });
          return;
        }

        const trackUris = filteredTracks.map((t) => t.uri);
        const sdk = createSpotifyClient({
          clientId: clientEnv.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
          accessToken: tokenResult.data.accessToken,
        });
        const result = await createPlaylistFromTracks({
          sdk,
          playlistName: playlistName.trim(),
          trackUris,
        });
        setPlaylistState({
          status: "success",
          message: "プレイリストを作成しました！",
          playlistUrl: result.playlistUrl,
        });
      } catch (e) {
        setPlaylistState({
          status: "error",
          message: e instanceof Error ? e.message : "エラーが発生しました",
        });
      }
    });
  };

  const handleReset = (onComplete?: () => void) => {
    setManualName("");
    setIsNameManuallySet(false);
    setPlaylistState(INITIAL_PLAYLIST_STATE);
    onComplete?.();
  };

  return {
    playlistName,
    setPlaylistName: handlePlaylistNameChange,
    playlistState,
    isCreatingPlaylist,
    handleCreatePlaylist,
    handleReset,
  };
};
