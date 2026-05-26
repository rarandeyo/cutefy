export type PlaylistState =
  | { status: "idle" }
  | { status: "success"; message: string; playlistUrl: string }
  | { status: "error"; message: string };

export const INITIAL_PLAYLIST_STATE = { status: "idle" } as const satisfies PlaylistState;
