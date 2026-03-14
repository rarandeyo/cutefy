import { useState, useTransition } from "react";
import type { CalendarDate } from "@internationalized/date";
import { authClient } from "@/lib/auth-client";
import { createPlaylistFromTracks, type TrackWithAddedAt } from "@/lib/spotify";
import { INITIAL_PLAYLIST_STATE, type PlaylistState } from "@/types/playlist";

const formatCalendarDate = (d: CalendarDate) => `${d.year}/${String(d.month).padStart(2, "0")}`;

const generateDefaultName = (start: CalendarDate, end: CalendarDate): string =>
  `お気に入り ${formatCalendarDate(start)} - ${formatCalendarDate(end)}`;

export const usePlaylistCreation = (
  filteredTracks: TrackWithAddedAt[],
  dateRange: { startDate: CalendarDate; endDate: CalendarDate },
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
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        setPlaylistState({ status: "error", message: "認証エラーが発生しました" });
        return;
      }

      const trackUris = filteredTracks.map((t) => t.uri);
      const result = await createPlaylistFromTracks({
        accessToken: tokenResult.data.accessToken,
        playlistName: playlistName.trim(),
        trackUris,
      });
      setPlaylistState({
        status: "success",
        message: "プレイリストを作成しました！",
        playlistUrl: result.playlistUrl,
      });
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
