import { Result } from "@praha/byethrow";
import { z } from "zod";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { chunk } from "@/shared/lib/chunk";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";
import { PlaylistId } from "@/shared/types/playlist-id";
import type { SpotifyTrackUri } from "@/shared/types/spotify-track-uri";
import { SpotifyApiError } from "./spotify-api-error";

const PLAYLIST_ITEMS_BATCH_SIZE = 100;

export type PlaylistNotFoundError = Readonly<{
  kind: "PlaylistNotFound";
  playlistId: PlaylistId;
}>;

export type PlaylistWriteError = SpotifyApiError | PlaylistNotFoundError;

const toPlaylistWriteError =
  (playlistId: PlaylistId) =>
  (cause: unknown): PlaylistWriteError =>
    SpotifyApiError.isNotFound(cause)
      ? { kind: "PlaylistNotFound", playlistId }
      : SpotifyApiError.of(cause);

const appendTrackBatches = (
  sdk: SpotifyApi,
  playlistId: PlaylistId,
  batches: readonly (readonly SpotifyTrackUri[])[],
): Result.ResultAsync<readonly unknown[], PlaylistWriteError> =>
  // 追加順を保つため逐次実行 (sequence は最初の失敗で停止する)
  Result.sequence(batches, (batch) =>
    Result.try({
      try: () => sdk.playlists.addItemsToPlaylist(playlistId, [...batch]),
      catch: toPlaylistWriteError(playlistId),
    }),
  );

const createdPlaylistSchema = z.object({
  id: PlaylistId.schema,
  external_urls: z.object({ spotify: z.string() }),
});

const parseCreatedPlaylist = schemaParse(createdPlaylistSchema);

export type CreatedPlaylist = Readonly<{
  playlistId: PlaylistId;
  playlistUrl: string;
}>;

export type CreatePlaylistFromTracksError = PlaylistWriteError | ValidationError;

type CreatePlaylistParams = Readonly<{
  sdk: SpotifyApi;
  playlistName: string;
  trackUris: readonly SpotifyTrackUri[];
  description?: string;
  visibility?: "public" | "private";
}>;

export const createPlaylistFromTracks = ({
  sdk,
  playlistName,
  trackUris,
  description,
  visibility = "private",
}: CreatePlaylistParams): Result.ResultAsync<CreatedPlaylist, CreatePlaylistFromTracksError> =>
  Result.pipe(
    Result.try({
      try: () =>
        sdk.currentUser.playlists.createPlaylist({
          name: playlistName,
          public: visibility === "public",
          description: description ?? `Created with Cutefy on ${new Date().toLocaleDateString()}`,
        }),
      catch: SpotifyApiError.of,
    }),
    Result.andThen(parseCreatedPlaylist),
    Result.map(
      (playlist): CreatedPlaylist => ({
        playlistId: playlist.id,
        playlistUrl: playlist.external_urls.spotify,
      }),
    ),
    Result.andThrough(({ playlistId }) =>
      appendTrackBatches(sdk, playlistId, chunk(trackUris, PLAYLIST_ITEMS_BATCH_SIZE)),
    ),
  );

type ReplacePlaylistTracksParams = Readonly<{
  sdk: SpotifyApi;
  playlistId: PlaylistId;
  trackUris: readonly SpotifyTrackUri[];
}>;

export const replacePlaylistTracks = ({
  sdk,
  playlistId,
  trackUris,
}: ReplacePlaylistTracksParams): Result.ResultAsync<void, PlaylistWriteError> => {
  const [firstBatch = [], ...remainingBatches] = chunk(trackUris, PLAYLIST_ITEMS_BATCH_SIZE);
  return Result.pipe(
    Result.try({
      try: () => sdk.playlists.updatePlaylistItems(playlistId, { uris: [...firstBatch] }),
      catch: toPlaylistWriteError(playlistId),
    }),
    Result.andThen(() => appendTrackBatches(sdk, playlistId, remainingBatches)),
    Result.map((): void => undefined),
  );
};

type UpdatePlaylistDetailsParams = Readonly<{
  sdk: SpotifyApi;
  playlistId: PlaylistId;
  description: string;
}>;

export const updatePlaylistDetails = ({
  sdk,
  playlistId,
  description,
}: UpdatePlaylistDetailsParams): Result.ResultAsync<void, PlaylistWriteError> =>
  Result.pipe(
    Result.try({
      try: () => sdk.playlists.changePlaylistDetails(playlistId, { description }),
      catch: toPlaylistWriteError(playlistId),
    }),
    Result.map((): void => undefined),
  );
