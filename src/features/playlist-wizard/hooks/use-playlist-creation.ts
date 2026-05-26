"use client";

import { useState, useTransition } from "react";
import type { CalendarDate } from "@internationalized/date";
import { createPlaylist } from "@/features/playlist-wizard/actions";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import {
  INITIAL_PLAYLIST_STATE,
  type NameState,
  type PlaylistState,
} from "@/features/playlist-wizard/types";

type PlaylistCreation = {
  playlistName: string;
  setPlaylistName: (name: string) => void;
  playlistState: PlaylistState;
  handleCreatePlaylist: () => void;
  handleReset: (onComplete?: () => void) => void;
};

const formatCalendarDate = (d: CalendarDate): string =>
  `${d.year}/${String(d.month).padStart(2, "0")}`;

const generateDefaultName = (start: CalendarDate, end: CalendarDate): string =>
  `お気に入り ${formatCalendarDate(start)} - ${formatCalendarDate(end)}`;

export const usePlaylistCreation = (
  filteredTracks: readonly TrackWithAddedAt[],
  dateRange: { startDate: CalendarDate; endDate: CalendarDate },
): PlaylistCreation => {
  const [nameState, setNameState] = useState<NameState>({ kind: "auto" });
  const [playlistState, setPlaylistState] = useState<PlaylistState>(INITIAL_PLAYLIST_STATE);
  const [, startCreatingTransition] = useTransition();

  const playlistName =
    nameState.kind === "manual"
      ? nameState.value
      : generateDefaultName(dateRange.startDate, dateRange.endDate);

  const setPlaylistName = (name: string): void => {
    setNameState({ kind: "manual", value: name });
  };

  const handleCreatePlaylist = (): void => {
    if (!playlistName.trim() || filteredTracks.length === 0) return;

    setPlaylistState({ status: "creating" });
    startCreatingTransition(async () => {
      const result = await createPlaylist({
        name: playlistName.trim(),
        trackUris: filteredTracks.map((t) => t.uri),
      });
      if (!result.ok) {
        setPlaylistState({ status: "error", message: result.message });
        return;
      }
      setPlaylistState({ status: "success", playlistUrl: result.playlistUrl });
    });
  };

  const handleReset = (onComplete?: () => void): void => {
    setNameState({ kind: "auto" });
    setPlaylistState(INITIAL_PLAYLIST_STATE);
    onComplete?.();
  };

  return {
    playlistName,
    setPlaylistName,
    playlistState,
    handleCreatePlaylist,
    handleReset,
  };
};
