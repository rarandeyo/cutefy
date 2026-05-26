"use client";

import { useState, useTransition } from "react";
import type { CalendarDate } from "@internationalized/date";
import { createPlaylist } from "@/app/app/actions";
import type { TrackWithAddedAt } from "@/lib/spotify";
import { INITIAL_PLAYLIST_STATE, type PlaylistState } from "@/types/playlist";

type PlaylistCreation = {
  playlistName: string;
  setPlaylistName: (name: string) => void;
  playlistState: PlaylistState;
  isCreatingPlaylist: boolean;
  handleCreatePlaylist: () => void;
  handleReset: (onComplete?: () => void) => void;
};

const formatCalendarDate = (d: CalendarDate): string =>
  `${d.year}/${String(d.month).padStart(2, "0")}`;

const generateDefaultName = (start: CalendarDate, end: CalendarDate): string =>
  `お気に入り ${formatCalendarDate(start)} - ${formatCalendarDate(end)}`;

export const usePlaylistCreation = (
  filteredTracks: TrackWithAddedAt[],
  dateRange: { startDate: CalendarDate; endDate: CalendarDate },
): PlaylistCreation => {
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
      const result = await createPlaylist({
        name: playlistName.trim(),
        trackUris: filteredTracks.map((t) => t.uri),
      });
      if (!result.ok) {
        setPlaylistState({ status: "error", message: result.message });
        return;
      }
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
