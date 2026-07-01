"use server";

import { Result } from "@praha/byethrow";
import { z } from "zod";
import { assertNever } from "@/shared/lib/assert-never";
import {
  createPlaylistFromTracks,
  fetchAllSavedTracks,
  type CreatePlaylistFromTracksError,
  type FetchSavedTracksError,
  type TrackWithAddedAt,
} from "@/shared/lib/spotify";
import {
  getSpotifyClientForCurrentUser,
  type SpotifyClientError,
} from "@/shared/lib/spotify/server";
import { schemaParse } from "@/shared/lib/validation";
import type { PlaylistId } from "@/shared/types/playlist-id";
import { SpotifyTrackUri } from "@/shared/types/spotify-track-uri";

export type LoadSavedTracksResult =
  | Readonly<{ kind: "success"; tracks: readonly TrackWithAddedAt[] }>
  | Readonly<{ kind: "unauthorized"; message: string }>
  | Readonly<{ kind: "unknown"; message: string }>;

export type CreatePlaylistResult =
  | Readonly<{ kind: "success"; playlistUrl: string; playlistId: PlaylistId }>
  | Readonly<{ kind: "unauthorized"; message: string }>
  | Readonly<{ kind: "invalid_input"; message: string }>
  | Readonly<{ kind: "unknown"; message: string }>;

const createPlaylistInputSchema = z.object({
  name: z.string().min(1).max(100),
  trackUris: z.array(SpotifyTrackUri.schema).min(1),
});

const parseCreatePlaylistInput = schemaParse(createPlaylistInputSchema);

export type CreatePlaylistInput = z.input<typeof createPlaylistInputSchema>;

const toLoadSavedTracksFailure = (
  error: SpotifyClientError | FetchSavedTracksError,
): LoadSavedTracksResult => {
  switch (error.kind) {
    case "SessionNotFound":
    case "AccessTokenUnavailable":
      return { kind: "unauthorized", message: "Spotify セッションが無効です" };
    case "AuthServiceError":
    case "SpotifyApiError":
    case "ValidationError":
      return { kind: "unknown", message: "曲の取得に失敗しました" };
    default:
      return assertNever(error);
  }
};

export const loadSavedTracks = async (): Promise<LoadSavedTracksResult> => {
  const result = await Result.pipe(
    getSpotifyClientForCurrentUser(),
    Result.andThen(({ sdk }) => fetchAllSavedTracks(sdk)),
  );
  return Result.isSuccess(result)
    ? { kind: "success", tracks: result.value }
    : toLoadSavedTracksFailure(result.error);
};

const toCreatePlaylistFailure = (
  error: SpotifyClientError | CreatePlaylistFromTracksError,
): CreatePlaylistResult => {
  switch (error.kind) {
    case "SessionNotFound":
    case "AccessTokenUnavailable":
      return { kind: "unauthorized", message: "Spotify セッションが無効です" };
    case "AuthServiceError":
    case "SpotifyApiError":
    case "ValidationError":
    case "PlaylistNotFound":
      return { kind: "unknown", message: "プレイリストの作成に失敗しました" };
    default:
      return assertNever(error);
  }
};

export const createPlaylist = async (input: CreatePlaylistInput): Promise<CreatePlaylistResult> => {
  const parsed = parseCreatePlaylistInput(input);
  if (Result.isFailure(parsed)) {
    return {
      kind: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "入力が不正です",
    };
  }

  const result = await Result.pipe(
    getSpotifyClientForCurrentUser(),
    Result.andThen(({ sdk }) =>
      createPlaylistFromTracks({
        sdk,
        playlistName: parsed.value.name,
        trackUris: parsed.value.trackUris,
      }),
    ),
  );
  return Result.isSuccess(result)
    ? {
        kind: "success",
        playlistUrl: result.value.playlistUrl,
        playlistId: result.value.playlistId,
      }
    : toCreatePlaylistFailure(result.error);
};
