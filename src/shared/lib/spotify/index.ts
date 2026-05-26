import { type AccessToken, type SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk";
import {
  createPlaylistId,
  createSpotifyTrackUri,
  type PlaylistId,
  type SpotifyTrackUri,
} from "@/shared/types/brands";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type TrackWithAddedAt = {
  id: string;
  name: string;
  uri: SpotifyTrackUri;
  artists: string;
  albumName: string;
  albumImageUrl: string | undefined;
  addedAt: Date;
};

type CreateSpotifyClientParams = {
  clientId: string;
  accessToken: string;
  refreshToken?: string;
};

export const createSpotifyClient = ({
  clientId,
  accessToken,
  refreshToken,
}: CreateSpotifyClientParams): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken ?? "",
  };
  return SpotifyApi.withAccessToken(clientId, token);
};

const mapSavedTrackToTrackWithAddedAt = (item: SavedTrack): TrackWithAddedAt => ({
  id: item.track.id,
  name: item.track.name,
  uri: createSpotifyTrackUri(item.track.uri),
  artists: item.track.artists.map((a) => a.name).join(", "),
  albumName: item.track.album.name,
  albumImageUrl: item.track.album.images[0]?.url,
  addedAt: new Date(item.added_at),
});

export const fetchAllSavedTracks = async (
  sdk: SpotifyApi,
): Promise<readonly TrackWithAddedAt[]> => {
  const allTracks: TrackWithAddedAt[] = [];
  const LIMIT = 50;
  let offset = 0;
  let total = 0;

  do {
    const response = await sdk.currentUser.tracks.savedTracks(LIMIT, offset);
    const mappedTracks = response.items.map(mapSavedTrackToTrackWithAddedAt);
    allTracks.push(...mappedTracks);
    total = response.total;
    offset += LIMIT;
  } while (offset < total);

  return allTracks;
};

export const filterTracksByDateRange = (
  tracks: readonly TrackWithAddedAt[],
  dateRange: DateRange,
): readonly TrackWithAddedAt[] =>
  tracks.filter(
    (track) => track.addedAt >= dateRange.startDate && track.addedAt <= dateRange.endDate,
  );

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

  const BATCH_SIZE = 100;
  for (let i = 0; i < trackUris.length; i += BATCH_SIZE) {
    const batch = trackUris.slice(i, i + BATCH_SIZE);
    await sdk.playlists.addItemsToPlaylist(playlist.id, batch);
  }

  return {
    playlistId: createPlaylistId(playlist.id),
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
  const BATCH_SIZE = 100;
  const firstBatch = trackUris.slice(0, BATCH_SIZE);

  await sdk.playlists.updatePlaylistItems(playlistId, { uris: firstBatch });

  for (let i = BATCH_SIZE; i < trackUris.length; i += BATCH_SIZE) {
    const batch = trackUris.slice(i, i + BATCH_SIZE);
    await sdk.playlists.addItemsToPlaylist(playlistId, batch);
  }
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
