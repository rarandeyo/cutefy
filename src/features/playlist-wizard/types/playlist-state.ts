export type PlaylistState =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "creating" }>
  | Readonly<{ kind: "success"; playlistUrl: string }>
  | Readonly<{ kind: "error"; message: string }>;

export const INITIAL_PLAYLIST_STATE = { kind: "idle" } as const satisfies PlaylistState;
