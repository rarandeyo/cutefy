import { type AccessToken, type SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk";

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type TrackWithAddedAt = {
  id: string;
  name: string;
  uri: string;
  artists: string;
  albumName: string;
  albumImageUrl: string | undefined;
  addedAt: Date;
};

const createSpotifyClient = (accessToken: string, refreshToken?: string): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken ?? "",
  };
  return SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, token);
};

const mapSavedTrackToTrackWithAddedAt = (item: SavedTrack): TrackWithAddedAt => ({
  id: item.track.id,
  name: item.track.name,
  uri: item.track.uri,
  artists: item.track.artists.map((a) => a.name).join(", "),
  albumName: item.track.album.name,
  albumImageUrl: item.track.album.images[0]?.url,
  addedAt: new Date(item.added_at),
});

export const fetchAllSavedTracks = async (accessToken: string): Promise<TrackWithAddedAt[]> => {
  const sdk = createSpotifyClient(accessToken);
  const allTracks: TrackWithAddedAt[] = [];
  const limit = 50;
  let offset = 0;
  let total = 0;

  do {
    const response = await sdk.currentUser.tracks.savedTracks(limit, offset);
    const mappedTracks = response.items.map(mapSavedTrackToTrackWithAddedAt);
    allTracks.push(...mappedTracks);
    total = response.total;
    offset += limit;
  } while (offset < total);

  return allTracks;
};

export const filterTracksByDateRange = (
  tracks: TrackWithAddedAt[],
  dateRange: DateRange,
): TrackWithAddedAt[] =>
  tracks.filter(
    (track) => track.addedAt >= dateRange.startDate && track.addedAt <= dateRange.endDate,
  );

export const createPlaylistFromTracks = async (
  accessToken: string,
  playlistName: string,
  trackUris: string[],
  isPublic = false,
): Promise<{ playlistId: string; playlistUrl: string }> => {
  const sdk = createSpotifyClient(accessToken);
  const user = await sdk.currentUser.profile();

  const playlist = await sdk.playlists.createPlaylist(user.id, {
    name: playlistName,
    public: isPublic,
    description: `Created with Spotify Playlist Creator on ${new Date().toLocaleDateString()}`,
  });

  // Add tracks in batches of 100 (Spotify API limit)
  const batchSize = 100;
  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);
    await sdk.playlists.addItemsToPlaylist(playlist.id, batch);
  }

  return {
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
  };
};
