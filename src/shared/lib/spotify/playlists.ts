import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createPlaylistId, type PlaylistId, type SpotifyTrackUri } from "@/shared/types/brands";

const PLAYLIST_ITEMS_BATCH_SIZE = 100;

const chunk = <T>(items: readonly T[], size: number): readonly T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const appendTrackBatches = async (
  sdk: SpotifyApi,
  playlistId: PlaylistId,
  batches: readonly SpotifyTrackUri[][],
): Promise<void> => {
  for (const batch of batches) {
    await sdk.playlists.addItemsToPlaylist(playlistId, batch);
  }
};

type CreatePlaylistParams = {
  sdk: SpotifyApi;
  playlistName: string;
  trackUris: readonly SpotifyTrackUri[];
  description?: string;
  visibility?: "public" | "private";
};

export const createPlaylistFromTracks = async ({
  sdk,
  playlistName,
  trackUris,
  description,
  visibility = "private",
}: CreatePlaylistParams): Promise<{ playlistId: PlaylistId; playlistUrl: string }> => {
  const playlist = await sdk.currentUser.playlists.createPlaylist({
    name: playlistName,
    public: visibility === "public",
    description: description ?? `Created with Cutefy on ${new Date().toLocaleDateString()}`,
  });

  const playlistId = createPlaylistId(playlist.id);
  await appendTrackBatches(sdk, playlistId, chunk(trackUris, PLAYLIST_ITEMS_BATCH_SIZE));

  return {
    playlistId,
    playlistUrl: playlist.external_urls.spotify,
  };
};

type ReplacePlaylistTracksParams = {
  sdk: SpotifyApi;
  playlistId: PlaylistId;
  trackUris: readonly SpotifyTrackUri[];
};

export const replacePlaylistTracks = async ({
  sdk,
  playlistId,
  trackUris,
}: ReplacePlaylistTracksParams): Promise<void> => {
  const [firstBatch = [], ...remainingBatches] = chunk(trackUris, PLAYLIST_ITEMS_BATCH_SIZE);

  await sdk.playlists.updatePlaylistItems(playlistId, { uris: firstBatch });
  await appendTrackBatches(sdk, playlistId, remainingBatches);
};

type UpdatePlaylistDetailsParams = {
  sdk: SpotifyApi;
  playlistId: PlaylistId;
  description: string;
};

export const updatePlaylistDetails = async ({
  sdk,
  playlistId,
  description,
}: UpdatePlaylistDetailsParams): Promise<void> => {
  await sdk.playlists.changePlaylistDetails(playlistId, { description });
};
