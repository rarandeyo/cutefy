"use client";

import { useState, useTransition } from "react";
import type { CalendarDate } from "@internationalized/date";
import { createPlaylist } from "@/features/playlist-wizard/actions";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import {
  INITIAL_PLAYLIST_STATE,
  type PlaylistState,
} from "@/features/playlist-wizard/types/playlist-state";
import type { NameState } from "@/features/playlist-wizard/types/name-state";

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

const USER_ERROR_MESSAGES = {
  unauthorized: "セッションが切れました。再ログインしてください",
  invalid_input: "入力が不正です",
  unknown: "プレイリストの作成に失敗しました",
} as const satisfies Record<string, string>;

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

    setPlaylistState({ kind: "creating" });
    startCreatingTransition(async () => {
      try {
        const result = await createPlaylist({
          name: playlistName.trim(),
          trackUris: filteredTracks.map((t) => t.uri),
        });
        if (result.kind !== "success") {
          setPlaylistState({ kind: "error", message: USER_ERROR_MESSAGES[result.kind] });
          return;
        }
        setPlaylistState({ kind: "success", playlistUrl: result.playlistUrl });
      } catch {
        setPlaylistState({ kind: "error", message: "通信エラーが発生しました" });
      }
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
