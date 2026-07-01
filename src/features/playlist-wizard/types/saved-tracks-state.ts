import type { TrackWithAddedAt } from "@/shared/lib/spotify";

export type SavedTracksState =
  | Readonly<{ kind: "ready"; tracks: readonly TrackWithAddedAt[] }>
  | Readonly<{ kind: "loading"; tracks: readonly TrackWithAddedAt[] }>
  | Readonly<{ kind: "error"; tracks: readonly TrackWithAddedAt[]; message: string }>;
