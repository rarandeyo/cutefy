import type { TrackWithAddedAt } from "@/shared/lib/spotify";

export type PlaylistState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "success"; playlistUrl: string }
  | { status: "error"; message: string };

export const INITIAL_PLAYLIST_STATE = { status: "idle" } as const satisfies PlaylistState;

export type SavedTracksState =
  | { status: "ready"; tracks: readonly TrackWithAddedAt[] }
  | { status: "loading"; tracks: readonly TrackWithAddedAt[] }
  | { status: "error"; tracks: readonly TrackWithAddedAt[]; message: string };

export type NameState = { kind: "auto" } | { kind: "manual"; value: string };

export type DateRangeValidation = { status: "valid" } | { status: "invalid"; message: string };
