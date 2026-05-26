"use server";

import { z } from "zod";
import {
  createPlaylistFromTracks,
  fetchAllSavedTracks,
  type TrackWithAddedAt,
} from "@/shared/lib/spotify";
import { getSpotifyClientForCurrentUser, UnauthorizedError } from "@/shared/lib/spotify/server";
import { createSpotifyTrackUri, type PlaylistId } from "@/shared/types/brands";
import { errorMessage } from "@/shared/lib/error";

export type LoadSavedTracksResult =
  | { ok: true; tracks: readonly TrackWithAddedAt[] }
  | { ok: false; reason: "unauthorized" | "unknown"; message: string };

export type CreatePlaylistResult =
  | { ok: true; playlistUrl: string; playlistId: PlaylistId }
  | { ok: false; reason: "unauthorized" | "invalid_input" | "unknown"; message: string };

const createPlaylistInputSchema = z.object({
  name: z.string().min(1).max(100),
  trackUris: z
    .array(z.string().min(1))
    .min(1)
    .transform((uris) => uris.map(createSpotifyTrackUri)),
});

export type CreatePlaylistInput = z.input<typeof createPlaylistInputSchema>;

export const loadSavedTracks = async (): Promise<LoadSavedTracksResult> => {
  try {
    const { sdk } = await getSpotifyClientForCurrentUser();
    const tracks = await fetchAllSavedTracks(sdk);
    return { ok: true, tracks };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { ok: false, reason: "unauthorized", message: error.message };
    }
    return {
      ok: false,
      reason: "unknown",
      message: errorMessage(error, "曲の取得に失敗しました"),
    };
  }
};

export const createPlaylist = async (input: CreatePlaylistInput): Promise<CreatePlaylistResult> => {
  const parsed = createPlaylistInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "入力が不正です",
    };
  }

  try {
    const { sdk } = await getSpotifyClientForCurrentUser();
    const result = await createPlaylistFromTracks({
      sdk,
      playlistName: parsed.data.name,
      trackUris: parsed.data.trackUris,
    });
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { ok: false, reason: "unauthorized", message: error.message };
    }
    return {
      ok: false,
      reason: "unknown",
      message: errorMessage(error, "プレイリストの作成に失敗しました"),
    };
  }
};
