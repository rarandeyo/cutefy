"use server";

import { Result } from "@praha/byethrow";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { z } from "zod";
import { claimActionCooldown, type CooldownActiveError } from "@/shared/lib/action-cooldown";
import { assertNever } from "@/shared/lib/assert-never";
import { getCurrentUserId } from "@/shared/lib/auth/current-user";
import { getAuth } from "@/shared/lib/auth/server";
import { createDb } from "@/shared/lib/db";
import type { DatabaseError } from "@/shared/lib/db/database-error";
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
  | Readonly<{ kind: "rate_limited"; cooldownMs: number }>
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
  error: SpotifyClientError | CooldownActiveError | DatabaseError | FetchSavedTracksError,
): LoadSavedTracksResult => {
  switch (error.kind) {
    case "SessionNotFound":
    case "AccessTokenUnavailable":
      return { kind: "unauthorized", message: "Spotify セッションが無効です" };
    case "CooldownActive":
      return { kind: "rate_limited", cooldownMs: error.cooldownMs };
    case "AuthServiceError":
    case "DatabaseError":
    case "SpotifyApiError":
    case "ValidationError":
      return { kind: "unknown", message: "曲の取得に失敗しました" };
    default:
      return assertNever(error);
  }
};

export const loadSavedTracks = async (): Promise<LoadSavedTracksResult> => {
  const now = new Date();
  const result = await Result.pipe(
    Result.do(),
    Result.bind("userId", async () => {
      const auth = await getAuth();
      const requestHeaders = await headers();
      return getCurrentUserId(auth, requestHeaders);
    }),
    // アクセストークンの取得は期限切れなら Spotify への更新要求になるので、クールダウンの判定を先に行う
    Result.andThrough(async ({ userId }) => {
      const { env } = await getCloudflareContext({ async: true });
      return claimActionCooldown(createDb(env.DB), userId, "load_saved_tracks", now);
    }),
    Result.andThen(() => getSpotifyClientForCurrentUser()),
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

  // 時刻はエントリポイントで取得し、lib 側には値として渡す
  const createdOn = new Date().toLocaleDateString();
  const result = await Result.pipe(
    getSpotifyClientForCurrentUser(),
    Result.andThen(({ sdk }) =>
      createPlaylistFromTracks({
        sdk,
        playlistName: parsed.value.name,
        trackUris: parsed.value.trackUris,
        description: `Created with Cutefy on ${createdOn}`,
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
